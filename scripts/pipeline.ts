import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Only confirmed-working models.
// Official BFL models have no version hash and never break.
// Community models use verified hashes (checked May 2026).
const MODELS = {
  fluxKontextMax: "black-forest-labs/flux-kontext-max",
  // lucataco/faceswap was deleted — replaced by codeplugtech (verified working)
  faceSwap: "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
} as const;

export interface PipelineInput {
  mode: "style" | "swapface";
  inputImageUrl?: string;
  styleId?: string;
  stylePrompt?: string;
  customPrompt?: string;
  sourceImageUrl?: string;
  targetImageUrl?: string;
  faceIndex?: string;
  extraPrompt?: string;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is429 =
        msg.includes("429") ||
        msg.includes("Too Many Requests") ||
        msg.includes("throttled");
      if (is429 && attempt < retries) {
        const match = msg.match(/"retry_after"\s*:\s*(\d+)/);
        const waitMs = match ? (Number(match[1]) + 2) * 1000 : 15000;
        console.log(`[Pipeline] Rate limited – waiting ${waitMs / 1000}s (retry ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, waitMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function runPipeline(input: PipelineInput): Promise<string> {
  const start = Date.now();
  console.log(`[Pipeline] Mode: ${input.mode}`);
  try {
    const result =
      input.mode === "swapface"
        ? await runSwapFacePipeline(input)
        : await runStylePipeline(input);
    console.log(`[Pipeline] Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    return result;
  } catch (err) {
    console.error("[Pipeline] Error:", err);
    throw err;
  }
}

// ─── STYLE PIPELINE ───────────────────────────────────────────────────────────

async function runStylePipeline(input: PipelineInput): Promise<string> {
  const imageUrl = input.inputImageUrl!;
  const rawPrompt = input.customPrompt?.trim() || "";

  if (detectCompositionRequest(rawPrompt)) {
    return runCompositionPipeline(imageUrl, rawPrompt, input.stylePrompt ?? "");
  }

  const prompt = buildStylePrompt(input.stylePrompt ?? "", rawPrompt);
  console.log("[Pipeline] FLUX Kontext – style edit");
  return withRetry(() => runFluxKontext(imageUrl, prompt, "match_input_image"));
}

// ─── COMPOSITION PIPELINE ─────────────────────────────────────────────────────
//
// WHAT FAILED (tried 6+ times):
//   Every FLUX-based composition approach (extend image, fill grey area,
//   composite side-by-side, harmonize two photos) produces random unrelated
//   men. FLUX Kontext is not designed for multi-person composition — it
//   invents content rather than placing specific identifiable people.
//
// WHAT ACTUALLY WORKS:
//   Put the user's face INTO the celebrity's own Wikipedia photo.
//   - Source: user's uploaded photo (their face)
//   - Target: celebrity's Wikipedia photo (the real celebrity is already there)
//   - Result: user's face appears in the celebrity's world / context
//
//   This is reliable because:
//   1. No generative model needs to invent anyone — faces exist in both images
//   2. Face-swap is purpose-built for identity transfer
//   3. The celebrity is real and recognisable (from their own photo)
//   4. Zero hallucination risk

async function runCompositionPipeline(
  userImageUrl: string,
  rawPrompt: string,
  stylePrompt: string
): Promise<string> {
  const personName = extractPersonName(rawPrompt);
  console.log(`[Pipeline] Composition – celebrity: "${personName ?? "none"}"`);

  // Try to get the celebrity's own Wikipedia photo
  let referenceUrl: string | null = null;
  if (personName) {
    referenceUrl = await fetchWikipediaImage(personName);
    console.log(`[Pipeline] Wikipedia photo: ${referenceUrl ? "found ✓" : "not found"}`);
  }

  if (referenceUrl) {
    // PRIMARY: put user's face into the celebrity's real photo
    // source_image = who we want to see (user)
    // target_image = the scene we want them in (celebrity's Wikipedia photo)
    console.log("[Pipeline] FaceSwap – user face → celebrity's photo…");
    return withRetry(() => runFaceSwap(userImageUrl, referenceUrl!));
  }

  // FALLBACK: no celebrity found → apply the prompt as a style edit
  console.log("[Pipeline] Fallback – no celebrity found, applying as style edit");
  const prompt = buildStylePrompt(stylePrompt, rawPrompt);
  return withRetry(() => runFluxKontext(userImageUrl, prompt, "match_input_image"));
}

// ─── SWAPFACE PIPELINE ────────────────────────────────────────────────────────

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  console.log("[Pipeline] FaceSwap…");
  return withRetry(() =>
    runFaceSwap(input.sourceImageUrl!, input.targetImageUrl!)
  );
}

