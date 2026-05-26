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

async function runStylePipeline(input: PipelineInput): Promise<string> {
  const imageUrl = input.inputImageUrl!;
  const instruction = buildInstruction(input.stylePrompt ?? "", input.customPrompt);

  console.log("[Pipeline] Step 1: FLUX Kontext Max image edit...");
  const editedUrl = await withRetry(() => runFluxKontextMax(imageUrl, instruction));

  console.log("[Pipeline] Step 2: RealESRGAN upscale...");
  return withRetry(() => runRealEsrgan(editedUrl));
}

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  const sourceUrl = input.sourceImageUrl!;
  const targetUrl = input.targetImageUrl!;
  const faceIndex = input.faceIndex ?? "0";

  console.log("[Pipeline] Step 1: Face swap...");
  const swappedUrl = await withRetry(() => runFaceSwap(sourceUrl, targetUrl, faceIndex));

  console.log("[Pipeline] Step 2: RealESRGAN upscale...");
  return withRetry(() => runRealEsrgan(swappedUrl));
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

async function runFluxKontextMax(imageUrl: string, instruction: string): Promise<string> {
  const output = await replicate.run(MODELS.fluxKontextMax, {
    input: {
      image: imageUrl,
      prompt: instruction,
      aspect_ratio: "match_input_image",
      output_format: "jpg",
      output_quality: 95,
      safety_tolerance: 5,
      prompt_upsampling: true,
    },
  });
  return extractUrl(output);
}

function buildInstruction(stylePrompt: string, customPrompt?: string): string {
  const base = customPrompt?.trim() || "";
  const style = stylePrompt?.trim() || "";
  if (base && style) return `${base}. Style: ${style}`;
  return base || style;
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
