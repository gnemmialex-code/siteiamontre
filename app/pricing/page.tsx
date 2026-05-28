"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Loader2, Sparkles, Crown, Infinity } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PLANS = [
  {
    id: "plan_essentiel",
    name: "Essentiel",
    icon: <Zap className="w-5 h-5" />,
    credits: "2 500",
    creditsRaw: 2500,
    priceMonthly: 9.90,
    color: "border-surface-border",
    badge: null,
    tagline: "Pour découvrir l'IA",
    highlights: [
      { label: "Qualité", value: "HD 1080p" },
      { label: "Vitesse", value: "~45-60 sec" },
      { label: "File d'attente", value: "Partagée" },
    ],
    features: [
      "Génération photo uniquement",
      "Qualité HD 1080p",
      "10 styles disponibles",
      "Vitesse standard (~45-60 secondes)",
      "File d'attente partagée",
      "Historique limité (30 images)",
      "Sans watermark",
      "Support standard (réponse 48-72h)",
      "Téléchargement en 1080p",
    ],
  },
  {
    id: "plan_pro",
    name: "Pro",
    icon: <Sparkles className="w-5 h-5" />,
    credits: "10 250",
    creditsRaw: 10250,
    priceMonthly: 19.90,
    color: "border-accent-violet",
    badge: "Populaire",
    tagline: "Pour créer plus & mieux",
    highlights: [
      { label: "Qualité", value: "Ultra 4K" },
      { label: "Vitesse", value: "~20-30 sec" },
      { label: "File d'attente", value: "Accélérée" },
    ],
    features: [
      "Photo + Vidéo jusqu'à 5 secondes",
      "Qualité Ultra 4K (upscale x4)",
      "20+ styles + 5 styles exclusifs Pro",
      "Vitesse prioritaire (~20-30 secondes)",
      "File d'attente accélérée",
      "Historique illimité",
      "Support prioritaire (réponse sous 24h)",
      "Partage direct réseaux sociaux",
      "API basique (100 req/jour)",
      "Statistiques d'usage détaillées",
    ],
  },
  {
    id: "plan_ultra",
    name: "Elite",
    icon: <Crown className="w-5 h-5" />,
    credits: "Illimité",
    creditsRaw: null,
    priceMonthly: 39.90,
    color: "border-accent-neon/50",
    badge: "Meilleure valeur",
    tagline: "L'expérience sans compromis",
    highlights: [
      { label: "Qualité", value: "8K Photoréaliste" },
      { label: "Vitesse", value: "~10-15 sec" },
      { label: "File d'attente", value: "Priorité absolue" },
    ],
    features: [
      "Photo + Vidéo 4K jusqu'à 30 secondes",
      "Qualité Ultra 8K — Photoréalisme maximum",
      "Tous les styles + styles exclusifs Elite",
      "Vitesse ultra (~10-15 secondes)",
      "Priorité absolue — jamais d'attente",
      "Licence commerciale incluse",
      "API illimitée (sans restriction)",
      "Accès bêta en avant-première",
      "Manager de compte dédié",
      "Styles personnalisés sur demande",
      "Support VIP dédié (réponse < 4h)",
    ],
  },
];

const FAQ = [
  {
    q: "Combien vaut un crédit ?",
    a: "1 image générée = 100 crédits. Pour la vidéo, comptez 200 crédits par seconde de vidéo générée.",
  },
  {
    q: "Les crédits non utilisés sont-ils reportés ?",
    a: "Oui, les crédits mensuels non utilisés sont reportés au mois suivant tant que votre abonnement est actif.",
  },
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, vous pouvez upgrader ou downgrader votre plan à n'importe quel moment. Le changement prend effet immédiatement.",
  },
  {
    q: "Combien de temps dure une génération ?",
    a: "En moyenne 20 à 40 secondes selon la complexité du style. Les plans Pro et Ultra bénéficient d'une file d'attente prioritaire.",
  },
  {
    q: "Puis-je utiliser les images commercialement ?",
    a: "Les images sont pour usage personnel et créatif uniquement. L'usage commercial nécessite une licence spéciale — contactez-nous.",
  },
  {
    q: "Comment fonctionne le remboursement ?",
    a: "Nous offrons un remboursement intégral sous 48h si vous n'êtes pas satisfait de vos premières générations.",
  },
];

