import Replicate from "replicate";
import sharp from "sharp";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  // Image editing (style transforms)
  fluxKontextMax: "black-forest-labs/flux-kontext-max",
  // Inpainting with mask — protects the original person perfectly
  fluxFillPro: "black-forest-labs/flux-fill-pro",
  // Face swap for identity anchoring
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
// Primary path (name found + Wikipedia ref available — the common case):
//   A. Download user photo + Wikipedia celebrity photo
//   B. Composite side-by-side with sharp: user LEFT, celebrity RIGHT
//      The model receives the ACTUAL celebrity face, not a grey void to fill.
//   C. FLUX Kontext Max: "harmonize — keep left person pixel-perfect,
//      make right person look natural in the same scene"
//   D. RealESRGAN 4× upscale
//
// Fallback (no Wikipedia ref found):
//   A. Extend canvas with grey on the right
//   B. FLUX Fill Pro inpaints the white area from the fill prompt
//   C. RealESRGAN 4× upscale

async function runCompositionPipeline(
  userImageUrl: string,
  rawPrompt: string,
  stylePrompt: string
): Promise<string> {
  const personName = extractPersonName(rawPrompt);
  const action = extractActionEn(rawPrompt);
  console.log(`[Pipeline] Composition – person: "${personName ?? "none"}" | action: "${action}"`);

  let referenceUrl: string | null = null;
  if (personName) {
    referenceUrl = await fetchWikipediaImage(personName);
    console.log(`[Pipeline] Wikipedia reference: ${referenceUrl ? "found ✓" : "not found"}`);
  }

  if (personName && referenceUrl) {
    // ── Primary path ────────────────────────────────────────────────────────
    console.log("[Pipeline] A – Compositing user + celebrity reference side by side…");
    const compositeBase64 = await buildCompositeCanvas(userImageUrl, referenceUrl);

    const harmonizePrompt = buildHarmonizePrompt(personName, action, stylePrompt);
    console.log(`[Pipeline] B – FLUX Kontext harmonize: "${harmonizePrompt.slice(0, 100)}…"`);
    const harmonized = await withRetry(() =>
      runFluxKontext(compositeBase64, harmonizePrompt, "match_input_image")
    );

    console.log("[Pipeline] C – RealESRGAN 4× upscale");
    return withRetry(() => runRealEsrgan(harmonized, 4, true));
  }

  // ── Fallback path ──────────────────────────────────────────────────────────
  console.log("[Pipeline] A – Extending canvas with grey (fallback, no Wikipedia ref)…");
  const { extendedBase64, maskBase64 } = await buildExtendedCanvasAndMask(userImageUrl);

  const fillPrompt = buildFillPrompt(personName, rawPrompt, stylePrompt);
  console.log(`[Pipeline] B – FLUX Fill Pro inpaint: "${fillPrompt.slice(0, 100)}…"`);
  const inpainted = await withRetry(() =>
    runFluxFillPro(extendedBase64, maskBase64, fillPrompt)
  );

  console.log("[Pipeline] C – RealESRGAN 4× upscale");
  return withRetry(() => runRealEsrgan(inpainted, 4, true));
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

// ─── CANVAS EXTENSION + MASK (sharp) ─────────────────────────────────────────

async function buildExtendedCanvasAndMask(imageUrl: string): Promise<{
  extendedBase64: string;
  maskBase64: string;
}> {
  const res = await fetch(imageUrl);
  const buffer = Buffer.from(await res.arrayBuffer());

  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 512;
  const h = meta.height ?? 512;

  // Extended canvas: original image on the LEFT, neutral grey on the RIGHT
  const extendedBuf = await sharp(buffer)
    .extend({ right: w, background: { r: 128, g: 128, b: 128 } })
    .jpeg({ quality: 98 })
    .toBuffer();

  // Mask: black (keep) on LEFT, white (generate) on RIGHT
  const whitePatch = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .png()
    .toBuffer();

  const maskBuf = await sharp({
    create: { width: w * 2, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite([{ input: whitePatch, left: w, top: 0 }])
    .png()
    .toBuffer();

  return {
    extendedBase64: `data:image/jpeg;base64,${extendedBuf.toString("base64")}`,
    maskBase64: `data:image/png;base64,${maskBuf.toString("base64")}`,
  };
}

// Build a side-by-side composite: user on the LEFT, celebrity photo on the RIGHT.
// Both halves are the same size. The model receives the ACTUAL celebrity face.
async function buildCompositeCanvas(
  userImageUrl: string,
  celebrityImageUrl: string
): Promise<string> {
  const [userRes, celebRes] = await Promise.all([
    fetch(userImageUrl),
    fetch(celebrityImageUrl),
  ]);
  const [userBuf, celebBuf] = await Promise.all([
    Buffer.from(await userRes.arrayBuffer()),
    Buffer.from(await celebRes.arrayBuffer()),
  ]);

  const { width: w = 512, height: h = 512 } = await sharp(userBuf).metadata();

  // Normalize user to JPEG at exact dimensions
  const userJpeg = await sharp(userBuf)
    .resize(w, h, { fit: "fill" })
    .jpeg({ quality: 95 })
    .toBuffer();

  // Celebrity: resize to same height, crop from top (shows face/upper body)
  const celebJpeg = await sharp(celebBuf)
    .resize(w, h, { fit: "cover", position: "top" })
    .jpeg({ quality: 95 })
    .toBuffer();

  const composite = await sharp({
    create: { width: w * 2, height: h, channels: 3, background: { r: 200, g: 200, b: 200 } },
  })
    .composite([
      { input: userJpeg, left: 0, top: 0 },
      { input: celebJpeg, left: w, top: 0 },
    ])
    .jpeg({ quality: 98 })
    .toBuffer();

  return `data:image/jpeg;base64,${composite.toString("base64")}`;
}

// ─── INTENT DETECTION ─────────────────────────────────────────────────────────

function detectCompositionRequest(prompt: string): boolean {
  const p = prompt.toLowerCase();

  // Spatial/relational terms: clearly mean "put someone beside me"
  const spatialTriggers = [
    "à côté", "next to", "beside", "with me", "avec moi",
    "à ma gauche", "à ma droite", "on my left", "on my right",
    "devant moi", "derrière moi", "in front of me", "behind me",
  ];
  if (spatialTriggers.some((kw) => p.includes(kw))) return true;

  // "met(s) moi [ProperNoun]" — uppercase letter after "moi" signals a name
  if (/\b(?:mets?|met)\s+moi\s+[A-Z]/u.test(prompt)) return true;

  // Action verb + generic person noun
  const actionVerbs = ["ajoute", "rajoute", "add", "mets", "place", "met "];
  const personNouns = ["personne", "homme", "femme", "quelqu'un", "person", "man", "woman", "someone", "celebrity", "célébrité"];
  return actionVerbs.some((v) => p.includes(v)) && personNouns.some((n) => p.includes(n));
}

// Extract the person's name from the prompt.
// "Met moi Charlie D'Amelio à côté de moi"  → "Charlie D'Amelio"
// "rajoute Ronaldo à côté de moi"            → "Ronaldo"
// "mets moi avec Michael Jackson"            → "Michael Jackson"
function extractPersonName(prompt: string): string | null {
  // Words that end the name capture (spatial markers + action markers)
  const STOP = "(?:à côté|next to|beside|avec moi|with me|à ma|on my|devant|derrière|in front|behind|de moi|of me|entrain|en train|qui |looking|regardant|faisant|doing|watching|holding|portant|souriant|smiling)";

  const patterns = [
    // "met(s) moi [Name] [spatial/action...]"  ← the missing pattern
    new RegExp(`\\b(?:mets?|met)\\s+moi\\s+(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    // "rajoute/ajoute/add/place [moi avec] [Name]"
    new RegExp(`(?:rajoute|ajoute|add|place)\\s+(?:moi\\s+(?:avec|with)\\s+)?(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    // "mets/met [moi] avec/with [Name]"
    new RegExp(`(?:mets|met)\\s+(?:moi\\s+)?(?:avec|with)\\s+(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    // "avec/with [Name]"
    new RegExp(`(?:avec|with)\\s+(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    if (match) {
      const candidate = match[1].trim();
      // Reject generic nouns (une femme, a man, quelqu'un…)
      if (/^(une?|un|a|an)\s+/i.test(candidate)) continue;
      if (candidate.length > 1 && candidate.length < 60) return candidate;
    }
  }
  return null;
}

// ─── WIKIPEDIA REFERENCE (free, no API key) ───────────────────────────────────

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

// Translate common French action phrases to English for the model
function extractActionEn(prompt: string): string {
  const lp = prompt.toLowerCase();
  if (lp.includes("caméra") || lp.includes("camera") || lp.includes("objectif")) return "looking directly at the camera";
  if (lp.includes("sourir") || lp.includes("smile") || lp.includes("souriant")) return "smiling at the camera";
  if (lp.includes("pos") || lp.includes("pose")) return "posing naturally";
  if (lp.includes("danse") || lp.includes("danc")) return "dancing";
  return "looking natural, facing forward";
}

// Prompt for FLUX Kontext when harmonizing a side-by-side composite
function buildHarmonizePrompt(personName: string, action: string, stylePrompt: string): string {
  const styleNote = stylePrompt.trim() ? ` ${stylePrompt.trim()}.` : "";
  return (
    `This image shows two people placed side by side. ` +
    `THE PERSON ON THE LEFT must remain COMPLETELY UNCHANGED — same face, hair, skin, clothes, expression, pose, background. Do not touch them at all. ` +
    `THE PERSON ON THE RIGHT is ${personName}. Keep their face and appearance exactly as shown but make them look photorealistic, natural, and fully integrated into the same scene. They should be ${action}. ` +
    `Blend the lighting, shadows, colors, and environment between both halves so the image looks like a single, natural professional photo taken at the same moment. ` +
    `No visible seam between left and right. High quality, sharp focus on both faces.${styleNote}`
  );
}

function buildFillPrompt(
  personName: string | null,
  originalPrompt: string,
  stylePrompt: string
): string {
  const styleNote = stylePrompt.trim() ? ` ${stylePrompt.trim()}.` : "";
  const action = extractActionEn(originalPrompt);

  if (personName) {
    return (
      `A photorealistic high-quality photo of ${personName}, ${action}, ` +
      `standing naturally, upper body and face clearly visible, well-lit. ` +
      `Match the lighting and environment from the left side of the image exactly. ` +
      `Professional photography quality, sharp focus on the face.${styleNote}`
    );
  }

  // Fallback when no name detected — generate a generic person (never use original French prompt)
  return (
    `A photorealistic high-quality photo of a person standing naturally, ${action}, ` +
    `well-lit, upper body visible. ` +
    `Match the lighting and environment of the existing scene exactly.${styleNote}`
  );
}

function buildStylePrompt(stylePrompt: string, customPrompt: string): string {
  const base = customPrompt.trim();
  const style = stylePrompt.trim();
  const request = base && style ? `${base}. Style: ${style}` : base || style;
  return (
    `Edit this photo while keeping the SAME PERSON: identical face, skin tone, hair, and body shape. ` +
    `There must be EXACTLY ONE person in the result — the original subject. Do NOT add, clone, or replace any person. ` +
    `Apply the following change: ${request}. ` +
    `The person's facial features, identity, and proportions must be preserved exactly as in the original photo.`
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

async function runFluxFillPro(
  imageBase64: string,
  maskBase64: string,
  prompt: string
): Promise<string> {
  const output = await replicate.run(MODELS.fluxFillPro, {
    input: {
      image: imageBase64,
      mask: maskBase64,
      prompt,
      output_format: "jpg",
      output_quality: 100,
      safety_tolerance: 6,
      prompt_upsampling: false,
      guidance: 30,
      num_inference_steps: 50,
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
