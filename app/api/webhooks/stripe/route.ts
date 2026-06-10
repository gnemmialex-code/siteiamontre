import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Use service role for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur webhook";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // ── Achat unique Snap Rouge → débloque l'accès à vie ──
    if (session.metadata?.product === "snap_rouge") {
      const snapUserId = session.metadata?.user_id;
      if (!snapUserId) {
        console.error("Missing user_id in snap_rouge session:", session.id);
        return NextResponse.json({ error: "Metadata manquante" }, { status: 400 });
      }

      const { error: snapError } = await supabaseAdmin
        .from("users")
        .update({ snap_rouge_access: true, updated_at: new Date().toISOString() })
        .eq("id", snapUserId);

      if (snapError) {
        console.error("Error unlocking Snap Rouge:", snapError);
        return NextResponse.json({ error: "Erreur de déblocage Snap Rouge" }, { status: 500 });
      }

      await supabaseAdmin.from("credit_transactions").insert({
        user_id:           snapUserId,
        amount:            0,
        type:              "purchase",
        pack_id:           "snap_rouge",
        stripe_session_id: session.id,
      });

      console.log(`✅ Snap Rouge unlocked for user ${snapUserId}`);
      return NextResponse.json({ received: true });
    }

    const userId  = session.metadata?.user_id;
    const credits = parseInt(session.metadata?.credits ?? "0", 10);
    const packId  = session.metadata?.pack_id;
    const planId  = session.metadata?.plan_id ?? packId ?? null;

    if (!userId || !credits) {
      console.error("Missing metadata in checkout session:", session.id);
      return NextResponse.json({ error: "Metadata manquante" }, { status: 400 });
    }

    // Add credits (atomic increment)
    const { error: rpcError } = await supabaseAdmin.rpc("add_credits", {
      user_id: userId,
      amount:  credits,
    });

    if (rpcError) {
      console.error("Error adding credits:", rpcError);
      return NextResponse.json({ error: "Erreur d'ajout de crédits" }, { status: 500 });
    }

    // Save plan_id to users table (graceful — column may not exist yet)
    if (planId) {
      try {
        await supabaseAdmin
          .from("users")
          .update({ plan_id: planId, updated_at: new Date().toISOString() })
          .eq("id", userId);
      } catch (planErr) {
        // Column may not exist yet — non-blocking
        console.warn("Could not save plan_id (run migration):", planErr);
      }
    }

    // Log the transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id:          userId,
      amount:           credits,
      type:             "purchase",
      pack_id:          packId,
      stripe_session_id: session.id,
    });

    console.log(`✅ Added ${credits} credits to user ${userId} (plan: ${planId ?? "n/a"})`);
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    console.error("❌ Payment failed:", intent.id);
  }

  return NextResponse.json({ received: true });
}
