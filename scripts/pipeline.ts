import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Face-swap and upscale — used only by SwapFace mode and Ultra upscale
const MODELS = {
  faceSwap:  "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
  realEsrgan: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
} as const;

// ─── Créer mode: multi-model fallback chain ───────────────────────────────────
//
// Models are tried in order. On failure (prediction failed/canceled), the poll
// handler automatically restarts the job with the next model.
// All text-to-image — no face-swap, no input image required.

type StyleModelSpec = {
  spec:       string;
  buildInput: (prompt: string, width: number, height: number) => Record<string, unknown>;
};

function toAspectRatio(width: number, height: number): string {
  if (width === height) return "1:1";
  if (width < height) return "3:4";
  return "16:9";
}

export const STYLE_MODELS: StyleModelSpec[] = [
  {
    spec: "prunaai/z-image-turbo",
    buildInput: (prompt, width, height) => ({
      prompt, width, height, num_inference_steps: 20, guidance_scale: 7,
    }),
  },
  {
    spec: "ideogram-ai/ideogram-v3-turbo",
    buildInput: (prompt, width, height) => ({
      prompt, aspect_ratio: toAspectRatio(width, height),
    }),
  },
  {
    spec: "black-forest-labs/flux-dev",
    buildInput: (prompt, width, height) => ({
      prompt,
      aspect_ratio:        toAspectRatio(width, height),
      num_inference_steps: 28,
      guidance:            3.5,
      output_format:       "jpg",
    }),
  },
  {
    spec: "stability-ai/sdxl",
    buildInput: (prompt, width, height) => ({
      prompt, width, height, num_inference_steps: 30, guidance_scale: 7.5,
    }),
  },
  {
    spec: "luma/photon-flash",
    buildInput: (prompt, width, height) => ({
      prompt, aspect_ratio: toAspectRatio(width, height),
    }),
  },
  {
    spec: "luma/photon",
    buildInput: (prompt, width, height) => ({
      prompt, aspect_ratio: toAspectRatio(width, height),
    }),
  },
  {
    spec: "ideogram-ai/ideogram-v3-balanced",
    buildInput: (prompt, width, height) => ({
      prompt, aspect_ratio: toAspectRatio(width, height),
    }),
  },
  {
    spec: "stability-ai/stable-diffusion-3.5-large",
    buildInput: (prompt, width, height) => ({
      prompt,
      aspect_ratio:   toAspectRatio(width, height),
      output_format:  "jpeg",
      output_quality: 80,
    }),
  },
  {
    spec: "recraft-ai/recraft-v3",
    buildInput: (prompt, width, height) => ({
      prompt, size: `${width}x${height}`, style: "realistic_image",
    }),
  },
  {
    spec: "ideogram-ai/ideogram-v3-quality",
    buildInput: (prompt, width, height) => ({
      prompt, aspect_ratio: toAspectRatio(width, height),
    }),
  },
  {
    spec: "nvidia/sana",
    buildInput: (prompt, width, height) => ({
      prompt, width, height, guidance_scale: 5, num_inference_steps: 20,
    }),
  },
  {
    spec: "adirik/realvisxl-v3.0-turbo",
    buildInput: (prompt, width, height) => ({
      prompt, width, height, num_inference_steps: 20, guidance_scale: 7,
    }),
  },
  {
    spec: "google/imagen-3-fast",
    buildInput: (prompt, width, height) => ({
      prompt, aspect_ratio: toAspectRatio(width, height), output_format: "jpg",
    }),
  },
  {
    spec: "google/imagen-3",
    buildInput: (prompt, width, height) => ({
      prompt, aspect_ratio: toAspectRatio(width, height), output_format: "jpg",
    }),
  },
  {
    spec: "google/imagen-4",
    buildInput: (prompt, width, height) => ({
      prompt, aspect_ratio: toAspectRatio(width, height), output_format: "jpg",
    }),
  },
  {
    spec: "prunaai/wan-2.2-image",
    buildInput: (prompt, width, height) => ({
      prompt, width, height,
    }),
  },
];

export const STYLE_MODEL_COUNT = STYLE_MODELS.length;

// ─── Dimension table (shared by style models that accept width/height) ────────
export const ZIMAGE_DIMS: Record<string, { width: number; height: number }> = {
  square:    { width: 1024, height: 1024 },
  portrait:  { width: 832,  height: 1152 },
  landscape: { width: 1216, height: 832  },
  auto:      { width: 832,  height: 1152 },
};

// ─── Quality settings per subscription tier ───────────────────────────────────
const QUALITY_SETTINGS = {
  free:      { quality: 80,  format: "jpg" as const, upscale: false },
  essentiel: { quality: 85,  format: "jpg" as const, upscale: false },
  pro:       { quality: 95,  format: "jpg" as const, upscale: false },
  ultra:     { quality: 100, format: "png" as const, upscale: true  },
} as const;

