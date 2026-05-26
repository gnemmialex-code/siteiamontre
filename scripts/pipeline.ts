import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  fluxKontextMax: "black-forest-labs/flux-kontext-max",
  fluxKontextPro: "black-forest-labs/flux-kontext-pro",
  ideogramV3: "ideogram-ai/ideogram-v3-balanced",
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
  const rawPrompt = input.customPrompt?.trim() || "";
  const isCompositionRequest = detectCompositionRequest(rawPrompt);
  const instruction = buildInstruction(input.stylePrompt ?? "", rawPrompt, isCompositionRequest);

  let editedUrl: string;
  if (isCompositionRequest) {
    console.log("[Pipeline] Step 1: Ideogram v3 — composition (add person)...");
    editedUrl = await withRetry(() => runIdeogramV3(imageUrl, instruction));
  } else {
    console.log("[Pipeline] Step 1: FLUX Kontext Max — style edit...");
    editedUrl = await withRetry(() => runFluxKontextMax(imageUrl, instruction));
  }

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

// Détecte si l'utilisateur veut ajouter/composer quelqu'un plutôt que transformer son apparence.
function detectCompositionRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const addKeywords = [
    "ajoute", "rajoute", "add", "mets", "place", "met ",
    "à côté", "next to", "beside", "with me", "avec moi",
    "à ma gauche", "à ma droite", "on my left", "on my right",
    "devant moi", "derrière moi", "in front of me", "behind me",
    "une personne", "un homme", "une femme", "quelqu'un", "a person", "a man", "a woman", "someone",
  ];
  return addKeywords.some((kw) => lower.includes(kw));
}

async function runFluxKontextMax(imageUrl: string, instruction: string): Promise<string> {
  const output = await replicate.run(MODELS.fluxKontextMax, {
    input: {
      image: imageUrl,
      prompt: instruction,
      aspect_ratio: "match_input_image",
      output_format: "jpg",
      output_quality: 95,
      safety_tolerance: 6,
      prompt_upsampling: false,
    },
  });
  return extractUrl(output);
}

async function runIdeogramV3(imageUrl: string, instruction: string): Promise<string> {
  const output = await replicate.run(MODELS.ideogramV3, {
    input: {
      image: imageUrl,
      prompt: instruction,
      image_weight: 80,
      resolution: "None",
      style_type: "Realistic",
      rendering_speed: "BALANCED",
      magic_prompt_option: "OFF",
    },
  });
  return extractUrl(output);
}

function buildInstruction(stylePrompt: string, customPrompt: string, isComposition: boolean): string {
  const base = customPrompt.trim();
  const style = stylePrompt.trim();
  const userRequest = base && style ? `${base}. Style: ${style}` : (base || style);

  if (isComposition) {
    // Pour "ajouter quelqu'un" : on décrit la composition finale sans bloquer l'ajout.
    // On distingue clairement "personne existante à conserver" et "personne à ajouter".
    return (
      `This photo contains a person (call them Person A). ` +
      `${userRequest}. ` +
      `IMPORTANT: Person A must remain completely unchanged — same face, same expression, same skin tone, same clothes, same exact position. ` +
      `Only add the requested person/element alongside Person A. ` +
      `Both must be clearly visible in the final image. Make it look photorealistic and natural.`
    );
  }

  // Pour les transformations de style/apparence : préserver l'identité, changer le look.
  return (
    `Keep the exact same person from the input photo — identical face, skin tone, and body shape. ` +
    `${userRequest}. ` +
    `Preserve all facial features and the person's identity exactly as shown in the input image.`
  );
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
