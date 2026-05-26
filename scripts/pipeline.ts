import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODELS = {
  // Official BFL — no version hash, never breaks
  fluxKontextMax: "black-forest-labs/flux-kontext-max",
  // Community — verified hash May 2026
  faceSwap: "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
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
  console.log(`[Pipeline] Mode: ${input.mode}`);
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
  const imageUrl = input.inputImageUrl!;
  const rawPrompt = input.customPrompt?.trim() || "";
  const stylePrompt = input.stylePrompt?.trim() || "";

  if (isCompositionRequest(rawPrompt)) {
    console.log("[Pipeline] → Composition detected");
    return runCompositionPipeline(imageUrl, rawPrompt);
  }

  console.log("[Pipeline] → Style edit");
  const instruction = buildEditInstruction(rawPrompt, stylePrompt);
  console.log(`[Pipeline] Instruction: "${instruction.slice(0, 120)}…"`);
  return withRetry(() => runFluxKontext(imageUrl, instruction, "match_input_image"));
}

// ─── COMPOSITION PIPELINE ─────────────────────────────────────────────────────
//
// The user wants their photo + a celebrity.
// Approach: take the celebrity's real Wikipedia photo, swap the user's face in.
// The user's face appears in the celebrity's world / scene.
// This is reliable — no generative hallucination, both faces are real.

async function runCompositionPipeline(
  userImageUrl: string,
  rawPrompt: string
): Promise<string> {
  const personName = extractPersonName(rawPrompt);
  console.log(`[Pipeline] Celebrity: "${personName ?? "none"}"`);

  if (personName) {
    const refBase64 = await fetchWikipediaImageAsBase64(personName);
    if (refBase64) {
      console.log("[Pipeline] Wikipedia photo found — face-swapping user into it…");
      // source = user's face, target = celebrity's real photo
      return withRetry(() => runFaceSwap(userImageUrl, refBase64));
    }
    console.log("[Pipeline] Wikipedia photo not found — falling back to style edit");
  }

  // Fallback: no celebrity identified → style edit keeping the person
  const instruction = buildEditInstruction(rawPrompt, "");
  return withRetry(() => runFluxKontext(userImageUrl, instruction, "match_input_image"));
}

// ─── SWAPFACE PIPELINE ────────────────────────────────────────────────────────

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  console.log("[Pipeline] FaceSwap…");
  return withRetry(() => runFaceSwap(input.sourceImageUrl!, input.targetImageUrl!));
}

// ─── INTENT DETECTION ─────────────────────────────────────────────────────────

function isCompositionRequest(prompt: string): boolean {
  const p = prompt.toLowerCase();

  // Unambiguous: clearly means "put someone beside me"
  const clearTriggers = [
    "à côté de moi", "next to me", "beside me",
    "avec moi",      "with me",
    "à ma gauche",   "à ma droite",
    "on my left",    "on my right",
    "devant moi",    "derrière moi",
    "in front of me","behind me",
  ];
  if (clearTriggers.some((kw) => p.includes(kw))) return true;

  // "met(s)/mets moi [CapitalLetter]" → "met moi Ronaldo"
  if (/\b(?:mets?|met)\s+moi\s+[A-Z]/u.test(prompt)) return true;

  // "avec/with [CapitalLetter]" → "avec Beyoncé" but NOT "avec un fond"
  if (/\b(?:avec|with)\s+[A-Z]/u.test(prompt)) return true;

  // Action verb + explicit person noun
  const actionVerbs = ["ajoute", "rajoute", "add", "mets ", "place", "met "];
  const personNouns = [
    "personne", "quelqu'un", "someone",
    "celebrity", "célébrité",
    "homme", "femme", "man", "woman", "person",
  ];
  return actionVerbs.some((v) => p.includes(v)) && personNouns.some((n) => p.includes(n));
}

// Extract celebrity name from a composition prompt.
// "Met moi Charlie D'Amelio à côté de moi"  → "Charlie D'Amelio"
// "rajoute Ronaldo à côté de moi"            → "Ronaldo"
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
// Converts the user's prompt (possibly French) into a clear English
// FLUX Kontext instruction. The rule: the person is SACRED — only the
// scene / style / background changes unless explicitly asked otherwise.

function buildEditInstruction(customPrompt: string, stylePrompt: string): string {
  const translated = translateToEnglish(customPrompt.trim());
  const style = stylePrompt.trim();

  const change = translated && style
    ? `${translated}. Overall style: ${style}`
    : translated || style || "enhance the photo quality and lighting";

  return (
    `You are editing a photo. The PERSON in this photo is the subject — ` +
    `keep their face, skin tone, hair, body shape, and identity EXACTLY as they are. ` +
    `Do NOT add, duplicate, or replace any person. ` +
    `Apply this transformation: ${change}. ` +
    `Result must look photorealistic and professional.`
  );
}

