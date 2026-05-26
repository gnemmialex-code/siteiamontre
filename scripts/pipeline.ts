import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  fluxKontextMax: "black-forest-labs/flux-kontext-max",
  faceSwap: "lucataco/faceswap:9a4298548422074c3f57258c5d544497a19901a0f3834f7a26f796fee2a7e4c9",
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
      const is429 = msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("throttled");
      if (is429 && attempt < retries) {
        const match = msg.match(/"retry_after"\s*:\s*(\d+)/);
        const waitMs = match ? (Number(match[1]) + 2) * 1000 : 15000;
        console.log(`[Pipeline] Rate limited, waiting ${waitMs / 1000}s… (retry ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, waitMs));
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
    const result = input.mode === "swapface"
      ? await runSwapFacePipeline(input)
      : await runStylePipeline(input);
    console.log(`[Pipeline] Done in ${Date.now() - start}ms`);
    return result;
  } catch (err) {
    console.error("[Pipeline] Error:", err);
    throw err;
  }
}

// ─── STYLE PIPELINE ──────────────────────────────────────────────────────────

async function runStylePipeline(input: PipelineInput): Promise<string> {
  const imageUrl = input.inputImageUrl!;
  const rawPrompt = input.customPrompt?.trim() || "";

  if (detectCompositionRequest(rawPrompt)) {
    return runCompositionPipeline(imageUrl, rawPrompt, input.stylePrompt ?? "");
  }

  const instruction = buildStyleInstruction(input.stylePrompt ?? "", rawPrompt);
  console.log("[Pipeline] Step 1: FLUX Kontext Max — style edit...");
  const editedUrl = await withRetry(() => runFluxKontextMax([imageUrl], instruction, "match_input_image"));

  console.log("[Pipeline] Step 2: RealESRGAN upscale...");
  return withRetry(() => runRealEsrgan(editedUrl));
}

async function runCompositionPipeline(
  userImageUrl: string,
  rawPrompt: string,
  stylePrompt: string,
): Promise<string> {
  // Step 1 — extract person name from prompt
  const personName = extractPersonName(rawPrompt);
  console.log(`[Pipeline] Composition — person: ${personName ?? "unspecified"}`);

  // Step 2 — search reference image on Wikipedia (no API key needed)
  let referenceUrl: string | null = null;
  if (personName) {
    referenceUrl = await fetchWikipediaImage(personName);
    console.log(`[Pipeline] Reference image: ${referenceUrl ? "found" : "not found"}`);
  }

  // Step 3 — determine output aspect ratio (wider to make room for both people)
  const expandedRatio = "16:9";

  // Step 4 — build composition prompt
  const images = referenceUrl ? [userImageUrl, referenceUrl] : [userImageUrl];
  const prompt = buildCompositionPrompt(rawPrompt, personName, !!referenceUrl, stylePrompt);

  console.log("[Pipeline] Step 1: FLUX Kontext Max — composition...");
  const composedUrl = await withRetry(() =>
    runFluxKontextMax(images, prompt, expandedRatio)
  );

  console.log("[Pipeline] Step 2: RealESRGAN upscale...");
  return withRetry(() => runRealEsrgan(composedUrl));
}

// ─── SWAPFACE PIPELINE ────────────────────────────────────────────────────────

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  const sourceUrl = input.sourceImageUrl!;
  const targetUrl = input.targetImageUrl!;
  const faceIndex = input.faceIndex ?? "0";

  console.log("[Pipeline] Step 1: Face swap...");
  const swappedUrl = await withRetry(() => runFaceSwap(sourceUrl, targetUrl, faceIndex));

  console.log("[Pipeline] Step 2: RealESRGAN upscale...");
  return withRetry(() => runRealEsrgan(swappedUrl));
}

// ─── INTENT DETECTION ────────────────────────────────────────────────────────

function detectCompositionRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return [
    "ajoute", "rajoute", "add", "mets", "place", "met ",
    "à côté", "next to", "beside", "with me", "avec moi",
    "à ma gauche", "à ma droite", "on my left", "on my right",
    "devant moi", "derrière moi", "in front of me", "behind me",
    "une personne", "un homme", "une femme", "quelqu'un", "a person", "a man", "a woman", "someone",
  ].some((kw) => lower.includes(kw));
}

// Extract the name of the person to add from a composition prompt.
// e.g. "rajoute Ronaldo à côté de moi" → "Ronaldo"
function extractPersonName(prompt: string): string | null {
  // Remove leading action verb
  let cleaned = prompt
    .replace(/^(rajoute|ajoute|add|mets|place|met)\s+/i, "")
    .trim();

  // Remove trailing location/relation
  cleaned = cleaned
    .replace(/\s+(à côté( de moi)?|next to( me)?|beside( me)?|avec moi|with me|à ma (gauche|droite)|on my (left|right)|devant moi|derrière moi|in front of me|behind me|de moi|of me).*$/i, "")
    .trim();

  // Remove "une/un/a" prefix (generic, not a name)
  if (/^(une?|a|an)\s+/i.test(cleaned)) return null;

  if (cleaned.length > 1 && cleaned.length < 60) return cleaned;
  return null;
}

// ─── REFERENCE IMAGE (Wikipedia, no API key) ─────────────────────────────────

async function fetchWikipediaImage(personName: string): Promise<string | null> {
  const slug = encodeURIComponent(personName.trim().replace(/\s+/g, "_"));

  for (const lang of ["en", "fr"]) {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`,
        { headers: { "User-Agent": "IACelebriteApp/1.0 (contact: noreply@example.com)" } }
      );
      if (!res.ok) continue;
      const data = await res.json() as {
        thumbnail?: { source: string };
        originalimage?: { source: string };
      };
      const url = data.originalimage?.source ?? data.thumbnail?.source ?? null;
      if (url) return url;
    } catch {
      // ignore, try next language
    }
  }
  return null;
}

