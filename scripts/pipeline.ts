import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Only models that are confirmed working.
// Official BFL models (no version hash) never break.
// Community models use verified current hashes.
const MODELS = {
  // Official — no version hash, always current
  fluxKontextMax: "black-forest-labs/flux-kontext-max",
  fluxPro:        "black-forest-labs/flux-1.1-pro",
  // Community — pinned to verified working hash (May 2026)
  // lucataco/faceswap was removed from Replicate — replaced by codeplugtech
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
  console.log("[Pipeline] FLUX Kontext Max – style edit");
  return withRetry(() => runFluxKontext(imageUrl, prompt, "match_input_image"));
}

// ─── COMPOSITION PIPELINE ─────────────────────────────────────────────────────
//
// Previous approaches failed because we sent FLUX a composite/split image
// (user + grey void, or user + celebrity side-by-side) — FLUX interpreted these
// as "comparison" layouts and generated unrelated results.
//
// Correct approach:
//   Give FLUX Kontext the user's ORIGINAL photo and ask it to extend the frame
//   to the right and add the celebrity in the new space. FLUX Kontext was built
//   for exactly this type of instruction-following edit.
//
//   For famous celebrities, FLUX has seen them in training and generates a
//   recognisable likeness. No community models needed — zero version-hash risk.

async function runCompositionPipeline(
  userImageUrl: string,
  rawPrompt: string,
  stylePrompt: string
): Promise<string> {
  const personName = extractPersonName(rawPrompt);
  const action = extractActionEn(rawPrompt);
  console.log(`[Pipeline] Composition – celebrity: "${personName ?? "none"}" | action: "${action}"`);

  const prompt = buildCompositionPrompt(personName, action, stylePrompt);
  console.log(`[Pipeline] FLUX Kontext – extend + add: "${prompt.slice(0, 100)}…"`);
  return withRetry(() => runFluxKontext(userImageUrl, prompt, "16:9"));
}

// ─── SWAPFACE PIPELINE ────────────────────────────────────────────────────────

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  console.log("[Pipeline] FaceSwap (codeplugtech)…");
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
  ];
  if (spatialTriggers.some((kw) => p.includes(kw))) return true;

  // "met(s) moi [ProperNoun]" — uppercase initial signals a name
  if (/\b(?:mets?|met)\s+moi\s+[A-Z]/u.test(prompt)) return true;

  const actionVerbs = ["ajoute", "rajoute", "add", "mets", "place", "met "];
  const personNouns = ["personne", "homme", "femme", "quelqu'un", "person", "man", "woman", "someone", "celebrity", "célébrité"];
  return actionVerbs.some((v) => p.includes(v)) && personNouns.some((n) => p.includes(n));
}

// "Met moi Charlie D'Amelio à côté de moi entrain de regarder la caméra"
// → "Charlie D'Amelio"
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

function extractActionEn(prompt: string): string {
  const lp = prompt.toLowerCase();
  if (lp.includes("caméra") || lp.includes("camera") || lp.includes("objectif")) return "looking directly at the camera";
  if (lp.includes("sourir") || lp.includes("smile") || lp.includes("souriant")) return "smiling at the camera";
  if (lp.includes("pos") || lp.includes("pose")) return "posing naturally for the camera";
  if (lp.includes("danse") || lp.includes("danc")) return "dancing";
  return "looking at the camera and smiling";
}

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildCompositionPrompt(
  personName: string | null,
  action: string,
  stylePrompt: string
): string {
  const styleNote = stylePrompt.trim() ? ` ${stylePrompt.trim()}.` : "";
  const celeb = personName ?? "another person";
  return (
    `Extend this photo to a wide 16:9 format by adding space on the RIGHT. ` +
    `In the new right portion, place ${celeb} standing naturally next to the existing person, ${action}, ` +
    `photorealistic, well-lit, matching the lighting and background of the left side exactly. ` +
    `THE PERSON ALREADY IN THE PHOTO (LEFT SIDE) must remain COMPLETELY UNCHANGED — ` +
    `identical face, hair, skin, clothes, expression, and pose. Do not modify them at all. ` +
    `The final result must look like a single genuine photo of both people together.${styleNote}`
  );
}

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
        source_image: sourceImageUrl,
        target_image: targetImageUrl,
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
