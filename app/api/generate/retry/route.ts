import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { runPipeline } from "@/scripts/pipeline";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = user.id;
  const body = await req.json();
  const { generation_id } = body;

  if (!generation_id) {
    return NextResponse.json({ error: "ID de génération requis" }, { status: 400 });
  }

  const { data: original, error: genErr } = await supabase
    .from("generations")
    .select("*")
    .eq("id", generation_id)
    .eq("user_id", userId)
    .single();

  if (genErr || !original) {
    return NextResponse.json({ error: "Génération introuvable" }, { status: 404 });
  }

  const { data: userData, error: userErr } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (userErr || !userData || userData.credits <= 0) {
    return NextResponse.json({ error: "Crédits insuffisants" }, { status: 402 });
  }

  let outputImageUrl: string;
  try {
    outputImageUrl = await runPipeline({
      inputImageUrl: original.input_image_url,
      styleId: original.style,
      stylePrompt: "",
      mode: "style",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur pipeline";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const newId = generateId();

  await supabase.rpc("decrement_credits", { user_id: userId });

  await supabase.from("generations").insert({
    id: newId,
    user_id: userId,
    input_image_url: original.input_image_url,
    output_image_url: outputImageUrl,
    style: original.style,
  });

  return NextResponse.json({ generation_id: newId, output_image_url: outputImageUrl });
}