// ─── PROMPT BUILDERS ─────────────────────────────────────────────────────────

function buildCompositionPrompt(
  rawPrompt: string,
  personName: string | null,
  hasReference: boolean,
  stylePrompt: string,
): string {
  const person = personName ?? "the person described";
  const styleNote = stylePrompt.trim() ? ` Style: ${stylePrompt.trim()}.` : "";

  if (hasReference) {
    // Two images passed: image 1 = user, image 2 = reference
    return (
      `Image 1 shows a person — call them Person A. ` +
      `Image 2 shows ${person}. ` +
      `Create a wider, photorealistic scene where ${person} (from image 2) is standing next to Person A (from image 1). ` +
      `Person A must remain completely unchanged: same face, expression, skin tone, clothes, and position. ` +
      `${person} should appear realistic and proportional next to Person A. ` +
      `Both people must be clearly visible. ` +
      `Extend the scene naturally to fit both subjects.${styleNote}`
    );
  }

  // Single image — describe the person from text alone
  return (
    `This photo shows a person — call them Person A. ` +
    `${rawPrompt}. ` +
    `Person A must remain completely unchanged: same face, expression, skin tone, clothes, and position. ` +
    `Add the requested person in a photorealistic way right beside Person A. ` +
    `Both people must be clearly visible. ` +
    `Extend the scene naturally to fit both subjects.${styleNote}`
  );
}

function buildStyleInstruction(stylePrompt: string, customPrompt: string): string {
  const base = customPrompt.trim();
  const style = stylePrompt.trim();
  const userRequest = base && style ? `${base}. Style: ${style}` : (base || style);
  return (
    `Keep the exact same person from the input photo — identical face, skin tone, and body shape. ` +
    `${userRequest}. ` +
    `Preserve all facial features and the person's identity exactly as shown in the input image.`
  );
}

// ─── MODEL RUNNERS ────────────────────────────────────────────────────────────

async function runFluxKontextMax(
  images: string[],
  prompt: string,
  aspectRatio: string,
): Promise<string> {
  const output = await replicate.run(MODELS.fluxKontextMax, {
    input: {
      // FLUX Kontext Max accepts a single URL or an array for multi-image composition
      image: images.length === 1 ? images[0] : images,
      prompt,
      aspect_ratio: aspectRatio,
      output_format: "jpg",
      output_quality: 95,
      safety_tolerance: 6,
      prompt_upsampling: false,
    },
  });
  return extractUrl(output);
}

async function runFaceSwap(sourceImageUrl: string, targetImageUrl: string, faceIndex: string): Promise<string> {
  const output = await replicate.run(MODELS.faceSwap as `${string}/${string}:${string}`, {
    input: {
      source_image: sourceImageUrl,
      target_image: targetImageUrl,
      source_indexes: "0",
      target_indexes: faceIndex === "auto" ? "0" : faceIndex,
      face_restore: "CodeFormer",
      restore_factor: 0.75,
      face_upsample: true,
      upscale: 2,
      max_face_num: 1,
    },
  });
  return extractUrl(output);
}

async function runRealEsrgan(imageUrl: string): Promise<string> {
  const output = await replicate.run(MODELS.realEsrgan as `${string}/${string}:${string}`, {
    input: { image: imageUrl, scale: 2, face_enhance: false },
  });
  return extractUrl(output);
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object" && "url" in output) return String((output as { url: string }).url);
  throw new Error("Aucune URL retournée par le modèle IA");
}
