import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ credits: 0, authenticated: false });
  }

  // Use admin client to bypass RLS and always get plan_id reliably
  const admin = createSupabaseAdmin();
  const { data: userData, error } = await admin
    .from("users")
    .select("credits, created_at, plan_id")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    return NextResponse.json({ credits: 0, authenticated: true });
  }

  const planId: string = userData.plan_id ?? "plan_essentiel";

  const [
    { count: totalCount },
    { count: swapCount },
    { count: videoCount },
  ] = await Promise.all([
    admin.from("generations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("generations").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("style", "SwapFace"),
    admin.from("generations").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("style", "Vidéo IA"),
  ]);

  const total = totalCount ?? 0;
  const swap  = swapCount  ?? 0;
  const video = videoCount ?? 0;

  return NextResponse.json({
    credits:              userData.credits,
    plan:                 planId,
    authenticated:        true,
    total_generations:    total,
    image_generations:    total - swap - video,
    swapface_generations: swap,
    video_generations:    video,
    member_since:         userData.created_at,
  });
}