// ─── Render style descriptors ─────────────────────────────────────────────────
const RENDER_STYLE_PROMPTS: Record<string, string> = {
  photoreal: "ultra-photorealistic, sharp natural details, true-to-life colors",
  magazine:  "high-fashion editorial photography, perfect studio lighting, magazine quality retouching",
  cinematic: "cinematic color grading, dramatic shadows and highlights, movie-quality aesthetic",
  artistic:  "fine art portrait photography, creative lighting, artistic composition",
};

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
  qualityTier?: keyof typeof QUALITY_SETTINGS;
  renderStyle?: string;
  transformIntensity?: string;
  outputFormat?: string;
  preserveOutfit?: boolean;
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

// ─── PROMPT BUILDER ───────────────────────────────────────────────────────────

function buildStylePrompt(
  customPrompt: string,
  stylePrompt: string,
  renderStyle?: string,
  intensity?: string,
  preserveOutfit = false,
): string {
  const translated = translateToEnglish(customPrompt.trim());
  const style = stylePrompt.trim();

  let sceneDesc = "";
  if (translated && style) {
    sceneDesc = `${style}, ${translated}`;
  } else {
    sceneDesc = translated || style || "professional portrait, perfect studio lighting";
  }

  const renderDesc = (renderStyle && RENDER_STYLE_PROMPTS[renderStyle])
    ? RENDER_STYLE_PROMPTS[renderStyle]
    : "ultra-photorealistic, sharp natural details";

  const intensityDesc: Record<string, string> = {
    light:    "subtle, natural, minimal",
    moderate: "",
    strong:   "dramatic, bold, striking",
  };
  const mood = intensityDesc[intensity ?? "moderate"] ?? "";

  const outfitNote = preserveOutfit ? ", keeping current clothing style" : "";
  const subject = `a person, close portrait shot, face clearly visible${outfitNote}`;

  const parts = [
    `Photorealistic portrait of ${subject}`,
    sceneDesc,
    mood,
    renderDesc,
    "ultra-detailed, perfect exposure, professional photography, 8K quality",
    "NEGATIVE: blurry, distorted face, cartoon, illustration, low quality, deformed",
  ].filter(Boolean);

  return parts.join(", ").replace(/,\s*,+/g, ",").replace(/\s+/g, " ").trim();
}

// ─── FRENCH → ENGLISH TRANSLATOR ─────────────────────────────────────────────

