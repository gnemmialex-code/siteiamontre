import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ credits: 0, authenticated: false });
  }

  const { data: userData, error } = await supabase
    .from("users")
    .select("credits, created_at")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    return NextResponse.json({ credits: 0, authenticated: true });
  }

  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({
    credits: userData.credits,
    authenticated: true,
    total_generations: count ?? 0,
    member_since: userData.created_at,
  });
}
