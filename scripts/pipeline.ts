import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  faceSwap: "lucataco/faceswap:9a4298548422074c3f57258c5d544497a19901a0f3834f7a26f796fee2a7e4c9",
  codeFormer: "sczhou/codeformer",
  realEsrgan: "nightmareai/real-esrgan",
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

async function runStylePipeline(input: PipelineInput): Promise<string> {
  const faceUrl = input.inputImageUrl!;

  console.log("[Pipeline] Step 1: CodeFormer face restoration...");
  const restoredUrl = await withRetry(() => runCodeFormer(faceUrl));

  console.log("[Pipeline] Step 2: RealESRGAN 4K upscale...");
  const upscaledUrl = await withRetry(() => runRealEsrgan(restoredUrl));

  return upscaledUrl;
}

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  const sourceUrl = input.sourceImageUrl!;
  const targetUrl = input.targetImageUrl!;
  const faceIndex = input.faceIndex ?? "0";

  console.log("[Pipeline] Step 1: Face swap...");
  const swappedUrl = await withRetry(() => runFaceSwap(sourceUrl, targetUrl, faceIndex));

  console.log("[Pipeline] Step 2: CodeFormer restoration...");
  const restoredUrl = await withRetry(() => runCodeFormer(swappedUrl));

  console.log("[Pipeline] Step 3: RealESRGAN 4K upscale...");
  const upscaledUrl = await withRetry(() => runRealEsrgan(restoredUrl));

  return upscaledUrl;
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

async function runCodeFormer(imageUrl: string): Promise<string> {
  const output = await replicate.run(MODELS.codeFormer as `${string}/${string}`, {
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

async function runRealEsrgan(imageUrl: string): Promise<string> {
  const output = await replicate.run(MODELS.realEsrgan as `${string}/${string}`, {
    input: { image: imageUrl, scale: 4, face_enhance: true },
  });
  return extractUrl(output);
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object" && "url" in output) return String((output as { url: string }).url);
  throw new Error("Aucune URL retournée par le modèle IA");
}
