import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  // Official BFL — image-to-image editing, best quality
  fluxKontextMax: "black-forest-labs/flux-kontext-max",
  // Face swap — verified hash May 2026
  faceSwap: "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
  // 4× upscale for Ultra tier
  realEsrgan: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
} as const;

// ─── Quality settings per subscription tier ───────────────────────────────────
const QUALITY_SETTINGS = {
  free:      { quality: 80,  format: "jpg" as const, upscale: false },
  essentiel: { quality: 85,  format: "jpg" as const, upscale: false },
  pro:       { quality: 95,  format: "jpg" as const, upscale: false },
  ultra:     { quality: 100, format: "png" as const, upscale: true  },
} as const;

// ─── Aspect ratio mapping ─────────────────────────────────────────────────────
const ASPECT_RATIOS: Record<string, string> = {
  square:    "1:1",
  portrait:  "3:4",
  landscape: "16:9",
  auto:      "match_input_image",
};

// ─── Render style descriptors ─────────────────────────────────────────────────
const RENDER_STYLE_PROMPTS: Record<string, string> = {
  photoreal: "ultra-photorealistic, sharp natural details, true-to-life colors",
  magazine:  "high-fashion editorial photography, perfect studio lighting, magazine quality retouching",
  cinematic: "cinematic color grading, dramatic shadows and highlights, movie-quality aesthetic",
  artistic:  "fine art portrait photography, creative lighting, artistic composition",
};

// ─── Intensity modifiers ──────────────────────────────────────────────────────
const INTENSITY_PREFIX: Record<string, string> = {
  light:    "Subtly and minimally",
  moderate: "",
  strong:   "Boldly and dramatically",
};

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
  // Generation options
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

export async function runPipeline(input: PipelineInput): Promise<string> {
  const start = Date.now();
  const tier = input.qualityTier ?? "essentiel";
  console.log(`[Pipeline] Mode: ${input.mode} | Tier: ${tier}`);
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
  const imageUrl   = input.inputImageUrl!;
  const rawPrompt  = input.customPrompt?.trim() || "";
  const stylePrompt = input.stylePrompt?.trim() || "";

  if (isCompositionRequest(rawPrompt)) {
    console.log("[Pipeline] → Composition detected");
    return runCompositionPipeline(imageUrl, rawPrompt, input);
  }

  console.log("[Pipeline] → Style edit");
  const instruction = buildEditInstruction(
    rawPrompt,
    stylePrompt,
    input.renderStyle,
    input.transformIntensity,
    input.preserveOutfit ?? false,
  );
  console.log(`[Pipeline] Instruction: "${instruction.slice(0, 150)}…"`);

  const aspectRatio = ASPECT_RATIOS[input.outputFormat ?? "auto"] ?? "match_input_image";
  const q = QUALITY_SETTINGS[input.qualityTier ?? "essentiel"];

  let result = await withRetry(() =>
    runFluxKontext(imageUrl, instruction, aspectRatio, q.quality, q.format)
  );

  if (q.upscale) {
    console.log("[Pipeline] → Upscaling (Ultra tier)…");
    result = await runUpscale(result);
  }

  return result;
}

// ─── COMPOSITION PIPELINE ────────────────────────────────────────────────────

async function runCompositionPipeline(
  userImageUrl: string,
  rawPrompt: string,
  input: PipelineInput,
): Promise<string> {
  const personName = extractPersonName(rawPrompt);
  console.log(`[Pipeline] Celebrity: "${personName ?? "none"}"`);

  if (personName) {
    const refBase64 = await fetchWikipediaImageAsBase64(personName);
    if (refBase64) {
      console.log("[Pipeline] Wikipedia photo found — face-swapping user into it…");
      return withRetry(() => runFaceSwap(userImageUrl, refBase64));
    }
    console.log("[Pipeline] Wikipedia photo not found — falling back to style edit");
  }

  // Fallback: style edit keeping the person
  const instruction = buildEditInstruction(rawPrompt, "", input.renderStyle, input.transformIntensity, false);
  const aspectRatio = ASPECT_RATIOS[input.outputFormat ?? "auto"] ?? "match_input_image";
  const q = QUALITY_SETTINGS[input.qualityTier ?? "essentiel"];
  return withRetry(() => runFluxKontext(userImageUrl, instruction, aspectRatio, q.quality, q.format));
}

// ─── SWAPFACE PIPELINE ────────────────────────────────────────────────────────

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  console.log("[Pipeline] FaceSwap…");
  const result = await withRetry(() =>
    runFaceSwap(input.sourceImageUrl!, input.targetImageUrl!)
  );

  // Upscale swap result for Ultra tier too
  const q = QUALITY_SETTINGS[input.qualityTier ?? "essentiel"];
  if (q.upscale) {
    console.log("[Pipeline] → Upscaling swap result (Ultra tier)…");
    return runUpscale(result);
  }
  return result;
}

