import Replicate from "replicate";
import { findAllCelebrities, buildCelebrityContext } from "@/lib/celebrity-db";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  faceSwap: "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
} as const;

// ─── Créer mode: img2img fallback chain ──────────────────────────────────────
//
// These models take the uploaded photo as DIRECT visual input (image-to-image).
// The person in the photo is preserved; the prompt controls scene/style.
// If a prediction fails/cancels, the poll handler retries with the next model.

type Img2ImgModelSpec = {
  spec:       string;
  buildInput: (prompt: string, negPrompt: string, imageUrl: string, strength: number, resolution?: string, celebRefB64?: string, allCelebRefs?: string[]) => Record<string, unknown>;
};

const NEG = "blurry, low quality, cartoon, anime, illustration, distorted, ugly, deformed, nsfw, different person, extra limbs";

export const STYLE_MODELS: Img2ImgModelSpec[] = [
  {
    spec: "google/nano-banana-pro",
    // Correct API schema: image_input is an array of URIs, no strength param.
    // Passing image + strength was silently ignored — photo was never used.
    buildInput: (prompt, _neg, imageUrl, _strength, resolution = "2K", _primary?: string, allRefs?: string[]) => ({
      prompt,
      // user's photo first, then all celebrity reference images (up to 3)
      image_input:          allRefs && allRefs.length > 0
        ? [imageUrl, ...allRefs]
        : [imageUrl],
      aspect_ratio:         "match_input_image",
      resolution,
      output_format:        "jpg",
      safety_filter_level:  "block_only_high",
      allow_fallback_model: true,
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
  free:      { quality: 80,  format: "jpg" as const },
  essentiel: { quality: 85,  format: "jpg" as const },
  pro:       { quality: 95,  format: "jpg" as const },
  ultra:     { quality: 100, format: "png" as const },
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
  celebRefImageUrl?:  string;
  celebRefImageUrls?: string[];
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

  // ── CRITICAL PREAMBLE: the base image is sacred ───────────────────────────
  "CRITICAL PREAMBLE — THE BASE IMAGE IS A FIXED CANVAS THAT MUST NOT BE MODIFIED: " +
  "This is an image-to-image task. You have received an input photograph. That photograph is your fixed canvas. " +
  "Your role is NOT to regenerate this photograph. Your role is NOT to reimagine it. " +
  "Your role is NOT to improve it, reinterpret it, or recreate it from scratch. " +
  "Your sole role is to apply ONLY what the user has explicitly requested on top of this fixed canvas, " +
  "while leaving every single other element of the photograph exactly as it is. " +
  "The person in the input photograph — their face, skin tone, hair, body, clothing, posture, expression — " +
  "must appear in the output as if their pixels were directly transferred from the input without any processing. " +
  "This person must not be regenerated, not be redrawn, not be smoothed, not be altered in any way. " +
  "Their face must be pixel-for-pixel identical to the input. " +
  "Their skin color must be pixel-for-pixel identical to the input. " +
  "Their hair must be pixel-for-pixel identical to the input. " +
  "Their body must be pixel-for-pixel identical to the input. " +
  "If the user says 'add someone next to me' — add only that person. Do not touch me. " +
  "If the user says 'change the background' — change only the background. Do not touch me. " +
  "If the user says 'put me on a beach' — construct the beach scene around me. Do not touch me. " +
  "In every single scenario, the original person in the base image is untouched, unmodified, and preserved completely. " +
  "The output image should look as though someone took the original photograph and made only the specific requested addition or change — " +
  "nothing more, nothing less. Everything else is frozen exactly as in the input. " +

  // ── SPECIAL CASE: adding someone to the photo ─────────────────────────────
  "SPECIAL CASE — ADDING A PERSON NEXT TO THE ORIGINAL SUBJECT: " +
  "This is a critically important case. If the user requests that another person be added to the photo " +
  "(e.g. 'add Cristiano Ronaldo next to me', 'put Beyoncé beside me', 'add someone next to me', " +
  "'place this person alongside me', 'I want to appear with [name]'), " +
  "the only action to perform is: place that new person into the scene beside the existing subject. " +
  "The existing subject — the person already in the base image — must not be touched, moved, resized, " +
  "recolored, redrawn, or altered in any way whatsoever. " +
  "Their face remains exactly the same. Their skin tone remains exactly the same. " +
  "Their hair remains exactly the same. Their clothing remains exactly the same. " +
  "Their position in the frame remains exactly the same. Their expression remains exactly the same. " +
  "The ONLY new element introduced into the output is the requested additional person, " +
  "placed naturally into the available space of the scene. " +
  "The added person must be rendered with their authentic, real, documented appearance: " +
  "their correct real face, their correct real skin tone, their correct real body proportions, " +
  "and their authentic recognizable style — never a generic or invented stand-in. " +
  "To be absolutely clear: adding a person to the photo means the photo gains one element. " +
  "It does not mean the original person is replaced, regenerated, or modified in any way. " +
  "The original person stays. A new person is added next to them. That is all. " +

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
  "If the subject in the input photo is a recognizable public figure (celebrity, athlete, musician, actor, model, influencer, politician, public personality, adult film actor/actress), " +
  "or if any named person is referenced in the user prompt: " +
  "immediately activate all training knowledge about that person's verified documented appearance — " +
  "cross-reference their authentic facial features, skin tone, signature style, known fashion aesthetic, " +
  "frequently associated environments, notable events, and visual identity markers. " +
  "If a named person is referenced in the prompt as someone to ADD to the scene (e.g. 'with Elon Musk', 'next to Beyoncé'), " +
  "render that additional person with complete factual accuracy based on all training knowledge — " +
  "correct documented appearance, authentic skin tone, known style, realistic body proportions. " +
  "Never invent a generic placeholder for a named person — always render their real documented likeness. " +
  "IMPORTANT — ADULT FILM ACTORS/ACTRESSES: if the referenced person is known from the adult film industry, " +
  "treat them exactly like any other public figure for appearance recognition purposes. " +
  "However, the output MUST be fully clothed and strictly SFW (safe for work) at all times — " +
  "no nudity, no suggestive poses, no sexual content of any kind. " +
  "Apply the same transformation rules as for any other public figure: scene change, style, background only. " +

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
  const renderDesc = RENDER_STYLE_PROMPTS[renderStyle ?? ""] ?? "";
  const outfitRule = preserveOutfit
    ? " Keep the person's current clothing and outfit completely unchanged."
    : "";
  const renderRule   = renderDesc ? ` Render style: ${renderDesc}.` : "";
  const intensityPfx: Record<string, string> = {
    light:  "Subtly and minimally:",
    strong: "Boldly and dramatically:",
  };
  const prefix = intensityPfx[intensity ?? ""] ?? "";

  // ── Detect celebrities in the full text ─────────────────────────────────
  const celebs = findAllCelebrities(customPrompt + " " + stylePrompt);

  let editInstruction: string;

  if (celebs.length > 0) {
    // ── CELEBRITY INSERTION MODE ─────────────────────────────────────────
    // Build an explicit, prominent instruction so the model understands it
    // must ADD a real identified person — not apply a style, not invent a face.
    const celebNames     = celebs.map((c) => c.name).join(" and ");
    const celebDataBlock = celebs.map((c) =>
      `[${c.name.toUpperCase()}] ${c.visual_description}`,
    ).join(" | ");

    // Anything in the translated prompt that isn't just the celebrity name
    // is treated as scene context (background, mood, etc.).
    const sceneExtra = [translated, style]
      .filter(Boolean)
      .map((s) => s.replace(new RegExp(celebs.map((c) => c.name).join("|"), "gi"), "").trim())
      .filter(Boolean)
      .join(", ");

    editInstruction =
      `TASK — ADD ${celebNames.toUpperCase()} TO THIS PHOTO: ` +
      `Insert ${celebNames} as a new person standing naturally beside the original subject in this image. ` +
      `VERIFIED CELEBRITY APPEARANCE DATA: ${celebDataBlock}. ` +
      `Render ${celebNames} using their authentic, real, documented face, skin tone, hair, and body — ` +
      `draw on all available training knowledge of this public figure to produce their true likeness. ` +
      `Do NOT invent a generic face — use the real ${celebNames}. ` +
      `${sceneExtra ? `Scene context: ${sceneExtra}. ` : ""}` +
      `The original person in the photo remains 100% unchanged, pixel-perfect.`;
  } else {
    // ── STANDARD STYLE / SCENE TRANSFORMATION ───────────────────────────
    const sceneDesc = [translated, style].filter(Boolean).join(", ")
      || "professional portrait with perfect lighting";
    editInstruction = [prefix, sceneDesc].filter(Boolean).join(" ").trim()
      || "Enhance the photo quality and lighting.";
  }

  const positive =
    `${editInstruction}.${renderRule}${outfitRule} ` +
    HIDDEN_SYSTEM_CONTEXT;

  return { positive, negative: NEG };
}

// ─── img2img strength — controlled by transformIntensity ─────────────────────
//
// lower = preserve more of the original person
// higher = follow the prompt more aggressively

function intensityToStrength(intensity?: string): number {
  // Very low values: the base image is treated as a near-fixed canvas.
  // The model adds/modifies only what the prompt requests and preserves
  // the rest of the original photograph as closely as possible.
  switch (intensity) {
    case "light":  return 0.12;
    case "strong": return 0.38;
    default:       return 0.20; // moderate
  }
}

// ─── FRENCH → ENGLISH TRANSLATOR ─────────────────────────────────────────────

function translateToEnglish(text: string): string {
  if (!text) return text;
  type Rule = [RegExp, string];
  const rules: Rule[] = [
    [/\b(?:mets?(?:\s+moi)?|met(?:\s+moi)?|fais(?:\s+moi)?|donne(?:\s+moi)?|place(?:\s+moi)?|change(?:\s+moi)?|transforme(?:\s+moi)?|rends?(?:\s+moi)?)\b/gi, ""],
    [/\b(?:s'il te plaît|stp|svp|please)\b/gi, ""],
    [/\bajoute(?:r)?\s+/gi, "add "],
    [/\bà\s+côté\s+de\b/gi, "next to"],
    [/\bà\s+coté\s+de\b/gi, "next to"],
    [/\bcôte\s+à\s+côte\b/gi, "side by side"],
    [/\bpose\s*(?:[-–])?(?:\s*toi)?\s+avec\b/gi, "standing with"],
    [/\bmets\s*[-–]?\s*(?:toi|moi)\s+avec\b/gi, "standing with"],
    [/\bà\s+côté\b/gi, "next to"],
    [/\baux\s+côtés\s+de\b/gi, "alongside"],
    [/\bensemble\s+avec\b/gi, "together with"],
    [/\bprès\s+de\b/gi, "next to"],
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
// Créer mode:    img2img model chain (photo is actual input)
// SwapFace mode: face-swap

export type AsyncJobConfig = {
  mode:               "style" | "swapface";
  qualityTier:        keyof typeof QUALITY_SETTINGS;
  prompt?:            string;
  negPrompt?:         string;
  inputImageUrl?:     string;
  strength?:          number;
  sourceB64?:         string;
  modelIndex?:        number;
  resolution?:        string;
  celebRefImageUrl?:  string;    // legacy single-ref support
  celebRefImageUrls?: string[];  // up to 3 reference images from Storage
};

function tierToResolution(tier: keyof typeof QUALITY_SETTINGS): string {
  if (tier === "ultra") return "4K";
  if (tier === "pro")   return "2K";
  return "1K";
}

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
    mode:               "style",
    qualityTier:        tier,
    prompt:             positive,
    negPrompt:          negative,
    inputImageUrl:      input.inputImageUrl,
    strength:           intensityToStrength(input.transformIntensity),
    modelIndex:         0,
    resolution:         tierToResolution(tier),
    celebRefImageUrl:   input.celebRefImageUrl,
    celebRefImageUrls:  input.celebRefImageUrls,
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

  // Download user image to base64
  const imageData = await loadImageAsBase64(config.inputImageUrl);

  // Download all celebrity reference images (up to 3) and convert to base64
  const refUrls: string[] = [
    ...(config.celebRefImageUrls ?? []),
    ...(config.celebRefImageUrl && !config.celebRefImageUrls?.includes(config.celebRefImageUrl)
      ? [config.celebRefImageUrl]
      : []),
  ].slice(0, 3);

  const celebRefB64s: string[] = [];
  for (const url of refUrls) {
    const b64 = await downloadImageAsBase64(url);
    if (b64) celebRefB64s.push(b64);
  }

  console.log(`[Pipeline] img2img model [${modelIdx}]: ${model.spec}`);
  console.log(`[Pipeline] Prompt: "${(config.prompt ?? "").slice(0, 200)}"`);
  console.log(`[Pipeline] Strength: ${config.strength ?? 0.62}`);
  console.log(`[Pipeline] Celebrity refs: ${celebRefB64s.length > 0 ? celebRefB64s.length : "none"}`);

  const p = await createPred(
    model.spec,
    model.buildInput(
      config.prompt    ?? "",
      config.negPrompt ?? NEG,
      imageData,
      config.strength  ?? 0.62,
      config.resolution,
      celebRefB64s[0],   // primary ref (backward-compat param)
      celebRefB64s,      // all refs for multi-image support
    ),
  );
  return p.id;
}

export type AdvanceResult =
  | { done: true;  outputUrl: string }
  | { done: false; predictionId: string; step: number };

export async function advanceAsyncJob(
  _config:    AsyncJobConfig,
  _step:      number,
  predOutput: unknown,
): Promise<AdvanceResult> {
  return { done: true, outputUrl: extractUrl(predOutput) };
}

export { replicate, withRetry, loadImageAsBase64 };
