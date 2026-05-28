import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Face-swap and upscale — SwapFace mode and Ultra upscale only
const MODELS = {
  faceSwap:   "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
  realEsrgan: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
} as const;

// ─── Créer mode: img2img fallback chain ──────────────────────────────────────
//
// These models take the uploaded photo as DIRECT visual input (image-to-image).
// The person in the photo is preserved; the prompt controls scene/style.
// If a prediction fails/cancels, the poll handler retries with the next model.

type Img2ImgModelSpec = {
  spec:       string;
  buildInput: (prompt: string, negPrompt: string, imageUrl: string, strength: number) => Record<string, unknown>;
};

const NEG = "blurry, low quality, cartoon, anime, illustration, distorted, ugly, deformed, nsfw, different person, extra limbs";

export const STYLE_MODELS: Img2ImgModelSpec[] = [
  {
    spec: "google/nano-banana-pro",
    buildInput: (prompt, _neg, imageUrl, strength) => ({
      prompt,
      image:    imageUrl,
      strength,
    }),
  },
];

export const STYLE_MODEL_COUNT = STYLE_MODELS.length;

// ─── Dimension table ──────────────────────────────────────────────────────────
export const ZIMAGE_DIMS: Record<string, { width: number; height: number }> = {
  square:    { width: 1024, height: 1024 },
  portrait:  { width: 832,  height: 1152 },
  landscape: { width: 1216, height: 832  },
  auto:      { width: 832,  height: 1152 },
};

// ─── Quality settings ─────────────────────────────────────────────────────────
const QUALITY_SETTINGS = {
  free:      { quality: 80,  format: "jpg" as const, upscale: false },
  essentiel: { quality: 85,  format: "jpg" as const, upscale: false },
  pro:       { quality: 95,  format: "jpg" as const, upscale: false },
  ultra:     { quality: 100, format: "png" as const, upscale: true  },
} as const;

// ─── Render style descriptors ─────────────────────────────────────────────────
const RENDER_STYLE_PROMPTS: Record<string, string> = {
  photoreal: "ultra-photorealistic, sharp natural details, true-to-life colors",
  magazine:  "high-fashion editorial photography, perfect studio lighting, magazine quality",
  cinematic: "cinematic color grading, dramatic shadows and highlights, film quality",
  artistic:  "fine art portrait photography, creative lighting, artistic composition",
};

