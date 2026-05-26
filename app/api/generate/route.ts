import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { runPipeline } from "@/scripts/pipeline";
import { validateImageFile } from "@/lib/validation";
import { uploadToStorage } from "@/lib/storage";

export const maxDuration = 300;

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const CREDITS_PER_IMAGE = 100;

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function uploadFile(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, file: File, userId: string): Promise<string> {
  const validation = validateImageFile(file, MAX_FILE_SIZE);
  if (!validation.valid) throw new Error(validation.error);

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `inputs/${userId}/${generateId()}.${ext}`;
  return uploadToStorage(supabase, buffer, path, file.type);
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

  // ── Vérification des crédits ─────────────────────────────────────────────
  if (userId) {
    const { data: userData } = await supabase.from("users").select("credits").eq("id", userId).single();
    if (!userData || userData.credits < CREDITS_PER_IMAGE) {
      return NextResponse.json({ error: "Crédits insuffisants" }, { status: 402 });
    }
  }

  const effectiveUserId = userId ?? "anon";

  try {
    let outputUrl: string;
    let styleLabel: string;
    let inputImageForRecord = "";

    if (mode === "swapface") {
      // ── MODE SWAPFACE ──────────────────────────────────────────────────────
      const sourceFile = formData.get("source_image") as File | null;
      const targetFile = formData.get("target_image") as File | null;
      const faceIndex = (formData.get("face_index") as string) ?? "auto";
      const extraPrompt = (formData.get("extra_prompt") as string) ?? "";

      if (!sourceFile || !targetFile) {
        return NextResponse.json({ error: "Images source et cible requises" }, { status: 400 });
      }

      const [sourceUrl, targetUrl] = await Promise.all([
        uploadFile(supabase, sourceFile, effectiveUserId),
        uploadFile(supabase, targetFile, effectiveUserId),
      ]);

      inputImageForRecord = sourceUrl;
      outputUrl = await runPipeline({ mode: "swapface", sourceImageUrl: sourceUrl, targetImageUrl: targetUrl, faceIndex, extraPrompt });
      styleLabel = "SwapFace";

    } else if (mode === "style") {
      // ── MODE STYLE IA (style optionnel, prompt libre suffisant) ───────────
      const imageFile = formData.get("image") as File | null;
      const styleId = formData.get("style_id") as string | null;
      const rawStylePrompt = formData.get("style_prompt") as string | null;
      const customPrompt = (formData.get("custom_prompt") as string) ?? "";
      styleLabel = (formData.get("style_label") as string) ?? "Génération IA";

      if (!imageFile) {
        return NextResponse.json({ error: "Photo requise" }, { status: 400 });
      }
      if (!rawStylePrompt && !customPrompt.trim()) {
        return NextResponse.json({ error: "Veuillez choisir un style ou entrer une description" }, { status: 400 });
      }

      const stylePrompt = rawStylePrompt
        || "photorealistic portrait, ultra HD, professional photography, perfect lighting, stunning quality, 8k";

      const inputImageUrl = await uploadFile(supabase, imageFile, effectiveUserId);
      inputImageForRecord = inputImageUrl;
      outputUrl = await runPipeline({
        mode: "style",
        inputImageUrl,
        styleId: styleId ?? "custom",
        stylePrompt,
        customPrompt,
      });

    } else {
      // ── MODE NON SUPPORTÉ (image, video, etc.) ─────────────────────────────
      return NextResponse.json({ error: "Ce mode n'est pas encore disponible" }, { status: 400 });
    }

    // ── Sauvegarder + déduire les crédits ────────────────────────────────────
    const generationId = generateId();

    if (userId) {
      await supabase.rpc("decrement_credits", { user_id: userId, amount: CREDITS_PER_IMAGE });
      await supabase.from("generations").insert({
        id: generationId,
        user_id: userId,
        input_image_url: inputImageForRecord,
        output_image_url: outputUrl,
        style: styleLabel,
      });
    }

    const response = NextResponse.json({ generation_id: generationId, output_image_url: outputUrl, style: styleLabel });

    if (!userId) {
      response.cookies.set("free_gen_used", "1", { maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" });
    }

    return response;

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur pipeline IA";
    console.error("[Generate] Error:", msg);

    if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("throttled")) {
      return NextResponse.json(
        { error: "Limite d'API Replicate atteinte — ajoutez du crédit sur replicate.com ou réessayez dans 30 secondes" },
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

  const { data: generation, error } = await supabase.from("generations").select("*").eq("id", id).single();
  if (error || !generation) return NextResponse.json({ error: "Génération introuvable" }, { status: 404 });

  return NextResponse.json(generation);
}