function translateToEnglish(text: string): string {
  if (!text) return text;

  type Rule = [RegExp, string];
  const rules: Rule[] = [
    [/\b(?:mets?(?:\s+moi)?|met(?:\s+moi)?|fais(?:\s+moi)?|donne(?:\s+moi)?|place(?:\s+moi)?|change(?:\s+moi)?|transforme(?:\s+moi)?|rends?(?:\s+moi)?)\b/gi, ""],
    [/\b(?:s'il te plaît|stp|svp|please)\b/gi, ""],
    [/fond\s+(?:de\s+)?plage|fond\s+plage/gi, "beach background with ocean"],
    [/fond\s+(?:de\s+)?ville|fond\s+urbain/gi, "city skyline background"],
    [/fond\s+(?:de\s+)?forêt/gi, "forest background"],
    [/fond\s+(?:de\s+)?montagne/gi, "mountain landscape background"],
    [/fond\s+(?:de\s+)?coucher\s+de\s+soleil/gi, "sunset background"],
    [/fond\s+blanc/gi, "clean white studio background"],
    [/fond\s+noir/gi, "pure black background"],
    [/fond\s+flou|fond\s+bokeh/gi, "blurred bokeh background"],
    [/fond\s+studio/gi, "professional studio background"],
    [/fond\s+(?:de\s+)?bureau/gi, "office background"],
    [/fond\s+(?:de\s+)?luxe|fond\s+(?:de\s+)?villa/gi, "luxury villa background"],
    [/(?:change|remplace)\s+(?:le\s+)?fond/gi, "replace the background with"],
    [/\bfond\b/gi, "background"],
    [/à\s+la\s+plage/gi, "at the beach"],
    [/à\s+paris/gi, "in Paris"],
    [/à\s+new\s*york/gi, "in New York"],
    [/à\s+dubai/gi, "in Dubai"],
    [/à\s+los\s*angeles|à\s+la/gi, "in Los Angeles"],
    [/dans\s+une?\s+villa/gi, "in a luxury villa"],
    [/dans\s+une?\s+forêt/gi, "in a forest"],
    [/au\s+bureau/gi, "in an office setting"],
    [/en\s+plein\s+air/gi, "outdoors in natural setting"],
    [/noir\s+et\s+blanc|n&b|n&w|nbw/gi, "black and white"],
    [/sépia/gi, "sepia tone"],
    [/coloré/gi, "vibrant colors"],
    [/couleurs\s+vives/gi, "vivid saturated colors"],
    [/ton\s+chaud|tons?\s+chauds?/gi, "warm golden color tones"],
    [/ton\s+froid|tons?\s+froids?/gi, "cool blue color tones"],
    [/contraste\s+(?:élevé|fort|haut)/gi, "high contrast"],
    [/saturé/gi, "vibrant saturated colors"],
    [/style\s+(?:artistique|art)/gi, "artistic fine art style"],
    [/style\s+vintage|effet\s+vintage/gi, "vintage retro photography style"],
    [/style\s+cinématographique|look\s+ciném/gi, "cinematic film style"],
    [/style\s+(?:magazine|fashion)/gi, "high fashion magazine editorial style"],
    [/style\s+(?:luxe|luxueux)/gi, "luxury high-end style"],
    [/dessin\s+animé|cartoon/gi, "cartoon illustration style"],
    [/peinture\s+(?:à\s+l'huile|huile)/gi, "oil painting artistic style"],
    [/aquarelle/gi, "watercolor painting style"],
    [/anime|manga/gi, "anime manga style"],
    [/effet\s+3d/gi, "3D CGI rendering style"],
    [/réaliste|réalisme/gi, "photorealistic"],
    [/professionnel/gi, "professional"],
    [/futuriste|cyberpunk/gi, "futuristic cyberpunk aesthetic"],
    [/luxueux|luxe/gi, "luxury high-end"],
    [/lumière\s+(?:dorée|chaude)/gi, "warm golden hour lighting"],
    [/lumière\s+naturelle/gi, "soft natural daylight"],
    [/lumière\s+(?:de\s+)?studio/gi, "professional studio lighting"],
    [/éclairage\s+(?:dramatique|fort)/gi, "dramatic cinematic lighting"],
    [/coucher\s+de\s+soleil/gi, "golden sunset lighting"],
    [/lever\s+de\s+soleil/gi, "soft sunrise lighting"],
    [/néon/gi, "neon lights"],
    [/lumière\s+bleue/gi, "blue light"],
    [/lumière\s+rose/gi, "pink light"],
    [/tenue\s+de\s+soirée|costume\s+de\s+soirée/gi, "elegant formal evening attire"],
    [/tenue\s+(?:décontractée|casual)/gi, "casual stylish outfit"],
    [/tenue\s+sportive|look\s+sportif/gi, "athletic sportswear outfit"],
    [/costume\s+(?:de\s+)?superhéros/gi, "superhero costume"],
    [/tenue\s+militaire/gi, "military uniform"],
    [/tenue\s+royale|robe\s+royale/gi, "royal elegant gown"],
    [/smoking/gi, "elegant black tuxedo"],
    [/en\s+costume/gi, "wearing a tailored suit"],
    [/robe\s+rouge/gi, "red dress"],
    [/en\s+jean/gi, "wearing jeans"],
    [/cheveux\s+blonds/gi, "blonde hair"],
    [/cheveux\s+bruns/gi, "brown hair"],
    [/cheveux\s+noirs/gi, "black hair"],
    [/cheveux\s+rouges/gi, "red hair"],
    [/cheveux\s+bouclés/gi, "curly hair"],
    [/cheveux\s+raides/gi, "straight hair"],
    [/cheveux\s+longs/gi, "long hair"],
    [/cheveux\s+courts/gi, "short hair"],
    [/barbe/gi, "beard"],
    [/rasé/gi, "clean-shaven"],
    [/maquillage\s+(?:fort|prononcé)/gi, "bold dramatic makeup"],
    [/maquillage\s+naturel/gi, "natural minimal makeup"],
    [/sans\s+maquillage/gi, "no makeup natural look"],
    [/haute\s+qualité|hd|4k|8k/gi, "ultra high definition quality"],
    [/améliore?\s+(?:la\s+)?qualité/gi, "improve overall image quality"],
    [/nettoie?\s+(?:la\s+)?photo/gi, "clean and enhance the photo"],
    [/\bavec\s+/gi, "with "],
    [/\bsur\s+/gi, "on "],
    [/\bdans\s+/gi, "in "],
    [/\bun\b/gi, "a"],
    [/\bune\b/gi, "a"],
    [/\ble\b/gi, "the"],
    [/\bla\b/gi, "the"],
    [/\bles\b/gi, "the"],
    [/\bdu\b/gi, "of the"],
    [/\bde\b/gi, "of"],
    [/\bet\b/gi, "and"],
  ];

  let result = text;
  for (const [pattern, replacement] of rules) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(/\s+/g, " ").trim();
}

// ─── IMAGE UTILITIES ──────────────────────────────────────────────────────────

async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer":    "https://en.wikipedia.org/",
        "Accept":     "image/webp,image/jpeg,image/png,image/*",
      },
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadImageAsBase64(urlOrData: string): Promise<string> {
  if (urlOrData.startsWith("data:")) return urlOrData;
  const b64 = await downloadImageAsBase64(urlOrData);
  if (!b64) throw new Error(`Impossible de charger l'image depuis : ${urlOrData.slice(0, 80)}`);
  return b64;
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object" && "url" in output)
    return String((output as { url: string }).url);
  throw new Error("Aucune URL retournée par le modèle IA");
}

// ─── ASYNC JOB API ────────────────────────────────────────────────────────────
//
// Créer pipeline:   text-to-image model (auto-fallback chain) → optional upscale (Ultra)
//                   face-swap is NOT used in this mode
// SwapFace pipeline: face-swap → optional upscale (Ultra)

export type AsyncJobConfig = {
  mode:        "style" | "swapface";
  qualityTier: keyof typeof QUALITY_SETTINGS;
  prompt?:     string;
  width?:      number;
  height?:     number;
  sourceB64?:  string;   // swapface only: user's face
  modelIndex?: number;   // style only: current index in STYLE_MODELS (for fallback)
};

// Wraps replicate.predictions.create for versioned and unversioned model specs
async function createPred(
  spec:  string,
  input: Record<string, unknown>,
): Promise<{ id: string }> {
  const colonIdx = spec.lastIndexOf(":");
  if (colonIdx > 5 && spec.length - colonIdx > 20) {
    return replicate.predictions.create({ version: spec.substring(colonIdx + 1), input });
  }
  return replicate.predictions.create({ model: spec, input });
}

export function buildAsyncJobConfig(
  input:     PipelineInput,
  sourceB64: string,
): AsyncJobConfig {
  const tier = input.qualityTier ?? "essentiel";

  if (input.mode === "swapface") {
    return { mode: "swapface", qualityTier: tier, sourceB64 };
  }

  const prompt = buildStylePrompt(
    input.customPrompt   ?? "",
    input.stylePrompt    ?? "",
    input.renderStyle,
    input.transformIntensity,
    input.preserveOutfit ?? false,
  );

  const dims = ZIMAGE_DIMS[input.outputFormat ?? "auto"] ?? { width: 832, height: 1152 };

  return {
    mode:        "style",
    qualityTier: tier,
    prompt,
    width:       dims.width,
    height:      dims.height,
    modelIndex:  0,
  };
}

// Start step 1 — returns Replicate prediction ID immediately (non-blocking)
export async function startAsyncJob(
  config:     AsyncJobConfig,
  targetB64?: string, // swapface only: the target photo
): Promise<string> {
  if (config.mode === "swapface") {
    const p = await createPred(MODELS.faceSwap, {
      swap_image:  config.sourceB64!,
      input_image: targetB64!,
    });
    return p.id;
  }

  // Style: pick model from fallback chain
  const modelIdx = config.modelIndex ?? 0;
  const model    = STYLE_MODELS[modelIdx];
  if (!model) throw new Error(`Tous les ${STYLE_MODEL_COUNT} modèles ont échoué — réessayez plus tard`);

  console.log(`[Pipeline] Style model [${modelIdx}/${STYLE_MODEL_COUNT - 1}]: ${model.spec}`);
  const p = await createPred(
    model.spec,
    model.buildInput(config.prompt!, config.width ?? 832, config.height ?? 1152),
  );
  return p.id;
}

export type AdvanceResult =
  | { done: true;  outputUrl: string }
  | { done: false; predictionId: string; step: number };

// Called by the poll handler after a prediction succeeds.
export async function advanceAsyncJob(
  config:     AsyncJobConfig,
  step:       number,
  predOutput: unknown,
): Promise<AdvanceResult> {
  const q         = QUALITY_SETTINGS[config.qualityTier];
  const outputUrl = extractUrl(predOutput);

  // ── SWAPFACE: face-swap done → optional upscale ───────────────────────────
  if (config.mode === "swapface") {
    if (step === 1 && q.upscale) {
      const p = await createPred(MODELS.realEsrgan, { image: outputUrl, scale: 4, face_enhance: true });
      return { done: false, predictionId: p.id, step: 2 };
    }
    return { done: true, outputUrl };
  }

  // ── STYLE step 1: text-to-image done → optional upscale (Ultra) or done ──
  if (step === 1) {
    if (q.upscale) {
      const p = await createPred(MODELS.realEsrgan, { image: outputUrl, scale: 4, face_enhance: true });
      return { done: false, predictionId: p.id, step: 2 };
    }
    return { done: true, outputUrl };
  }

  // step 2+: upscale done
  return { done: true, outputUrl };
}

export { replicate, withRetry, loadImageAsBase64 };
