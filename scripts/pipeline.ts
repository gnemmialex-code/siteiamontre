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
      const is429 =
        msg.includes("429") ||
        msg.includes("Too Many Requests") ||
        msg.includes("throttled");
      if (is429 && attempt < retries) {
        const match = msg.match(/"retry_after"\s*:\s*(\d+)/);
        const waitMs = match ? (Number(match[1]) + 2) * 1000 : 15000;
        console.log(
          `[Pipeline] Rate limited, waiting ${waitMs / 1000}s… (retry ${attempt + 1}/${retries})`
        );
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
    console.log(`[Pipeline] Done in ${Date.now() - start}ms`);
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

  if (detectCompositionRequest(rawPrompt)) {
    return runCompositionPipeline(imageUrl, rawPrompt, input.stylePrompt ?? "");
  }

  const instruction = buildStyleInstruction(input.stylePrompt ?? "", rawPrompt);
  console.log("[Pipeline] Step 1: FLUX Kontext Max — style edit...");
  const edited = await withRetry(() =>
    runFluxKontext(imageUrl, instruction, "match_input_image")
  );

  console.log("[Pipeline] Step 2: RealESRGAN 4× upscale...");
  return withRetry(() => runRealEsrgan(edited, 4, true));
}

// ─── COMPOSITION PIPELINE (add person next to me) ────────────────────────────
//
// A — expand canvas to the right (makes room for the second person)
// B — add the person in the empty right area
// C — face-swap user's face back onto face 0 (guards against any drift)
// D — face-swap celebrity's face onto face 1 (ensures correct likeness)
// E — 4× upscale

async function runCompositionPipeline(
  userImageUrl: string,
  rawPrompt: string,
  stylePrompt: string
): Promise<string> {
  const personName = extractPersonName(rawPrompt);
  console.log(`[Pipeline] Composition — person: ${personName ?? "unspecified"}`);

  // Fetch reference image for the celebrity (Wikipedia, free, no API key)
  let referenceUrl: string | null = null;
  if (personName) {
    referenceUrl = await fetchWikipediaImage(personName);
    console.log(
      `[Pipeline] Reference image: ${referenceUrl ? "found ✓" : "not found"}`
    );
  }

  // A — expand canvas to landscape so both subjects have room
  console.log("[Pipeline] A: Expand canvas to the right...");
  const expandedUrl = await withRetry(() => stepExpandCanvas(userImageUrl));

  // B — add the person in the empty right area
  console.log("[Pipeline] B: Add person to right side...");
  const composedUrl = await withRetry(() =>
    stepAddPersonToScene(expandedUrl, personName, rawPrompt, stylePrompt)
  );

  // C — restore user's face (face index 0) to ensure identity is intact
  console.log("[Pipeline] C: Restore user's face (face 0)...");
  const userFaceFixed = await withRetry(() =>
    runFaceSwap(userImageUrl, composedUrl, "0")
  ).catch((e) => {
    console.warn("[Pipeline] C skipped:", (e as Error).message);
    return composedUrl;
  });

  // D — put celebrity's face on face index 1 for accurate likeness
  let finalComposed = userFaceFixed;
  if (referenceUrl) {
    console.log("[Pipeline] D: Add celebrity face (face 1)...");
    finalComposed = await withRetry(() =>
      runFaceSwap(referenceUrl!, userFaceFixed, "1")
    ).catch((e) => {
      console.warn("[Pipeline] D skipped:", (e as Error).message);
      return userFaceFixed;
    });
  }

  // E — 4× upscale with face enhancement
  console.log("[Pipeline] E: RealESRGAN 4× upscale...");
  return withRetry(() => runRealEsrgan(finalComposed, 4, true));
}

// ─── SWAPFACE PIPELINE ────────────────────────────────────────────────────────

async function runSwapFacePipeline(input: PipelineInput): Promise<string> {
  const sourceUrl = input.sourceImageUrl!;
  const targetUrl = input.targetImageUrl!;
  const faceIndex = input.faceIndex ?? "0";

  console.log("[Pipeline] Step 1: Face swap...");
  const swapped = await withRetry(() =>
    runFaceSwap(sourceUrl, targetUrl, faceIndex)
  );

  console.log("[Pipeline] Step 2: RealESRGAN 4× upscale...");
  return withRetry(() => runRealEsrgan(swapped, 4, true));
}

// ─── INTENT DETECTION ────────────────────────────────────────────────────────

function detectCompositionRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return [
    "ajoute", "rajoute", "add", "mets", "place", "met ",
    "à côté", "next to", "beside", "with me", "avec moi",
    "à ma gauche", "à ma droite", "on my left", "on my right",
    "devant moi", "derrière moi", "in front of me", "behind me",
    "une personne", "un homme", "une femme", "quelqu'un",
    "a person", "a man", "a woman", "someone",
  ].some((kw) => lower.includes(kw));
}

