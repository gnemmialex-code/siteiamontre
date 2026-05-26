import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAIL = "gnemmialex@gmail.com";

async function checkAdmin(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

// GET — liste tous les utilisateurs
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — modifier un utilisateur (crédits, plan, notes, ban)
export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const { userId, action, value } = body as {
    userId: string;
    action: "set_credits" | "add_credits" | "set_plan" | "set_notes" | "toggle_ban";
    value: string | number | boolean;
  };

  const supabase = createSupabaseAdmin();

  if (action === "set_credits") {
    await supabase.from("users").update({ credits: Number(value) }).eq("id", userId);
  } else if (action === "add_credits") {
    const { data } = await supabase.from("users").select("credits").eq("id", userId).single();
    const newCredits = (data?.credits ?? 0) + Number(value);
    await supabase.from("users").update({ credits: newCredits }).eq("id", userId);
  } else if (action === "set_plan") {
    await supabase.from("users").update({
      plan: String(value),
      plan_started_at: new Date().toISOString(),
    }).eq("id", userId);
  } else if (action === "set_notes") {
    await supabase.from("users").update({ notes: String(value) }).eq("id", userId);
  } else if (action === "toggle_ban") {
    await supabase.from("users").update({ is_banned: Boolean(value) }).eq("id", userId);
  }

  return NextResponse.json({ success: true });
}
