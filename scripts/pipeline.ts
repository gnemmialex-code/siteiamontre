/**
 * CelebSwap AI Pipeline — Multi-Model Ultra HD
 *
 * Mode Style IA :
 *   1. PuLID (FLUX)       — génération stylisée avec identité du visage préservée
 *   2. CodeFormer          — restauration & rehaussement du visage
 *   3. Clarity Upscaler    — upscale 4K avec préservation des détails
 *
 * Mode SwapFace :
 *   1. FaceSwap (ReActor)  — swap du visage haute fidélité
 *   2. CodeFormer          — restauration du visage swappé
 *   3. Clarity Upscaler    — upscale 4K
 */

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// ── Meilleurs modèles disponibles sur Replicate ──────────────────────────────
const MODELS = {
  // PuLID (FLUX) : meilleur modèle face-preserving du marché, basé sur FLUX
  pulid: "fofr/pulid-flux",

  // Face Swap : ReActor haute qualité pour le mode SwapFace
  faceSwap: "lucataco/faceswap:9a4298548422074c3f57258c5d544497a19901a0f3834f7a26f796fee2a7e4c9",

  // CodeFormer : meilleure restauration de visage (Microsoft Research)
  codeFormer: "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53a4a975c7d25bb",

  // Clarity Upscaler : meilleur upscaler 4K du marché (mieux que RealESRGAN)
  clarityUpscaler: "philz1337x/clarity-upscaler",

  // RealESRGAN : upscaler de secours (rapide, fiable)
  realEsrgan: "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
} as const;

export interface PipelineInput {
  mode: "style" | "swapface";
  // Style mode
  inputImageUrl?: string;
  styleId?: string;
  stylePrompt?: string;
  customPrompt?: string;
  // SwapFace mode
  sourceImageUrl?: string;
  targetImageUrl?: string;
  faceIndex?: string;
  extraPrompt?: string;
}

// ── RETRY HELPER ─────────────────────────────────────────────────────────────

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
        console.log(`[Pipeline] Rate limited (429), waiting ${waitMs / 1000}s… (retry ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

// ── PIPELINE PRINCIPAL ───────────────────────────────────────────────────────

export async function runPipeline(input: PipelineInput): Promise<string> {
  const start = Date.now();
  console.log(`[Pipeline] Mode: ${input.mode}`);

  try {
    let result: string;

    if (input.mode === "swapface") {
      result = await runSwapFacePipeline(input);
    } else {
      result = await runStylePipeline(input);
    }

    console.log(`[Pipeline] Done in ${Date.now() - start}ms`);
    return result;
  } catch (err) {
    console.error("[Pipeline] Error:", err);
    throw err;
  }
}

// ── MODE STYLE IA ────────────────────────────────────────────────────────────

async function runStylePipeline(input: PipelineInput): Promise<string> {
  const faceUrl = input.inputImageUrl!;
  const prompt = buildFullPrompt(input.stylePrompt ?? "", input.customPrompt);

  // Étape 1 : PuLID (FLUX) — génération stylisée face-preserving
  console.log("[Pipeline] Step 1: PuLID style generation...");
  const styledUrl = await withRetry(() => runPuLID(faceUrl, prompt));

  // Étape 2 : CodeFormer — restauration & amélioration du visage
  console.log("[Pipeline] Step 2: CodeFormer face restoration...");
  const restoredUrl = await withRetry(() => runCodeFormer(styledUrl));

  // Étape 3 : Clarity Upscaler — upscale 4K ultra détaillé
  console.log("[Pipeline] Step 3: Clarity 4K upscale...");
  const upscaledUrl = await withRetry(() => runClarityUpscaler(restoredUrl));

  return upscaledUrl;
}

// ── MODE SWAPFACE ────────────────────────────────────────────────────────────

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  const sourceUrl = input.sourceImageUrl!;
  const targetUrl = input.targetImageUrl!;
  const faceIndex = input.faceIndex ?? "0";

  // Étape 1 : Face Swap haute qualité
  console.log("[Pipeline] Step 1: Face swap...");
  const swappedUrl = await withRetry(() => runFaceSwap(sourceUrl, targetUrl, faceIndex));

  // Étape 2 : CodeFormer — restauration du visage swappé
  console.log("[Pipeline] Step 2: CodeFormer restoration...");
  const restoredUrl = await withRetry(() => runCodeFormer(swappedUrl));

  // Étape 3 : Clarity Upscaler — upscale 4K
  console.log("[Pipeline] Step 3: Clarity 4K upscale...");
  const upscaledUrl = await withRetry(() => runClarityUpscaler(restoredUrl));

  return upscaledUrl;
}

// ── MODÈLES ──────────────────────────────────────────────────────────────────

async function runPuLID(faceImageUrl: string, prompt: string): Promise<string> {
  const output = await replicate.run(MODELS.pulid as `${string}/${string}`, {
    input: {
      face_image: faceImageUrl,
      prompt,
      negative_prompt: buildNegativePrompt(),
      num_steps: 30,
      style_strength: 0.7,
      num_outputs: 1,
      guidance_scale: 7.5,
      output_format: "png",
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

async function runCodeFormer(imageUrl: string): Promise<string> {
  const output = await replicate.run(MODELS.codeFormer as `${string}/${string}:${string}`, {
    input: {
      image: imageUrl,
      codeformer_fidelity: 0.7,
      background_enhance: true,
      face_upsample: true,
      upscale: 2,
    },
  });
  return extractUrl(output);
}

async function runClarityUpscaler(imageUrl: string): Promise<string> {
  try {
    const output = await replicate.run(MODELS.clarityUpscaler as `${string}/${string}`, {
      input: {
        image: imageUrl,
        scale_factor: 2,
        sharpness: 0.5,
        hdr: 0.1,
        creativity: 0.35,
        resemblance: 0.9,
        tiling_width: 112,
        tiling_height: 144,
        output_format: "png",
      },
    });
    return extractUrl(output);
  } catch (err) {
    console.warn("[Pipeline] Clarity upscaler failed, using RealESRGAN:", err);
    const output = await replicate.run(MODELS.realEsrgan as `${string}/${string}:${string}`, {
      input: { image: imageUrl, scale: 4, face_enhance: true },
    });
    return extractUrl(output);
  }
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object" && "url" in output) return String((output as { url: string }).url);
  throw new Error("Aucune URL retournée par le modèle IA");
}

function buildFullPrompt(stylePrompt: string, customPrompt?: string): string {
  const parts = [stylePrompt];
  if (customPrompt?.trim()) parts.push(customPrompt.trim());
  parts.push(
    "ultra detailed face",
    "photorealistic",
    "8k uhd",
    "professional photography",
    "perfect skin texture",
    "sharp focus",
    "stunning lighting",
    "award winning photo"
  );
  return parts.join(", ");
}

function buildNegativePrompt(): string {
  return [
    "deformed", "ugly", "bad anatomy", "disfigured", "poorly drawn face",
    "mutation", "extra limb", "missing limb", "floating limbs",
    "disconnected limbs", "malformed hands", "blur", "watermark",
    "text", "logo", "nsfw", "nude", "explicit",
    "low quality", "jpeg artifacts", "grainy", "worst quality",
  ].join(", ");
}
