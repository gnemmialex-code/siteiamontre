import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const STRIPE_PLANS: Record<string, { credits: number | null; monthly: string; yearly: string; name: string }> = {
  plan_essentiel: {
    credits: 2500,
    monthly: process.env.STRIPE_PRICE_ESSENTIEL_MONTHLY!,
    yearly:  process.env.STRIPE_PRICE_ESSENTIEL_YEARLY!,
    name: "CelebSwap Essentiel",
  },
  plan_pro: {
    credits: 10250,
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly:  process.env.STRIPE_PRICE_PRO_YEARLY!,
    name: "CelebSwap Pro",
  },
  plan_ultra: {
    credits: null,
    monthly: process.env.STRIPE_PRICE_ULTRA_MONTHLY!,
    yearly:  process.env.STRIPE_PRICE_ULTRA_YEARLY!,
    name: "CelebSwap Ultra",
  },
};
