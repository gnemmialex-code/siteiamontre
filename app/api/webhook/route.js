import Stripe from 'stripe';
import { headers } from 'next/headers';

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature invalide :", err.message);
    return new Response("Signature error", { status: 400 });
  }

  console.log("🎉 Webhook reçu :", event.type);

  // Toujours renvoyer 200 pour éviter les retries
  return new Response("OK", { status: 200 });
}