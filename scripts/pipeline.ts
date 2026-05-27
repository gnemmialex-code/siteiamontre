import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  // Z-Image Turbo — text-to-image (generates scene, then face-swap injects user's face)
  zImageTurbo: "prunaai/z-image-turbo",
  // Face swap — injects user face into the generated scene
  faceSwap: "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
  // 4× upscale for Ultra tier
  realEsrgan: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
} as const;

// Width × Height for Z-Image Turbo based on output format choice
const ZIMAGE_DIMS: Record<string, { width: number; height: number }> = {
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
//
// Z-Image Turbo is text-to-image — the prompt must describe the desired scene.
// Always include a portrait subject so face-swap has a face target.

function buildIdeogramPrompt(
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
    // ── Remove French filler phrases ──────────────────────────────────────────
    [/\b(?:mets?(?:\s+moi)?|met(?:\s+moi)?|fais(?:\s+moi)?|donne(?:\s+moi)?|place(?:\s+moi)?|change(?:\s+moi)?|transforme(?:\s+moi)?|rends?(?:\s+moi)?)\b/gi, ""],
    [/\b(?:s'il te plaît|stp|svp|please)\b/gi, ""],

    // ── Background / scene ────────────────────────────────────────────────────
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

    // ── Scene / location ──────────────────────────────────────────────────────
    [/à\s+la\s+plage/gi, "at the beach"],
    [/à\s+paris/gi, "in Paris"],
    [/à\s+new\s*york/gi, "in New York"],
    [/à\s+dubai/gi, "in Dubai"],
    [/à\s+los\s*angeles|à\s+la/gi, "in Los Angeles"],
    [/dans\s+une?\s+villa/gi, "in a luxury villa"],
    [/dans\s+une?\s+forêt/gi, "in a forest"],
    [/au\s+bureau/gi, "in an office setting"],
    [/en\s+plein\s+air/gi, "outdoors in natural setting"],

    // ── Colour / tone ─────────────────────────────────────────────────────────
    [/noir\s+et\s+blanc|n&b|n&w|nbw/gi, "black and white"],
    [/sépia/gi, "sepia tone"],
    [/coloré/gi, "vibrant colors"],
    [/couleurs\s+vives/gi, "vivid saturated colors"],
    [/ton\s+chaud|tons?\s+chauds?/gi, "warm golden color tones"],
    [/ton\s+froid|tons?\s+froids?/gi, "cool blue color tones"],
    [/contraste\s+(?:élevé|fort|haut)/gi, "high contrast"],
    [/saturé/gi, "vibrant saturated colors"],

    // ── Style / aesthetic ─────────────────────────────────────────────────────
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

    // ── Lighting ──────────────────────────────────────────────────────────────
    [/lumière\s+(?:dorée|chaude)/gi, "warm golden hour lighting"],
    [/lumière\s+naturelle/gi, "soft natural daylight"],
    [/lumière\s+(?:de\s+)?studio/gi, "professional studio lighting"],
    [/éclairage\s+(?:dramatique|fort)/gi, "dramatic cinematic lighting"],
    [/coucher\s+de\s+soleil/gi, "golden sunset lighting"],
    [/lever\s+de\s+soleil/gi, "soft sunrise lighting"],
    [/néon/gi, "neon lights"],
    [/lumière\s+bleue/gi, "blue light"],
    [/lumière\s+rose/gi, "pink light"],

    // ── Clothing ──────────────────────────────────────────────────────────────
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

    // ── Hair / appearance ─────────────────────────────────────────────────────
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

    // ── Quality ───────────────────────────────────────────────────────────────
    [/haute\s+qualité|hd|4k|8k/gi, "ultra high definition quality"],
    [/améliore?\s+(?:la\s+)?qualité/gi, "improve overall image quality"],
    [/nettoie?\s+(?:la\s+)?photo/gi, "clean and enhance the photo"],

    // ── Misc French → English ────────────────────────────────────────────────
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

// ─── IMAGE LOADER ─────────────────────────────────────────────────────────────

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
  console.log(`[Pipeline] Image loaded as base64 (${Math.round(b64.length / 1024)}KB)`);
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
// Pipeline: Z-Image Turbo (text→image) → face-swap (injects user's face) → optional upscale
// POST /api/generate starts the job and returns immediately (<5s).
// GET /api/generate/poll checks status and advances one step at a time (<5s each).

export type AsyncJobConfig = {
  mode:        "style" | "swapface";
  qualityTier: keyof typeof QUALITY_SETTINGS;
  prompt?:     string;    // scene description for Z-Image Turbo
  width?:      number;
  height?:     number;
  sourceB64?:  string;   // user's face (needed for face-swap step)
};

// Wraps replicate.predictions.create for both versioned and unversioned model specs
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

  const prompt = buildIdeogramPrompt(
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
    sourceB64,
    prompt,
    width:  dims.width,
    height: dims.height,
  };
}

// Start step 1 — returns Replicate prediction ID immediately (non-blocking)
export async function startAsyncJob(
  config:     AsyncJobConfig,
  targetB64?: string, // swapface mode only: the target photo
): Promise<string> {
  if (config.mode === "swapface") {
    const p = await createPred(MODELS.faceSwap, {
      swap_image:  config.sourceB64!,
      input_image: targetB64!,
    });
    return p.id;
  }

  // Style: Z-Image Turbo generates the scene (text-to-image)
  const p = await createPred(MODELS.zImageTurbo, {
    prompt:              config.prompt!,
    width:               config.width  ?? 832,
    height:              config.height ?? 1152,
    num_inference_steps: 8,
    guidance_scale:      0,
  });
  return p.id;
}

export type AdvanceResult =
  | { done: true;  outputUrl: string }
  | { done: false; predictionId: string; step: number };

// Called by the poll handler after a prediction completes.
// Starts the next step or returns the final output URL.
export async function advanceAsyncJob(
  config:     AsyncJobConfig,
  step:       number,
  predOutput: unknown,
): Promise<AdvanceResult> {
  const q         = QUALITY_SETTINGS[config.qualityTier];
  const outputUrl = extractUrl(predOutput);

  // ── SWAPFACE: 1 step + optional upscale ──────────────────────────────────
  if (config.mode === "swapface") {
    if (step === 1 && q.upscale) {
      const p = await createPred(MODELS.realEsrgan, { image: outputUrl, scale: 4, face_enhance: true });
      return { done: false, predictionId: p.id, step: 2 };
    }
    return { done: true, outputUrl };
  }

  // ── STYLE step 1: Z-Image Turbo scene done → face-swap ───────────────────
  if (step === 1) {
    const sceneB64 = await loadImageAsBase64(outputUrl);
    const p = await createPred(MODELS.faceSwap, {
      swap_image:  config.sourceB64!,  // user's face
      input_image: sceneB64,           // AI-generated scene
    });
    return { done: false, predictionId: p.id, step: 2 };
  }

  // ── STYLE step 2: face-swap done → optional upscale ──────────────────────
  if (step === 2) {
    if (q.upscale) {
      const p = await createPred(MODELS.realEsrgan, { image: outputUrl, scale: 4, face_enhance: true });
      return { done: false, predictionId: p.id, step: 3 };
    }
    return { done: true, outputUrl };
  }

  // step 3+: upscale done
  return { done: true, outputUrl };
}

// Kept for use by poll route
export { replicate, withRetry };