// Extract the person's name from a composition prompt.
// "rajoute Ronaldo à côté de moi" → "Ronaldo"
function extractPersonName(prompt: string): string | null {
  let cleaned = prompt
    .replace(/^(rajoute|ajoute|add|mets|place|met)\s+/i, "")
    .trim();

  cleaned = cleaned
    .replace(
      /\s+(à côté( de moi)?|next to( me)?|beside( me)?|avec moi|with me|à ma (gauche|droite)|on my (left|right)|devant moi|derrière moi|in front of me|behind me|de moi|of me).*$/i,
      ""
    )
    .trim();

  // Generic nouns are not names
  if (/^(une?|un|a|an)\s+/i.test(cleaned)) return null;

  if (cleaned.length > 1 && cleaned.length < 60) return cleaned;
  return null;
}

// ─── WIKIPEDIA REFERENCE IMAGE (free, no API key) ────────────────────────────

async function fetchWikipediaImage(personName: string): Promise<string | null> {
  const slug = encodeURIComponent(personName.trim().replace(/\s+/g, "_"));
  for (const lang of ["en", "fr"]) {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`,
        {
          headers: {
            "User-Agent": "IACelebriteApp/1.0 (contact: noreply@example.com)",
          },
        }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as {
        thumbnail?: { source: string };
        originalimage?: { source: string };
      };
      const url =
        data.originalimage?.source ?? data.thumbnail?.source ?? null;
      if (url) return url;
    } catch {
      // try next language
    }
  }
  return null;
}

// ─── COMPOSITION STEPS ───────────────────────────────────────────────────────

async function stepExpandCanvas(imageUrl: string): Promise<string> {
  return runFluxKontext(
    imageUrl,
    "Widen this image to a landscape format by extending the scene to the RIGHT side only. " +
      "The person and all existing content on the LEFT must remain PIXEL-PERFECT IDENTICAL — do not alter them in any way. " +
      "Only generate new background/environment on the RIGHT to naturally extend the setting. " +
      "The left side is locked and must not change.",
    "16:9"
  );
}

async function stepAddPersonToScene(
  imageUrl: string,
  personName: string | null,
  originalPrompt: string,
  stylePrompt: string
): Promise<string> {
  const styleNote = stylePrompt.trim() ? ` Style: ${stylePrompt}.` : "";
  const person = personName ?? "the person described";

  const prompt = personName
    ? `The LEFT side of this image shows a person (Person A) — do NOT touch them at all. ` +
      `On the RIGHT side, where there is only empty space or background, add ${person} standing naturally, facing the camera, looking photorealistic. ` +
      `Person A on the left remains pixel-perfect unchanged. ` +
      `Both people should look natural together in the same scene.${styleNote}`
    : `${originalPrompt}. ` +
      `The person on the LEFT is Person A — they must remain completely unchanged. ` +
      `Add the requested person on the RIGHT side where there is empty space. ` +
      `Make it photorealistic and natural.${styleNote}`;

  return runFluxKontext(imageUrl, prompt, "match_input_image");
}

// ─── PROMPT BUILDERS ─────────────────────────────────────────────────────────

function buildStyleInstruction(stylePrompt: string, customPrompt: string): string {
  const base = customPrompt.trim();
  const style = stylePrompt.trim();
  const userRequest =
    base && style ? `${base}. Style: ${style}` : base || style;
  return (
    `Keep the exact same person from the input photo — identical face, skin tone, and body shape. ` +
    `${userRequest}. ` +
    `Preserve all facial features and the person's identity exactly as shown in the input image.`
  );
}

// ─── MODEL RUNNERS ────────────────────────────────────────────────────────────

async function runFluxKontext(
  image: string | string[],
  prompt: string,
  aspectRatio: string
): Promise<string> {
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

async function runFaceSwap(
  sourceImageUrl: string,
  targetImageUrl: string,
  faceIndex: string
): Promise<string> {
  const output = await replicate.run(
    MODELS.faceSwap as `${string}/${string}:${string}`,
    {
      input: {
        source_image: sourceImageUrl,
        target_image: targetImageUrl,
        source_indexes: "0",
        target_indexes: faceIndex === "auto" ? "0" : faceIndex,
        face_restore: "CodeFormer",
        restore_factor: 0.75,
        face_upsample: true,
        upscale: 2,
        max_face_num: 2,
      },
    }
  );
  return extractUrl(output);
}

async function runRealEsrgan(
  imageUrl: string,
  scale: 2 | 4 = 4,
  faceEnhance = true
): Promise<string> {
  const output = await replicate.run(
    MODELS.realEsrgan as `${string}/${string}:${string}`,
    {
      input: { image: imageUrl, scale, face_enhance: faceEnhance },
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