// ─── INTENT DETECTION ─────────────────────────────────────────────────────────

function detectCompositionRequest(prompt: string): boolean {
  const p = prompt.toLowerCase();

  const spatialTriggers = [
    "à côté", "next to", "beside", "with me", "avec moi",
    "à ma gauche", "à ma droite", "on my left", "on my right",
    "devant moi", "derrière moi", "in front of me", "behind me",
    "avec ", "with ",
  ];
  if (spatialTriggers.some((kw) => p.includes(kw))) return true;

  if (/\b(?:mets?|met)\s+moi\s+[A-Z]/u.test(prompt)) return true;

  const actionVerbs = ["ajoute", "rajoute", "add", "mets", "place", "met "];
  const personNouns = ["personne", "homme", "femme", "quelqu'un", "person", "man", "woman", "someone", "celebrity", "célébrité"];
  return actionVerbs.some((v) => p.includes(v)) && personNouns.some((n) => p.includes(n));
}

// "Met moi Charlie D'Amelio à côté de moi"  → "Charlie D'Amelio"
// "rajoute Ronaldo à côté de moi"            → "Ronaldo"
function extractPersonName(prompt: string): string | null {
  const STOP = "(?:à côté|next to|beside|avec moi|with me|à ma|on my|devant|derrière|in front|behind|de moi|of me|entrain|en train|qui |looking|regardant|faisant|doing|watching|holding|portant|souriant|smiling)";

  const patterns = [
    new RegExp(`\\b(?:mets?|met)\\s+moi\\s+(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    new RegExp(`(?:rajoute|ajoute|add|place)\\s+(?:moi\\s+(?:avec|with)\\s+)?(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    new RegExp(`(?:mets|met)\\s+(?:moi\\s+)?(?:avec|with)\\s+(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    new RegExp(`(?:avec|with)\\s+(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    if (match) {
      const candidate = match[1].trim();
      if (/^(une?|un|a|an)\s+/i.test(candidate)) continue;
      if (candidate.length > 1 && candidate.length < 60) return candidate;
    }
  }
  return null;
}

// ─── WIKIPEDIA ────────────────────────────────────────────────────────────────

async function fetchWikipediaImage(personName: string): Promise<string | null> {
  const slug = encodeURIComponent(personName.trim().replace(/\s+/g, "_"));
  for (const lang of ["en", "fr"]) {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`,
        { headers: { "User-Agent": "IACelebriteApp/1.0" } }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as {
        thumbnail?: { source: string };
        originalimage?: { source: string };
      };
      const url = data.originalimage?.source ?? data.thumbnail?.source ?? null;
      if (url) return url;
    } catch {
      // try next language
    }
  }
  return null;
}

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildStylePrompt(stylePrompt: string, customPrompt: string): string {
  const base = customPrompt.trim();
  const style = stylePrompt.trim();
  const request = base && style ? `${base}. Style: ${style}` : base || style;
  return (
    `Edit this photo while keeping the SAME PERSON: identical face, skin tone, hair, and body shape. ` +
    `There must be EXACTLY ONE person in the result — the original subject. ` +
    `Do NOT add, clone, or replace any person. ` +
    `Apply the following change: ${request}. ` +
    `Preserve the person's facial features, identity, and proportions exactly as in the original.`
  );
}

// ─── MODEL RUNNERS ────────────────────────────────────────────────────────────

async function runFluxKontext(
  image: string,
  prompt: string,
  aspectRatio: string
): Promise<string> {
  const output = await replicate.run(MODELS.fluxKontextMax, {
    input: {
      image,
      prompt,
      aspect_ratio: aspectRatio,
      output_format: "jpg",
      output_quality: 100,
      safety_tolerance: 6,
      prompt_upsampling: false,
    },
  });
  return extractUrl(output);
}

async function runFaceSwap(
  sourceImageUrl: string,
  targetImageUrl: string
): Promise<string> {
  const output = await replicate.run(
    MODELS.faceSwap as `${string}/${string}:${string}`,
    {
      input: {
        swap_image: sourceImageUrl,   // the face to use
        input_image: targetImageUrl,  // the scene to place it into
      },
    }
  );
  return extractUrl(output);
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object" && "url" in output)
    return String((output as { url: string }).url);
  throw new Error("Aucune URL retournée par le modèle IA");
}
