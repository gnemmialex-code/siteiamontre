import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { planId, billing } = body as { planId: string; billing: "monthly" | "yearly" };

  const plan = STRIPE_PLANS[planId];
  if (!plan) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const priceId = billing === "yearly" ? plan.yearly : plan.monthly;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing,
        credits: plan.credits?.toString() ?? "unlimited",
      },
      customer_email: user.email,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur Stripe";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