// ─── INTENT DETECTION ─────────────────────────────────────────────────────────

function isCompositionRequest(prompt: string): boolean {
  const p = prompt.toLowerCase();

  const clearTriggers = [
    "à côté de moi", "next to me", "beside me",
    "avec moi",      "with me",
    "à ma gauche",   "à ma droite",
    "on my left",    "on my right",
    "devant moi",    "derrière moi",
    "in front of me","behind me",
  ];
  if (clearTriggers.some((kw) => p.includes(kw))) return true;
  if (/\b(?:mets?|met)\s+moi\s+[A-Z]/u.test(prompt)) return true;
  if (/\b(?:avec|with)\s+[A-Z]/u.test(prompt)) return true;

  const actionVerbs = ["ajoute", "rajoute", "add", "mets ", "place", "met "];
  const personNouns = [
    "personne", "quelqu'un", "someone",
    "celebrity", "célébrité",
    "homme", "femme", "man", "woman", "person",
  ];
  return actionVerbs.some((v) => p.includes(v)) && personNouns.some((n) => p.includes(n));
}

function extractPersonName(prompt: string): string | null {
  const STOP =
    "(?:à côté|next to|beside|avec moi|with me|à ma|on my|" +
    "devant|derrière|in front|behind|de moi|of me|" +
    "entrain|en train|qui |looking|regardant|faisant|doing|watching|portant|souriant|smiling)";

  const patterns = [
    new RegExp(`\\b(?:mets?|met)\\s+moi\\s+(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    new RegExp(`(?:rajoute|ajoute|add|place)\\s+(?:moi\\s+(?:avec|with)\\s+)?(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    new RegExp(`(?:mets|met)\\s+(?:moi\\s+)?(?:avec|with)\\s+(.+?)(?:\\s+${STOP}.*)?$`, "iu"),
    new RegExp(`(?:avec|with)\\s+([A-Z].+?)(?:\\s+${STOP}.*)?$`, "u"),
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    if (match) {
      const candidate = match[1].trim();
      if (/^(une?|un|a|an)\s+/i.test(candidate)) continue;
      if (/^(le|la|les|du|des|un|une)\s+/i.test(candidate)) continue;
      if (candidate.length > 1 && candidate.length < 60) return candidate;
    }
  }
  return null;
}

// ─── INSTRUCTION BUILDER ──────────────────────────────────────────────────────
//
// Produces a precise FLUX Kontext editing directive.
// Structure: [intensity prefix] [what to change]. [render quality]. Preserve: [what to keep].

function buildEditInstruction(
  customPrompt: string,
  stylePrompt: string,
  renderStyle?: string,
  intensity?: string,
  preserveOutfit = false,
): string {
  const translated = translateToEnglish(customPrompt.trim());
  const style = stylePrompt.trim();

  // What to change
  let changeDesc: string;
  if (translated && style) {
    changeDesc = `Apply this visual style — ${style}. Additional adjustment: ${translated}`;
  } else if (style) {
    changeDesc = `Apply this visual style — ${style}`;
  } else if (translated) {
    changeDesc = translated;
  } else {
    changeDesc = "Enhance the photo quality, lighting, and professional aesthetic";
  }

  // Render quality modifier
  const renderDesc = (renderStyle && RENDER_STYLE_PROMPTS[renderStyle])
    ? `Render quality: ${RENDER_STYLE_PROMPTS[renderStyle]}.`
    : "";

  // Intensity prefix
  const prefix = (intensity && INTENSITY_PREFIX[intensity])
    ? `${INTENSITY_PREFIX[intensity]} transform: `
    : "";

  // What to preserve
  const preserveList = [
    "the person's face, eyes, nose, mouth, and all facial features",
    "their exact skin tone and complexion",
    "their hair color, texture, and style",
    "their body shape and proportions",
  ];
  if (preserveOutfit) {
    preserveList.push("their current clothing and outfit (do not change clothes)");
  }

  const preserveStr = preserveList.join("; ");

  return [
    `${prefix}${changeDesc}.`,
    renderDesc,
    `Preserve exactly: ${preserveStr}.`,
    "Do NOT alter the person's identity, duplicate them, or add any new people.",
    "The result must look photorealistic and professionally photographed.",
  ].filter(Boolean).join(" ");
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

// ─── WIKIPEDIA ────────────────────────────────────────────────────────────────

async function fetchWikipediaImageAsBase64(personName: string): Promise<string | null> {
  const variants = buildNameVariants(personName);

  for (const variant of variants) {
    const slug = encodeURIComponent(variant.trim().replace(/\s+/g, "_"));
    for (const lang of ["en", "fr", "es"]) {
      try {
        const apiRes = await fetch(
          `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`,
          { headers: { "User-Agent": "IACelebriteApp/1.0 (contact: gnemmialex@gmail.com)" } }
        );
        if (!apiRes.ok) continue;
        const data = (await apiRes.json()) as {
          thumbnail?: { source: string };
          originalimage?: { source: string };
          type?: string;
        };
        if (data.type === "disambiguation") continue;
        const imageUrl = data.originalimage?.source ?? data.thumbnail?.source ?? null;
        if (!imageUrl) continue;

        const base64 = await downloadImageAsBase64(imageUrl);
        if (base64) {
          console.log(`[Pipeline] Wikipedia image: "${variant}" (${lang}) ✓`);
          return base64;
        }
      } catch {
        // try next
      }
    }
  }
  return null;
}

function buildNameVariants(name: string): string[] {
  const variants = new Set<string>([name]);
  variants.add(name.replace(/e\b/, ""));
  variants.add(name.replace(/i\b/, "ie"));
  variants.add(name.replace(/'/g, ""));
  variants.add(name.replace(/'/g, " "));
  return [...variants].filter((v) => v.length > 1);
}

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

// ─── IMAGE LOADER ─────────────────────────────────────────────────────────────
//
// Replicate must be able to fetch the input image.
// Supabase private buckets return 403, so we always convert to base64 first.
// This guarantees the model receives the actual pixels regardless of bucket policy.

async function loadImageAsBase64(urlOrData: string): Promise<string> {
  if (urlOrData.startsWith("data:")) return urlOrData; // Already base64
  const b64 = await downloadImageAsBase64(urlOrData);
  if (!b64) throw new Error(`Impossible de charger l'image depuis : ${urlOrData.slice(0, 80)}`);
  console.log(`[Pipeline] Image loaded as base64 (${Math.round(b64.length / 1024)}KB)`);
  return b64;
}

// ─── MODEL RUNNERS ────────────────────────────────────────────────────────────

async function runFluxKontext(
  image: string,
  prompt: string,
  aspectRatio: string,
  quality: number,
  format: "jpg" | "png" | "webp",
): Promise<string> {
  // Always convert to base64 — Replicate cannot access private Supabase URLs
  const imageData = await loadImageAsBase64(image);

  console.log(`[Pipeline] FLUX Kontext Max — aspect: ${aspectRatio}, quality: ${quality}, format: ${format}`);
  console.log(`[Pipeline] Prompt: "${prompt.slice(0, 200)}"`);

  const output = await replicate.run(MODELS.fluxKontextMax, {
    input: {
      image:             imageData,
      prompt,
      aspect_ratio:      aspectRatio,
      output_format:     format,
      output_quality:    quality,
      safety_tolerance:  6,
      prompt_upsampling: false,
    },
  });
  const url = extractUrl(output);
  console.log(`[Pipeline] FLUX output: ${url.slice(0, 80)}`);
  return url;
}

async function runFaceSwap(sourceImageUrl: string, targetImageUrl: string): Promise<string> {
  // Convert both images to base64 for reliability
  const [swapData, inputData] = await Promise.all([
    loadImageAsBase64(sourceImageUrl),
    loadImageAsBase64(targetImageUrl),
  ]);

  console.log("[Pipeline] Face swap — source and target loaded");
  const output = await replicate.run(
    MODELS.faceSwap as `${string}/${string}:${string}`,
    {
      input: {
        swap_image:  swapData,   // user's face
        input_image: inputData,  // celebrity's photo
      },
    }
  );
  const url = extractUrl(output);
  console.log(`[Pipeline] FaceSwap output: ${url.slice(0, 80)}`);
  return url;
}

async function runUpscale(imageUrl: string): Promise<string> {
  try {
    const output = await replicate.run(
      MODELS.realEsrgan as `${string}/${string}:${string}`,
      {
        input: {
          image:        imageUrl,
          scale:        4,
          face_enhance: true,
        },
      }
    );
    const upscaled = extractUrl(output);
    console.log("[Pipeline] Upscale done ✓");
    return upscaled;
  } catch (err) {
    // Upscaling is bonus — never break the pipeline for it
    console.warn("[Pipeline] Upscale failed (graceful fallback):", err instanceof Error ? err.message : err);
    return imageUrl;
  }
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object" && "url" in output)
    return String((output as { url: string }).url);
  throw new Error("Aucune URL retournée par le modèle IA");
}