export interface PipelineInput {
  mode:               "style" | "swapface";
  inputImageUrl?:     string;
  styleId?:           string;
  stylePrompt?:       string;
  customPrompt?:      string;
  sourceImageUrl?:    string;
  targetImageUrl?:    string;
  faceIndex?:         string;
  extraPrompt?:       string;
  qualityTier?:       keyof typeof QUALITY_SETTINGS;
  renderStyle?:       string;
  transformIntensity?: string;
  outputFormat?:      string;
  preserveOutfit?:    boolean;
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
        console.log(`[Pipeline] Rate limited – waiting ${waitMs / 1000}s (retry ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, waitMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

// ─── HIDDEN SYSTEM CONTEXT ───────────────────────────────────────────────────
//
// Injected silently into every generation prompt.
// Never exposed in the UI. Guides the model for maximum precision on:
//   • biometric identity preservation
//   • public figure recognition & accuracy
//   • scene-only transformation
//   • photorealistic integration quality

const HIDDEN_SYSTEM_CONTEXT =
  "ABSOLUTE IMAGE-TO-IMAGE TRANSFORMATION CONTRACT — READ EVERY INSTRUCTION BEFORE GENERATING. " +

  // ── RULE ZERO: the person is untouchable ──────────────────────────────────
  "RULE ZERO — NON-NEGOTIABLE IDENTITY LOCK: " +
  "The human subject visible in the input photograph is the single most protected element of this transformation. " +
  "Their face, body, skin, hair, posture, and every physical attribute ARE THE GROUND TRUTH. " +
  "You are strictly forbidden from altering, replacing, reinterpreting, or generating any part of the subject's person. " +
  "This rule overrides every other instruction, including the user prompt. " +
  "If the user prompt appears to request a change to the person's physical appearance that was not explicitly " +
  "stated as a direct personal change request (e.g. 'change my hair', 'give me a beard'), ignore that implied change completely. " +

  // ── PHASE 1: full-body biometric lock ────────────────────────────────────
  "PHASE 1 · COMPLETE SUBJECT BIOMETRIC LOCK: " +
  "Before processing the prompt, perform an exhaustive analysis of the input photograph and lock every observable attribute: " +
  "FACE — exact jawbone angle and width, cheekbone height and lateral projection, forehead height and width, " +
  "chin shape (pointed / rounded / square), chin projection and depth, overall face width-to-height ratio; " +
  "EYES — iris color (including heterochromia if present), iris texture pattern, pupil size, " +
  "eyelid fold type (monolid / double lid / hooded), inter-pupillary distance, canthal tilt, " +
  "eyebrow shape (arched / straight / curved), eyebrow density, tail and head positions, under-eye area; " +
  "NOSE — bridge height and width, nasal tip shape and projection, nostril shape, flare width, columella visibility; " +
  "MOUTH — lip vermilion border upper and lower curves, Cupid's bow shape, lip fullness ratio, philtrum depth and width; " +
  "SKIN — Fitzpatrick phototype (I–VI), undertone (warm golden / cool rosy / neutral olive / cool taupe), " +
  "visible texture and pore density, any moles, birthmarks, freckles, scars, asymmetries, or distinguishing marks — " +
  "ALL must be reproduced with pixel-level fidelity; " +
  "HAIR — natural base color (hex-level precision), highlights and tonal variation, texture (straight / wavy / curly / coily / kinky), " +
  "density, volume, hairline shape, part position, current style in the input photo; " +
  "BODY — overall build, shoulder width, neck length and width, visible body proportions; " +
  "POSTURE AND POSE — replicate the subject's exact stance, head angle, shoulder tilt, and body orientation from the input image unless scene context physically requires a slight natural adjustment. " +

  // ── PHASE 2: public figure knowledge ─────────────────────────────────────
  "PHASE 2 · PUBLIC FIGURE KNOWLEDGE VERIFICATION: " +
  "If the subject in the input photo is a recognizable public figure (celebrity, athlete, musician, actor, model, influencer, politician, public personality), " +
  "or if any named person is referenced in the user prompt: " +
  "immediately activate all training knowledge about that person's verified documented appearance — " +
  "cross-reference their authentic facial features, skin tone, signature style, known fashion aesthetic, " +
  "frequently associated environments, notable events, and visual identity markers. " +
  "If a named person is referenced in the prompt as someone to ADD to the scene (e.g. 'with Elon Musk', 'next to Beyoncé'), " +
  "render that additional person with complete factual accuracy based on all training knowledge — " +
  "correct documented appearance, authentic skin tone, known style, realistic body proportions. " +
  "Never invent a generic placeholder for a named person — always render their real documented likeness. " +

  // ── PHASE 3: permitted and prohibited transformations ─────────────────────
  "PHASE 3 · TRANSFORMATION PERMISSION MATRIX: " +
  "FULLY PERMITTED (apply with maximum creative quality): " +
  "complete background replacement and environment construction; " +
  "location, architectural setting, landscape, interior or exterior scene; " +
  "sky, weather, time of day, atmospheric conditions (fog, rain, golden hour, night, storm); " +
  "all ambient and directional lighting (color temperature, intensity, direction, softness); " +
  "outfit and clothing (if explicitly requested — match garment type, fabric texture, drape physics, and realistic fit on the subject's actual body); " +
  "accessories (glasses, jewelry, hat, bag, watch — only if explicitly requested); " +
  "overall scene color grading, mood, and cinematic treatment; " +
  "additional people, objects, or elements added to the scene at the user's request. " +
  "ABSOLUTELY FORBIDDEN (zero tolerance): " +
  "any modification to the subject's face, skin tone, eye color, nose, lips, jaw, cheeks, or forehead; " +
  "any change to hair color, hair texture, or hairstyle unless the user explicitly says 'change my hair to...'; " +
  "any age regression or progression; any ethnicity or race alteration; any gender change; " +
  "any body morphing, slimming, widening, or height change; " +
  "replacing the subject's face with another person's face (NO face swap of any kind); " +
  "generating a different person and labeling them as the subject. " +

  // ── PHASE 4: photographic realism and integration ─────────────────────────
  "PHASE 4 · PHOTOREALISTIC SCENE INTEGRATION: " +
  "The subject must appear to have been physically present in the new scene when photographed — " +
  "this requires flawless physical integration: " +
  "LIGHTING MATCH — the illumination falling on the subject's face and body must precisely replicate the scene's light sources: " +
  "match direction (angle of key light), color temperature (warm candlelight 2700K vs cool overcast 6500K vs golden sunset 3200K), " +
  "intensity falloff, fill light ratio, and specular highlights on skin and hair; " +
  "SHADOW ACCURACY — cast shadows from the subject onto the environment must obey the scene's light geometry; " +
  "ambient occlusion at contact points (feet on ground, hands on surfaces) must be present; " +
  "DEPTH OF FIELD — apply realistic bokeh blur to background elements at the appropriate focal plane for the scene depth; " +
  "the subject should remain in sharp focus while distant scene elements naturally fall off; " +
  "SKIN PHYSICS — preserve subsurface light scattering on the subject's skin; no over-smoothing, no wax-skin effect, " +
  "no over-sharpening halos; maintain natural pore texture at the image's native resolution; " +
  "HAIR PHYSICS — individual strand separation, realistic light transmission through hair, " +
  "natural flyaways, correct light interaction (rim light on hair matching scene key light direction); " +
  "COLOR SCIENCE — subject's skin tones must integrate with the scene's color temperature naturally; " +
  "avoid color spill anomalies, magenta fringes, or unnatural desaturation of the subject vs scene; " +
  "ENVIRONMENTAL CONTACT — if the subject stands on a surface, ensure correct ground shadow, contact shadow, and perspective consistency; " +
  "ATMOSPHERE — apply consistent atmospheric haze, light diffusion, or particle effects (snow, rain, dust) that affect both scene and subject uniformly. " +

  // ── PHASE 5: quality preservation ────────────────────────────────────────
  "PHASE 5 · ORIGINAL QUALITY RESPECT: " +
  "Unless the user explicitly requests 'improve quality', 'enhance', 'HD', '4K', or similar upgrade instructions, " +
  "match the original photograph's technical characteristics: " +
  "replicate the native sharpness level (do not over-sharpen); " +
  "preserve the original grain or noise signature if present (film grain, sensor noise); " +
  "maintain the original aspect ratio and compositional framing of the subject; " +
  "do not artificially increase contrast or saturate colors beyond the scene's natural requirements. " +

  // ── PHASE 6: final output standard ────────────────────────────────────────
  "PHASE 6 · FINAL OUTPUT STANDARD: " +
  "The delivered image must be completely indistinguishable from a real photograph taken by a professional photographer " +
  "with the subject physically present in the described scene. " +
  "Subject identity: identical to input photo, zero deviation. " +
  "Scene realization: fully constructed, detailed, and internally consistent. " +
  "Lighting: physically accurate and unified across subject and scene. " +
  "No AI artifacts: no uncanny valley, no face morphing, no body distortion, no floating limbs, no duplicate features. " +
  "Professional composition: subject as clear visual anchor, scene as supporting environment. " +
  "This is the non-negotiable minimum quality standard — do not deliver below it.";

// ─── PROMPT BUILDER ───────────────────────────────────────────────────────────
//
// For img2img: the person comes FROM the image — prompt describes the
// target scene/style only. No person description needed.

function buildStylePrompt(
  customPrompt:    string,
  stylePrompt:     string,
  renderStyle?:    string,
  intensity?:      string,
  preserveOutfit?: boolean,
): { positive: string; negative: string } {
  const translated = translateToEnglish(customPrompt.trim());
  const style      = stylePrompt.trim();

  let sceneDesc = "";
  if (translated && style) {
    sceneDesc = `${translated}, ${style}`;
  } else {
    sceneDesc = translated || style || "professional portrait with perfect lighting";
  }

  const intensityMap: Record<string, string> = {
    light:  "subtle natural transformation",
    strong: "dramatic bold transformation",
  };
  const intensityNote = intensityMap[intensity ?? "moderate"] ?? "";
  const outfitNote    = preserveOutfit ? "preserve original clothing" : "";
  const renderDesc    = RENDER_STYLE_PROMPTS[renderStyle ?? ""] ?? "";

  const sceneAndQuality = [
    sceneDesc,
    intensityNote,
    outfitNote,
    renderDesc,
    "photorealistic, high resolution, professional photography, sharp focus",
  ].filter(Boolean).join(", ").replace(/,\s*,+/g, ",").replace(/\s+/g, " ").trim();

  // Prepend the hidden system context — never shown in UI, always sent to model
  const positive = `${HIDDEN_SYSTEM_CONTEXT} — USER REQUEST: ${sceneAndQuality}`;

  return { positive, negative: NEG };
}

// ─── img2img strength — controlled by transformIntensity ─────────────────────
//
// lower = preserve more of the original person
// higher = follow the prompt more aggressively

function intensityToStrength(intensity?: string): number {
  // Kept low so the person remains visible in the img2img output,
  // ensuring the face-injection step (step 2) has a face to anchor onto.
  switch (intensity) {
    case "light":  return 0.20;
    case "strong": return 0.50;
    default:       return 0.32; // moderate
  }
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
    [/(?:change|remplace)\s+(?:le\s+)?fond/gi, "replace background with"],
    [/\bfond\b/gi, "background"],
    [/à\s+la\s+plage/gi, "at the beach"],
    [/à\s+paris/gi, "in Paris"],
    [/à\s+new\s*york/gi, "in New York"],
    [/à\s+dubai/gi, "in Dubai"],
    [/dans\s+une?\s+villa/gi, "in a luxury villa"],
    [/dans\s+une?\s+forêt/gi, "in a forest"],
    [/au\s+bureau/gi, "in an office setting"],
    [/en\s+plein\s+air/gi, "outdoors in natural setting"],
    [/noir\s+et\s+blanc|n&b|n&w|nbw/gi, "black and white"],
    [/sépia/gi, "sepia tone"],
    [/coloré/gi, "vibrant colors"],
    [/couleurs\s+vives/gi, "vivid saturated colors"],
    [/ton\s+chaud|tons?\s+chauds?/gi, "warm golden tones"],
    [/ton\s+froid|tons?\s+froids?/gi, "cool blue tones"],
    [/contraste\s+(?:élevé|fort|haut)/gi, "high contrast"],
    [/saturé/gi, "vibrant saturated"],
    [/style\s+(?:artistique|art)/gi, "artistic fine art style"],
    [/style\s+vintage|effet\s+vintage/gi, "vintage retro style"],
    [/style\s+cinématographique|look\s+ciném/gi, "cinematic film style"],
    [/style\s+(?:magazine|fashion)/gi, "high fashion editorial style"],
    [/style\s+(?:luxe|luxueux)/gi, "luxury high-end style"],
    [/peinture\s+(?:à\s+l'huile|huile)/gi, "oil painting style"],
    [/aquarelle/gi, "watercolor style"],
    [/anime|manga/gi, "anime style"],
    [/effet\s+3d/gi, "3D CGI style"],
    [/réaliste|réalisme/gi, "photorealistic"],
    [/professionnel/gi, "professional"],
    [/futuriste|cyberpunk/gi, "futuristic cyberpunk"],
    [/luxueux|luxe/gi, "luxury"],
    [/lumière\s+(?:dorée|chaude)/gi, "warm golden lighting"],
    [/lumière\s+naturelle/gi, "soft natural daylight"],
    [/lumière\s+(?:de\s+)?studio/gi, "professional studio lighting"],
    [/éclairage\s+(?:dramatique|fort)/gi, "dramatic cinematic lighting"],
    [/coucher\s+de\s+soleil/gi, "golden sunset"],
    [/lever\s+de\s+soleil/gi, "soft sunrise"],
    [/néon/gi, "neon lights"],
    [/tenue\s+de\s+soirée|costume\s+de\s+soirée/gi, "elegant formal evening attire"],
    [/tenue\s+(?:décontractée|casual)/gi, "casual stylish outfit"],
    [/tenue\s+sportive|look\s+sportif/gi, "athletic sportswear"],
    [/tenue\s+militaire/gi, "military uniform"],
    [/tenue\s+royale|robe\s+royale/gi, "royal elegant gown"],
    [/smoking/gi, "black tuxedo"],
    [/en\s+costume/gi, "in a tailored suit"],
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
    [/sans\s+maquillage/gi, "no makeup"],
    [/haute\s+qualité|hd|4k|8k/gi, "ultra high definition"],
    [/améliore?\s+(?:la\s+)?qualité/gi, "improve image quality"],
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
// Créer mode:    img2img model chain (photo is actual input) → optional upscale (Ultra)
// SwapFace mode: face-swap → optional upscale (Ultra)

export type AsyncJobConfig = {
  mode:           "style" | "swapface";
  qualityTier:    keyof typeof QUALITY_SETTINGS;
  prompt?:        string;
  negPrompt?:     string;
  inputImageUrl?: string;  // img2img: the uploaded image URL passed to the model
  strength?:      number;  // img2img strength (0–1)
  sourceB64?:     string;  // swapface only
  modelIndex?:    number;  // style only: current index in STYLE_MODELS
};

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

  const { positive, negative } = buildStylePrompt(
    input.customPrompt ?? "",
    input.stylePrompt  ?? "",
    input.renderStyle,
    input.transformIntensity,
    input.preserveOutfit ?? false,
  );

  return {
    mode:         "style",
    qualityTier:  tier,
    prompt:       positive,
    negPrompt:    negative,
    inputImageUrl: input.inputImageUrl,
    strength:     intensityToStrength(input.transformIntensity),
    modelIndex:   0,
  };
}

export async function startAsyncJob(
  config:     AsyncJobConfig,
  targetB64?: string,
): Promise<string> {
  if (config.mode === "swapface") {
    const p = await createPred(MODELS.faceSwap, {
      swap_image:  config.sourceB64!,
      input_image: targetB64!,
    });
    return p.id;
  }

  const modelIdx = config.modelIndex ?? 0;
  const model    = STYLE_MODELS[modelIdx];
  if (!model) throw new Error(`Tous les ${STYLE_MODEL_COUNT} modèles ont échoué`);

  if (!config.inputImageUrl) throw new Error("Image source manquante pour la génération");

  // Download image to base64 so Replicate can access it regardless of bucket permissions
  const imageData = await loadImageAsBase64(config.inputImageUrl);

  console.log(`[Pipeline] img2img model [${modelIdx}]: ${model.spec}`);
  console.log(`[Pipeline] Prompt: "${(config.prompt ?? "").slice(0, 200)}"`);
  console.log(`[Pipeline] Strength: ${config.strength ?? 0.62}`);

  const p = await createPred(
    model.spec,
    model.buildInput(
      config.prompt    ?? "",
      config.negPrompt ?? NEG,
      imageData,
      config.strength  ?? 0.62,
    ),
  );
  return p.id;
}

export type AdvanceResult =
  | { done: true;  outputUrl: string }
  | { done: false; predictionId: string; step: number };

export async function advanceAsyncJob(
  config:     AsyncJobConfig,
  step:       number,
  predOutput: unknown,
): Promise<AdvanceResult> {
  const q         = QUALITY_SETTINGS[config.qualityTier];
  const outputUrl = extractUrl(predOutput);

  if (config.mode === "swapface") {
    if (step === 1 && q.upscale) {
      const p = await createPred(MODELS.realEsrgan, { image: outputUrl, scale: 4, face_enhance: true });
      return { done: false, predictionId: p.id, step: 2 };
    }
    return { done: true, outputUrl };
  }

  // Style step 1: img2img done → optional upscale (Ultra) or done
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