// French → English translation for common photo-editing terms.
// Covers the most frequent requests for a celebrity AI photo app.
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
    [/fond\s+blanc/gi, "clean white background"],
    [/fond\s+noir/gi, "pure black background"],
    [/fond\s+flou|fond\s+bokeh/gi, "blurred bokeh background"],
    [/fond\s+studio/gi, "professional studio background"],
    [/fond\s+(?:de\s+)?bureau/gi, "office background"],
    [/fond\s+(?:de\s+)?luxe|fond\s+(?:de\s+)?villa/gi, "luxury villa background"],
    [/(?:change|remplace)\s+(?:le\s+)?fond/gi, "replace the background"],
    [/\bfond\b/gi, "background"],

    // ── Scene / location ──────────────────────────────────────────────────────
    [/à\s+la\s+plage/gi, "at the beach"],
    [/à\s+paris/gi, "in Paris"],
    [/à\s+new\s*york/gi, "in New York"],
    [/dans\s+une?\s+villa/gi, "in a luxury villa"],
    [/dans\s+une?\s+forêt/gi, "in a forest"],
    [/au\s+bureau/gi, "in an office setting"],
    [/en\s+plein\s+air/gi, "outdoors"],

    // ── Colour / tone ─────────────────────────────────────────────────────────
    [/noir\s+et\s+blanc|n&b|nbw/gi, "black and white"],
    [/sépia/gi, "sepia tone"],
    [/coloré/gi, "vibrant colors"],
    [/couleurs\s+vives/gi, "vivid colors"],
    [/ton\s+chaud|tons?\s+chauds?/gi, "warm color tones"],
    [/ton\s+froid|tons?\s+froids?/gi, "cool color tones"],
    [/contraste\s+(?:élevé|fort|haut)/gi, "high contrast"],
    [/saturé/gi, "saturated colors"],

    // ── Style / aesthetic ─────────────────────────────────────────────────────
    [/style\s+(?:artistique|art)/gi, "artistic style"],
    [/style\s+vintage|effet\s+vintage/gi, "vintage retro style"],
    [/style\s+cinématographique|look\s+cinéma/gi, "cinematic style"],
    [/style\s+(?:magazine|fashion)/gi, "magazine fashion style"],
    [/style\s+(?:luxe|luxueux)/gi, "luxury high-end style"],
    [/dessin\s+animé|cartoon/gi, "cartoon style"],
    [/peinture\s+(?:à\s+l'huile|huile)/gi, "oil painting style"],
    [/aquarelle/gi, "watercolor painting style"],
    [/anime|manga/gi, "anime style"],
    [/effet\s+3d/gi, "3D rendering style"],
    [/réaliste|réalisme/gi, "photorealistic"],
    [/professionnel/gi, "professional"],

    // ── Lighting ──────────────────────────────────────────────────────────────
    [/lumière\s+(?:dorée|chaude)/gi, "golden warm light"],
    [/lumière\s+naturelle/gi, "natural daylight"],
    [/lumière\s+(?:de\s+)?studio/gi, "studio lighting"],
    [/éclairage\s+(?:dramatique|fort)/gi, "dramatic lighting"],
    [/coucher\s+de\s+soleil/gi, "sunset lighting"],
    [/lever\s+de\s+soleil/gi, "sunrise lighting"],

    // ── Clothing ──────────────────────────────────────────────────────────────
    [/tenue\s+de\s+soirée|costume\s+de\s+soirée/gi, "formal evening attire"],
    [/tenue\s+(?:décontractée|casual)/gi, "casual outfit"],
    [/tenue\s+sportive|look\s+sportif/gi, "sporty athletic outfit"],
    [/costume\s+(?:de\s+)?superhéros/gi, "superhero costume"],
    [/tenue\s+militaire/gi, "military uniform"],
    [/tenue\s+royale|robe\s+royale/gi, "royal elegant outfit"],
    [/smoking/gi, "tuxedo"],
    [/en\s+costume/gi, "wearing a suit"],

    // ── Hair / appearance ─────────────────────────────────────────────────────
    [/cheveux\s+blonds/gi, "blonde hair"],
    [/cheveux\s+bruns/gi, "brown hair"],
    [/cheveux\s+noirs/gi, "black hair"],
    [/cheveux\s+rouges/gi, "red hair"],
    [/cheveux\s+bouclés/gi, "curly hair"],
    [/cheveux\s+raides/gi, "straight hair"],
    [/barbe/gi, "beard"],
    [/rasé/gi, "clean-shaven"],
    [/maquillage\s+(?:fort|prononcé)/gi, "bold makeup"],
    [/maquillage\s+naturel/gi, "natural makeup"],
    [/sans\s+maquillage/gi, "no makeup"],

    // ── Quality ───────────────────────────────────────────────────────────────
    [/haute\s+qualité|hd|4k|8k/gi, "ultra high quality 4K"],
    [/améliore?\s+(?:la\s+)?qualité/gi, "improve image quality"],
    [/nettoie?\s+(?:la\s+)?photo/gi, "clean up the photo"],

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
  ];

  let result = text;
  for (const [pattern, replacement] of rules) {
    result = result.replace(pattern, replacement);
  }

  // Clean up extra spaces
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
  variants.add(name.replace(/e\b/, ""));          // Charlie → Charli
  variants.add(name.replace(/i\b/, "ie"));         // Charli → Charlie
  variants.add(name.replace(/'/g, ""));            // D'Amelio → DAmelio
  variants.add(name.replace(/'/g, " "));           // D'Amelio → D Amelio
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

// ─── MODEL RUNNERS ────────────────────────────────────────────────────────────

async function runFluxKontext(image: string, prompt: string, aspectRatio: string): Promise<string> {
  const output = await replicate.run(MODELS.fluxKontextMax, {
    input: {
      image,
      prompt,
      aspect_ratio: aspectRatio,
      output_format: "jpg",
      output_quality: 100,
      safety_tolerance: 6,
      prompt_upsampling: false,
    },
  });
  return extractUrl(output);
}

async function runFaceSwap(sourceImageUrl: string, targetImageUrl: string): Promise<string> {
  const output = await replicate.run(
    MODELS.faceSwap as `${string}/${string}:${string}`,
    {
      input: {
        swap_image:  sourceImageUrl,  // face to use (user's photo)
        input_image: targetImageUrl,  // scene to place it into (celebrity's photo)
      },
    }
  );
  return extractUrl(output);
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  if (output && typeof output === "object" && "url" in output)
    return String((output as { url: string }).url);
  throw new Error("Aucune URL retournée par le modèle IA");
}
