import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  buildAsyncJobConfig,
  startAsyncJob,
  type AsyncJobConfig,
  type PipelineInput,
} from "@/scripts/pipeline";
import { validateImageFile } from "@/lib/validation";
import { uploadToStorage } from "@/lib/storage";

export const maxDuration = 60;

const MAX_FILE_SIZE    = 15 * 1024 * 1024;
const CREDITS_PER_IMAGE = 100;
const BUCKET           = "celebswap-images";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function planToTier(planId?: string | null): "free" | "essentiel" | "pro" | "ultra" {
  if (!planId) return "essentiel";
  if (planId.includes("ultra")) return "ultra";
  if (planId.includes("pro"))   return "pro";
  return "essentiel";
}

async function uploadFile(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  file: File,
  userId: string,
): Promise<{ url: string; b64: string }> {
  const validation = validateImageFile(file, MAX_FILE_SIZE);
  if (!validation.valid) throw new Error(validation.error);

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext    = file.name.split(".").pop() ?? "jpg";
  const path   = `inputs/${userId}/${generateId()}.${ext}`;
  const url    = await uploadToStorage(supabase, buffer, path, file.type);
  const b64    = `data:${file.type};base64,${buffer.toString("base64")}`;
  return { url, b64 };
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Guest check
  if (!userId) {
    const freeUsed = req.cookies.get("free_gen_used")?.value;
    if (freeUsed === "1") {
      return NextResponse.json({ error: "Créez un compte pour continuer à générer" }, { status: 402 });
    }
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const mode = (formData.get("mode") as string) ?? "style";

  // ── Vérification des crédits + lecture du plan ─────────────────────────────
  let qualityTier: "free" | "essentiel" | "pro" | "ultra" = "free";

  if (userId) {
    const { data: creditData } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (!creditData || creditData.credits < CREDITS_PER_IMAGE) {
      return NextResponse.json({ error: "Crédits insuffisants" }, { status: 402 });
    }

    try {
      const { data: planData } = await supabase
        .from("users")
        .select("plan_id")
        .eq("id", userId)
        .single();
      qualityTier = planToTier(planData?.plan_id as string | null | undefined);
    } catch {
      qualityTier = "essentiel";
    }
  }

  const effectiveUserId = userId ?? "anon";

  // ── Options de génération ──────────────────────────────────────────────────
  const renderStyle        = (formData.get("render_style")    as string | null) ?? undefined;
  const transformIntensity = (formData.get("intensity")       as string | null) ?? "moderate";
  const outputFormat       = (formData.get("output_format")   as string | null) ?? "auto";
  const preserveOutfit     = (formData.get("preserve_outfit") as string | null) === "1";

  try {
    const generationId = generateId();
    let styleLabel: string;
    let inputImageForRecord = "";
    let predictionId: string;
    let jobConfig: AsyncJobConfig;

    if (mode === "swapface") {
      // ── SWAPFACE ──────────────────────────────────────────────────────────
      const sourceFile = formData.get("source_image") as File | null;
      const targetFile = formData.get("target_image") as File | null;
      if (!sourceFile || !targetFile) {
        return NextResponse.json({ error: "Images source et cible requises" }, { status: 400 });
      }
      const [src, tgt] = await Promise.all([
        uploadFile(supabase, sourceFile, effectiveUserId),
        uploadFile(supabase, targetFile, effectiveUserId),
      ]);
      inputImageForRecord = src.url;
      styleLabel          = "SwapFace";

      jobConfig    = buildAsyncJobConfig({ mode: "swapface", qualityTier } as PipelineInput, src.b64);
      predictionId = await startAsyncJob(jobConfig, tgt.b64);

    } else if (mode === "style") {
      // ── STYLE IA ──────────────────────────────────────────────────────────
      const imageFile      = formData.get("image")        as File | null;
      const styleId        = formData.get("style_id")     as string | null;
      const rawStylePrompt = formData.get("style_prompt") as string | null;
      const customPrompt   = (formData.get("custom_prompt") as string) ?? "";
      styleLabel           = (formData.get("style_label") as string) ?? "Génération IA";

      if (!imageFile) {
        return NextResponse.json({ error: "Photo requise" }, { status: 400 });
      }
      if (!rawStylePrompt && !customPrompt.trim()) {
        return NextResponse.json({ error: "Veuillez choisir un style ou entrer une description" }, { status: 400 });
      }

      const stylePrompt = rawStylePrompt
        || "photorealistic portrait, ultra HD, professional photography, perfect lighting";

      const { url: inputImageUrl, b64: sourceB64 } = await uploadFile(supabase, imageFile, effectiveUserId);
      inputImageForRecord = inputImageUrl;

      const pipelineInput: PipelineInput = {
        mode:              "style",
        inputImageUrl,
        styleId:           styleId ?? "custom",
        stylePrompt,
        customPrompt,
        qualityTier,
        renderStyle,
        transformIntensity,
        outputFormat,
        preserveOutfit,
      };

      jobConfig    = buildAsyncJobConfig(pipelineInput, sourceB64);
      predictionId = await startAsyncJob(jobConfig);

    } else {
      return NextResponse.json({ error: "Ce mode n'est pas encore disponible" }, { status: 400 });
    }

    // ── Déduire les crédits + sauvegarder le job ────────────────────────────
    if (userId) {
      await supabase.rpc("decrement_credits", { user_id: userId, amount: CREDITS_PER_IMAGE });

      const { error: insertError } = await supabase.from("generations").insert({
        id:               generationId,
        user_id:          userId,
        input_image_url:  inputImageForRecord,
        output_image_url: "",
        style:            styleLabel,
        status:           "pending",
        prediction_id:    predictionId,
        step:             1,
        job_config:       jobConfig,
      });

      if (insertError) {
        console.error("[Generate] DB insert error:", insertError.message);
        throw new Error(`Erreur DB : ${insertError.message}`);
      }

      // Auto-delete oldest done generations beyond 20 per user
      const { data: doneGens } = await supabase
        .from("generations")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "done")
        .order("created_at", { ascending: false });

      if (doneGens && doneGens.length > 20) {
        const toDelete = doneGens.slice(20).map((g: { id: string }) => g.id);
        await supabase.from("generations").delete().in("id", toDelete).eq("user_id", userId);
      }
    }

    const response = NextResponse.json({ job_id: generationId, prediction_id: predictionId });

    if (!userId) {
      response.cookies.set("free_gen_used", "1", {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return response;

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur pipeline IA";
    console.error("[Generate] Error:", msg);

    if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("throttled")) {
      return NextResponse.json(
        { error: "Limite d'API Replicate atteinte — réessayez dans 30 secondes" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const { data: generation, error } = await supabase
    .from("generations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !generation) {
    return NextResponse.json({ error: "Génération introuvable" }, { status: 404 });
  }

  return NextResponse.json(generation);
}
