import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ credits: 0, authenticated: false });
  }

  // Base query — always works even without plan_id column
  const { data: userData, error } = await supabase
    .from("users")
    .select("credits, created_at")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    return NextResponse.json({ credits: 0, authenticated: true });
  }

  // Attempt to read plan_id (graceful — column may not exist yet in DB)
  let planId: string = "plan_essentiel";
  try {
    const { data: planData } = await supabase
      .from("users")
      .select("plan_id")
      .eq("id", user.id)
      .single();
    if (planData?.plan_id) planId = planData.plan_id;
  } catch {
    // plan_id column not yet in DB — use default
  }

  const [
    { count: totalCount },
    { count: swapCount },
    { count: videoCount },
  ] = await Promise.all([
    supabase.from("generations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("generations").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("style", "SwapFace"),
    supabase.from("generations").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("style", "Vidéo IA"),
  ]);

  const total = totalCount ?? 0;
  const swap  = swapCount  ?? 0;
  const video = videoCount ?? 0;

  return NextResponse.json({
    credits:            userData.credits,
    plan:               planId,
    authenticated:      true,
    total_generations:  total,
    image_generations:  total - swap - video,
    swapface_generations: swap,
    video_generations:  video,
    member_since:       userData.created_at,
  });
}
