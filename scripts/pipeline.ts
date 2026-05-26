import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  // Image editing — style transforms only
  fluxKontextMax: "black-forest-labs/flux-kontext-max",
  // Text-to-image — generates the 2-person composition template
  fluxPro: "black-forest-labs/flux-1.1-pro",
  // Face identity swap
  faceSwap: "lucataco/faceswap:9a4298548422074c3f57258c5d544497a19901a0f3834f7a26f796fee2a7e4c9",
  // Upscaler
  realEsrgan: "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
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
  console.log("[Pipeline] 1/2 FLUX Kontext Max – style edit");
  const edited = await withRetry(() =>
    runFluxKontext(imageUrl, prompt, "match_input_image")
  );

  console.log("[Pipeline] 2/2 RealESRGAN 4× upscale");
  return withRetry(() => runRealEsrgan(edited, 4, true));
}

// ─── COMPOSITION PIPELINE ─────────────────────────────────────────────────────
//
// Why this approach:
//   Previous attempts sent FLUX a side-by-side composite → model interpreted
//   it as a "comparison image" and generated 2 unrelated men. Sending a grey
//   void → model invented a random person. Both were architectural mistakes.
//
//   The correct approach:
//   1. FLUX Pro generates a fresh, clean 2-person scene (its speciality)
//   2. FaceSwap replaces face 0 with the user's actual face
//   3. FaceSwap replaces face 1 with the celebrity's actual face (Wikipedia)
//   4. RealESRGAN 4× upscale
//
//   Face-swap is purpose-built for identity transfer. FLUX Pro is purpose-built
//   for generating coherent multi-person scenes. We use each tool for what it
//   was designed for.

async function runCompositionPipeline(
  userImageUrl: string,
  rawPrompt: string,
  stylePrompt: string
): Promise<string> {
  const personName = extractPersonName(rawPrompt);
  const action = extractActionEn(rawPrompt);
  console.log(`[Pipeline] Composition – celebrity: "${personName ?? "none"}" | action: "${action}"`);

  // Fetch Wikipedia reference image for the celebrity's face
  let referenceUrl: string | null = null;
  if (personName) {
    referenceUrl = await fetchWikipediaImage(personName);
    console.log(`[Pipeline] Wikipedia face reference: ${referenceUrl ? "found ✓" : "not found"}`);
  }

  // 1. Generate a clean 2-person template with FLUX Pro (text-to-image)
  const templatePrompt = buildTemplatePrompt(personName, action, stylePrompt);
  console.log(`[Pipeline] 1/4 FLUX Pro – generate template: "${templatePrompt.slice(0, 100)}…"`);
  const templateUrl = await withRetry(() => runFluxPro(templatePrompt));

  // 2. Face-swap the user's face onto the LEFT person (face index 0)
  console.log("[Pipeline] 2/4 FaceSwap – user → person 0 (left)…");
  const withUser = await withRetry(() =>
    runFaceSwap(userImageUrl, templateUrl, "0")
  );

  // 3. Face-swap the celebrity's face onto the RIGHT person (face index 1)
  let composed = withUser;
  if (referenceUrl) {
    console.log("[Pipeline] 3/4 FaceSwap – celebrity → person 1 (right)…");
    composed = await withRetry(() =>
      runFaceSwap(referenceUrl!, withUser, "1")
    ).catch((e) => {
      console.warn("[Pipeline] 3/4 celebrity swap skipped (face not detected):", (e as Error).message);
      return withUser;
    });
  }

  // 4. 4× upscale with face enhancement
  console.log("[Pipeline] 4/4 RealESRGAN 4× upscale");
  return withRetry(() => runRealEsrgan(composed, 4, true));
}

// ─── SWAPFACE PIPELINE ────────────────────────────────────────────────────────

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  console.log("[Pipeline] 1/2 Face swap…");
  const swapped = await withRetry(() =>
    runFaceSwap(input.sourceImageUrl!, input.targetImageUrl!, input.faceIndex ?? "0")
  );
  console.log("[Pipeline] 2/2 RealESRGAN 4× upscale");
  return withRetry(() => runRealEsrgan(swapped, 4, true));
}

// ─── INTENT DETECTION ─────────────────────────────────────────────────────────

function detectCompositionRequest(prompt: string): boolean {
  const p = prompt.toLowerCase();

  // Explicit spatial terms
  const spatialTriggers = [
    "à côté", "next to", "beside", "with me", "avec moi",
    "à ma gauche", "à ma droite", "on my left", "on my right",
    "devant moi", "derrière moi", "in front of me", "behind me",
  ];
  if (spatialTriggers.some((kw) => p.includes(kw))) return true;

  // "met(s) moi [ProperNoun]" — uppercase initial signals a name
  if (/\b(?:mets?|met)\s+moi\s+[A-Z]/u.test(prompt)) return true;

  // Action verb + person noun
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
  if (lp.includes("danse") || lp.includes("danc")) return "dancing together";
  return "looking at the camera and smiling";
}

// ─── WIKIPEDIA REFERENCE ──────────────────────────────────────────────────────

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

function buildTemplatePrompt(
  personName: string | null,
  action: string,
  stylePrompt: string
): string {
  const styleNote = stylePrompt.trim() ? `, ${stylePrompt.trim()}` : "";
  const celebHint = personName
    ? `, one of them is ${personName}`
    : "";
  return (
    `A professional photograph of exactly two people standing side by side${celebHint}, ` +
    `both ${action}, photorealistic, well-lit, sharp focus on both faces, ` +
    `upper body clearly visible, both facing the camera, ` +
    `high quality professional photography${styleNote}`
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

async function runFluxPro(prompt: string): Promise<string> {
  const output = await replicate.run(MODELS.fluxPro, {
    input: {
      prompt,
      aspect_ratio: "4:3",
      output_format: "jpg",
      output_quality: 100,
    },
  });
  return extractUrl(output);
}

async function runFaceSwap(
  sourceImageUrl: string,
  targetImageUrl: string,
  faceIndex: string
): Promise<string> {
  const output = await replicate.run(
    MODELS.faceSwap as `${string}/${string}:${string}`,
    {
      input: {
        source_image: sourceImageUrl,
        target_image: targetImageUrl,
        source_indexes: "0",
        target_indexes: faceIndex === "auto" ? "0" : faceIndex,
        face_restore: "CodeFormer",
        restore_factor: 0.75,
        face_upsample: true,
        upscale: 2,
        max_face_num: 2,
      },
    }
  );
  return extractUrl(output);
}

async function runRealEsrgan(
  imageUrl: string,
  scale: 2 | 4 = 4,
  faceEnhance = true
): Promise<string> {
  const output = await replicate.run(
    MODELS.realEsrgan as `${string}/${string}:${string}`,
    { input: { image: imageUrl, scale, face_enhance: faceEnhance } }
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