function formatPrice(price: number) {
  return price.toFixed(2).replace(".", ",") + "€";
}

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    setLoadingPlan(plan.id);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erreur lors de la création de la session de paiement");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl sm:text-6xl font-black mb-4">
            Choisissez votre <span className="gradient-text">plan</span>
          </h1>
          <p className="text-white/50 text-xl max-w-xl mx-auto mb-8">
            Des crédits renouvelés chaque mois pour transformer vos photos et vidéos.
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="inline-flex items-center gap-1 bg-surface border border-surface-border rounded-2xl p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-accent-violet text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "yearly"
                  ? "bg-accent-violet text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Annuel
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">
                −17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, i) => {
            const monthlyPrice = plan.priceMonthly;
            const yearlyTotal = +(monthlyPrice * 12 * 0.83).toFixed(2);
            const yearlyPerMonth = +(yearlyTotal / 12).toFixed(2);

            const displayPrice = billing === "monthly" ? monthlyPrice : yearlyPerMonth;
            const displayTotal = billing === "yearly" ? yearlyTotal : null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative card border-2 ${plan.color} flex flex-col ${
                  plan.badge === "Populaire" ? "shadow-violet scale-[1.02]" : ""
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs px-4 py-1 rounded-full font-bold whitespace-nowrap ${
                    plan.badge === "Populaire" ? "bg-accent-violet" : "bg-gradient-violet-neon"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                {/* Nom & icône */}
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    plan.name === "Elite"
                      ? "bg-accent-neon/15 text-accent-neon"
                      : "bg-accent-violet/15 text-accent-violet"
                  }`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-white/40 text-xs mb-5">{plan.tagline}</p>

                {/* Prix */}
                <div className="mb-2">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">{formatPrice(displayPrice)}</span>
                    <span className="text-white/40 text-sm mb-1">/mois</span>
                  </div>
                  {displayTotal && (
                    <p className="text-white/30 text-xs mt-1">
                      soit {formatPrice(displayTotal)} facturés annuellement
                    </p>
                  )}
                </div>

                {/* Crédits */}
                <div className="text-center mb-4 py-4 bg-surface-hover rounded-xl">
                  {plan.creditsRaw === null ? (
                    <div className="flex items-center justify-center gap-2">
                      <Infinity className="w-8 h-8 text-accent-violet" />
                      <span className="text-2xl font-black gradient-text">Illimité</span>
                    </div>
                  ) : (
                    <span className="text-4xl font-black gradient-text">{plan.credits}</span>
                  )}
                  <p className="text-white/50 text-sm mt-1">crédits / mois</p>
                </div>

                {/* Highlights — qualité / vitesse / file */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {plan.highlights.map((h) => (
                    <div key={h.label} className="bg-surface-hover rounded-lg px-2 py-2 text-center">
                      <p className="text-white/35 text-[10px] uppercase tracking-wide mb-0.5">{h.label}</p>
                      <p className={`text-xs font-bold leading-tight ${
                        plan.name === "Elite" ? "text-accent-neon" : "text-accent-violet"
                      }`}>{h.value}</p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.name === "Elite" ? "text-accent-neon" : "text-accent-violet"
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!loadingPlan}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    plan.name === "Elite"
                      ? "bg-gradient-to-r from-accent-neon/80 to-accent-violet text-white hover:opacity-90"
                      : plan.badge === "Populaire"
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {plan.name === "Elite" ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      {plan.name === "Elite" ? "Accès Elite" : "Commencer"}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Explication crédits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16"
        >
          <div className="card border-accent-violet/20 bg-accent-violet/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-violet/15 rounded-xl flex items-center justify-center text-accent-violet flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white">1 image générée</p>
              <p className="text-white/50 text-sm">= 100 crédits</p>
            </div>
          </div>
          <div className="card border-accent-neon/20 bg-accent-neon/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-neon/10 rounded-xl flex items-center justify-center text-accent-neon flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white">1 seconde de vidéo</p>
              <p className="text-white/50 text-sm">= 200 crédits</p>
            </div>
          </div>
        </motion.div>

        {/* Démarrage gratuit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card border-accent-neon/20 bg-accent-neon/5 text-center mb-16"
        >
          <h3 className="text-2xl font-bold mb-2">Essayez gratuitement</h3>
          <p className="text-white/50 mb-4">
            Créez un compte et recevez 100 crédits offerts (soit 1 image gratuite). Aucune carte bancaire requise.
          </p>
          <a href="/register" className="btn-primary inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Créer mon compte gratuit
          </a>
        </motion.div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card"
              >
                <h4 className="font-semibold mb-2">{item.q}</h4>
                <p className="text-white/50 text-sm leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
