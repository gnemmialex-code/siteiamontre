"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import { supabase } from "@/lib/supabase";
import {
  Sparkles, Zap, Shield, Star, ArrowRight, Play,
  ChevronDown, Quote, ImageIcon, Film, Send, Paperclip, X,
} from "lucide-react";

// ─── DONNÉES ────────────────────────────────────────────────────────────────


const STATS = [
  { value: "50K+", label: "Générations" },
  { value: "4.9★", label: "Note moyenne" },
  { value: "<30s", label: "Temps moyen" },
  { value: "4K", label: "Résolution max" },
];

const REVIEWS = [
  { name: "Soph!_mtbl", city: "Paris", stars: 5, text: "Incroyable ! Le résultat est tellement réaliste, j'ai partagé sur Instagram et tout le monde pensait que c'était vrai." },
  { name: "Lucasss9378!", city: "Lyon", stars: 5, text: "La qualité 4K est bluffante. En 30 secondes j'avais mon photo en style Hollywood. Je recommande vivement !" },
  { name: "Chl0E.BRZH", city: "Bordeaux", stars: 5, text: "Parfait pour les photos de profil. Le style Vogue Editorial est mon préféré, le rendu est professionnel." },
  { name: "Max.xAm76", city: "Dijon", stars: 5, text: "J'utilise AstraCrea chaque semaine. Les crédits Pro suffisent largement, excellent rapport qualité/prix." },
  { name: "Em1.Rtbu", city: "Nantes", stars: 4, text: "Très bon service ! Seul petit bémol, parfois 40 secondes au lieu de 20 habituellement. Je pense que je vais passer à Ultra pour aller plus vite !" },
  { name: "ThomAss772ltrb", city: "Toulouse", stars: 5, text: "J'ai essayé d'autres outils, rien n'arrive à la cheville d'AstraCrea. La précision de la transformation est exceptionnelle." },
  { name: "Cam.sdr", city: "Strasbourg", stars: 5, text: "Le style Met Gala est trop bien. On dirait une vraie photo de gala. Mes amis n'en reviennent pas !" },
  { name: "FelixStrxu", city: "Nice", stars: 5, text: "Simple, rapide, bluffant. Je l'utilise pour mes contenus créatifs. Le pipeline IA est vraiment au top." },
  { name: "Saitawann.94", city: "Paris", stars: 5, text: "La vérité c'est rapide, qualité et le résultat est direct au rendez-vous !" },

];

// Pour les exemples : mets tes vraies images dans /public/examples/
// Format : { style, before: "/examples/before1.jpg", after: "/examples/after1.jpg" }
const EXAMPLES_IMAGES = [
  { style: "Scarlett Johansson", before: "/examples/scarlett_johansson_avant.png", after: "/examples/scarlett_johansson_apres.png" },
  { style: "Mia Khalifa",   before: "/examples/mia_avant.png" , after: "/examples/mia_apres.png" },
  { style: "Margot Robbit",        before: "/examples/margot_robbit_avant.png" , after: "/examples/margot_robbit_apres.png" },
  { style: "Leonardo DiCaprio",          before: "/examples/leonardo_dicaprio_avant.png", after: "/examples/leonardo_dicaprio_apres.png" },
  { style: "Denzel Washington",       before: "/examples/denzel_avant.png", after: "/examples/denzel_apres.png" },
  { style: "Johnny Sins",      before: "/examples/johnny_avant.png", after: "/examples/johnny_apres.png" },
  { style: "Kylian Mbappé",      before: "/examples/kylian_avant.png", after: "/examples/kylian_apres.png" },
  { style: "Eva Femme",      before: "/examples/eva_avant.png", after: "/examples/eva_apres.png" },

];

// Vidéos : remplis youtubeId OU localSrc (pas les deux)
// localSrc : mets ta vidéo dans /public/videos/ et indique le chemin ex: "/videos/demo.mp4"
const EXAMPLES_VIDEOS = [
  { title: "En maillot de bain", youtubeId: null, localSrc: "/videos/maillot.mp4" },
  { title: "Présentation de l'outfit",     youtubeId: null, localSrc: "/videos/outfit.mp4" },
];

const FAQ_ITEMS = [
  {
    q: "Comment fonctionne le Celebrity DeepSwap ?",
    a: "Notre pipeline IA en 4 étapes : détection du visage (InsightFace), génération du style (SDXL), face swap haute fidélité (ReActor), puis upscale 4K (RealESRGAN). Tout se passe en moins de 30 secondes sur nos serveurs.",
  },
  {
    q: "Mes photos sont-elles conservées ?",
    a: "Non. Votre photo originale est automatiquement supprimée de nos serveurs après traitement. Seule l'image générée est stockée dans votre historique, et vous pouvez la supprimer à tout moment.",
  },
  {
    q: "Puis-je utiliser n'importe quelle photo ?",
    a: "Oui, tant que le visage est bien visible, de face ou légèrement de profil, avec une bonne luminosité. Les photos floues, très sombres ou avec plusieurs visages donnent des résultats moins précis.",
  },
  {
    q: "Les crédits expirent-ils ?",
    a: "Non, vos crédits n'ont pas de date d'expiration. Achetez-en une fois, utilisez-les à votre rythme.",
  },
  {
    q: "Quelle est la résolution finale des images ?",
    a: "Toutes les images sont générées puis upscalées x4 via RealESRGAN. La résolution finale atteint jusqu'à 4K (4096×4096 px) selon le style choisi.",
  },
  {
    q: "Puis-je utiliser les images commercialement ?",
    a: "Les images générées sont destinées à un usage créatif personnel. Pour un usage commercial (publicité, revente, etc.), contactez-nous pour une licence spécifique.",
  },
  {
    q: "Comment fonctionne le remboursement ?",
    a: "Si vous n'êtes pas satisfait de vos 3 premières générations, nous remboursons intégralement votre achat sous 48h, sans question.",
  },
];

const FEATURES = [
  { icon: <Sparkles className="w-6 h-6" />, title: "IA Ultra HD", description: "Génération 4K avec upscale x4 automatique via RealESRGAN" },
  { icon: <Zap className="w-6 h-6" />, title: "Résultats en 30s", description: "Pipeline optimisé pour des résultats instantanés" },
  { icon: <Shield className="w-6 h-6" />, title: "100% Privé", description: "Vos photos sont supprimées après traitement" },
  { icon: <Star className="w-6 h-6" />, title: "Qualité Pro", description: "Technologie ReActor + FaceID pour un rendu naturel" },
];

// ─── COMPOSANTS INTERNES ────────────────────────────────────────────────────

// ── Ligne 1 : img01.jpg → img20.jpg  (défile vers la gauche)
// ── Ligne 2 : img21.jpg → img40.jpg  (défile vers la droite)
// Mets tes 40 images dans /public/hero-gallery/ avec ce nommage.
// Formats acceptés : jpg, jpeg, png, webp — remplace l'extension si besoin.
const ROW1 = [
  ...Array.from({ length: 4 }, (_, i) => `/hero-gallery/img${String(i + 11).padStart(2, "0")}.png`),
  ...Array.from({ length: 10 }, (_, i) => `/hero-gallery/img${String(i + 1).padStart(2, "0")}.png`),
];
const ROW2 = [
  ...Array.from({ length: 4 }, (_, i) => `/hero-gallery/img${String(i + 31).padStart(2, "0")}.png`),
  ...Array.from({ length: 10 }, (_, i) => `/hero-gallery/img${String(i + 21).padStart(2, "0")}.png`),
];

function ImageRow({
  images,
  direction,
}: {
  images: string[];
  direction: "left" | "right";
}) {
  // Dupliquer les images pour boucle seamless
  const doubled = [...images, ...images];

  return (
    <div className="overflow-hidden w-full">
      <div className={direction === "left" ? "animate-scroll-left" : "animate-scroll-right"}
        style={{ display: "flex", gap: "12px", width: "max-content" }}
      >
        {doubled.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: 300, height: 500 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                // Cache la cellule si l'image n'existe pas encore
                (e.currentTarget.parentElement as HTMLElement).style.display = "none";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroImageBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
      {/* Fond noir de base */}
      <div className="absolute inset-0 bg-[#0D0D0D]" />

      {/* Lignes d'images depuis le haut */}
      <div
        className="absolute inset-0 flex flex-col justify-start gap-4"
        style={{ opacity: 0.7 }}
      >
        <ImageRow images={ROW1} direction="left" />
        <ImageRow images={ROW2} direction="right" />
      </div>

      {/* ── Overlays pour lisibilité du texte ── */}
      {/* Vignette générale */}
      <div className="absolute inset-0 bg-background/45" />
      {/* Fondu haut léger (navbar) */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/70 to-transparent" />
      {/* Dégradé noir — couvre la moitié basse de la 2e ligne */}
      <div className="absolute bottom-0 left-0 right-0 h-[320px] bg-gradient-to-t from-background from-40% via-background/80 to-transparent" />
      {/* Fondu gauche */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      {/* Fondu droite */}
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

function ReviewsMarquee() {
  return (
    <div className="relative overflow-hidden py-4">
      {/* Fade gauche */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      {/* Fade droite */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-5 w-max"
        style={{ animation: "marquee 40s linear infinite" }}
      >
        {[...REVIEWS, ...REVIEWS].map((review, i) => (
          <div
            key={i}
            className="w-80 flex-shrink-0 card border border-surface-border p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {Array.from({ length: review.stars }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
                {Array.from({ length: 5 - review.stars }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-white/20" />
                ))}
              </div>
              <Quote className="w-4 h-4 text-accent-violet/40" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-violet-neon flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {review.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium text-sm leading-none">{review.name}</p>
                <p className="text-white/40 text-xs mt-0.5">{review.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function ExamplesGallery() {
  const [tab, setTab] = useState<"images" | "videos">("images");

  return (
    <div>
      {/* Onglets */}
      <div className="flex justify-center gap-2 mb-10">
        {[
          { id: "images" as const, label: "Photos", icon: <ImageIcon className="w-4 h-4" /> },
          { id: "videos" as const, label: "Vidéos", icon: <Film className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === t.id
                ? "bg-accent-violet text-white shadow-violet"
                : "bg-surface border border-surface-border text-white/50 hover:text-white hover:border-accent-violet/40"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "images" ? (
          <motion.div
            key="images"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {EXAMPLES_IMAGES.map((ex, i) => (
              <motion.div
                key={ex.style}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="group relative rounded-2xl overflow-hidden border border-surface-border hover:border-accent-violet/50 transition-all duration-300" style={{ aspectRatio: "9/16" }}
              >
                {ex.before && ex.after ? (
                  <BeforeAfterSlider before={ex.before} after={ex.after} alt={ex.style} />
                ) : (
                  /* Placeholder jusqu'à avoir de vraies images */
                  <div className="w-full h-full bg-surface-hover flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-violet-neon flex items-center justify-center text-white font-bold text-lg">
                      {ex.style.charAt(0)}
                    </div>
                    <p className="text-white/30 text-xs text-center px-4">
                      Image exemple<br />{ex.style}
                    </p>
                    <p className="text-white/15 text-xs">/public/examples/</p>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                  <p className="text-white text-sm font-medium">{ex.style}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="videos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {EXAMPLES_VIDEOS.map((vid, i) => (
              <motion.div
                key={vid.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden border border-surface-border"
              >
                <div className="bg-surface-hover relative group" style={{ aspectRatio: "9/16" }}>
                  {vid.youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${vid.youtubeId}?rel=0`}
                      title={vid.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : vid.localSrc ? (
                    <video
                      src={vid.localSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    /* Placeholder vidéo */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-accent-violet/20 border border-accent-violet/40 flex items-center justify-center group-hover:bg-accent-violet/30 transition-colors">
                        <Play className="w-7 h-7 text-accent-violet fill-accent-violet ml-1" />
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-sm">Vidéo de démonstration</p>
                        <p className="text-white/20 text-xs mt-1">Ajoutez localSrc dans EXAMPLES_VIDEOS</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-surface">
                  <p className="font-medium text-white">{vid.title}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
              isOpen ? "border-accent-violet/50 bg-accent-violet/5" : "border-surface-border bg-surface"
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left group"
            >
              <span className={`font-semibold transition-colors ${isOpen ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                {item.q}
              </span>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 ml-4 transition-all duration-300 ${
                  isOpen ? "rotate-180 text-accent-violet" : "text-white/30 group-hover:text-white/60"
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <p className="px-6 pb-5 text-white/60 leading-relaxed text-sm">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── CONTACT FORM ───────────────────────────────────────────────────────────

function ContactForm() {
  const [email,       setEmail]       = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [firstName,   setFirstName]   = useState("");
  const [subject,     setSubject]     = useState("");
  const [message,     setMessage]     = useState("");
  const [imageFile,   setImageFile]   = useState<File | null>(null);
  const [imagePreview,setImagePreview]= useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setEmail(data.user.email);
        setEmailLocked(true);
      }
    });
  }, []);

  const handleImage = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !firstName || !subject || !message) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email",      email);
      fd.append("first_name", firstName);
      fd.append("subject",    subject);
      fd.append("message",    message);
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch("/api/contact", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'envoi");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center mb-5">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-2xl font-bold mb-2">Message envoyé !</h3>
        <p className="text-white/50 max-w-sm">
          Merci {firstName}, nous avons bien reçu votre message et vous répondrons rapidement.
        </p>
        <button
          onClick={() => { setSuccess(false); setSubject(""); setMessage(""); setImageFile(null); setImagePreview(null); if (!emailLocked) setEmail(""); setFirstName(""); }}
          className="mt-6 text-accent-violet text-sm hover:underline"
        >
          Envoyer un autre message
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email + Prénom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            readOnly={emailLocked}
            placeholder="votre@email.com"
            className={`w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 transition-colors ${emailLocked ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          {emailLocked && <p className="text-white/30 text-[10px] mt-1">Pré-rempli depuis votre compte</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
            Prénom <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Votre prénom"
            className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 transition-colors"
          />
        </div>
      </div>

      {/* Sujet */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
          Motif / Sujet <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Ex : Question sur mon abonnement, Problème technique, Partenariat…"
          className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 transition-colors"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Décrivez votre demande en détail…"
          rows={5}
          className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none transition-colors"
        />
      </div>

      {/* Image optionnelle */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
          Image / Capture d&apos;écran <span className="text-white/25 font-normal">(optionnel)</span>
        </label>
        {imagePreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="preview" className="h-24 rounded-xl object-cover border border-surface-border" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-surface-border text-white/40 hover:text-white hover:border-accent-violet/40 text-sm transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Joindre une image (JPG, PNG — max 5 Mo)
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); }}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-60"
      >
        {loading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {loading ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  );
}

// ─── PAGE PRINCIPALE ────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <HeroImageBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-sm font-medium px-4 py-2 rounded-full mb-8">
              <Sparkles className="w-4 h-4" />
              Technologie IA de pointe
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black leading-tight mb-6"
          >
            Celebrity{" "}
            <span className="gradient-text">DeepSwap</span>
            <br />
            <span className="text-white/90">Ultra HD</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto mb-12"
          >
            Transformez vos photos avec l&apos;IA la plus avancée du marché.
            Résultats 4K ultra-réalistes en moins de 30 secondes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-xl bg-accent-violet/50 blur-lg pointer-events-none"
                animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0.15, 0.55] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="relative">
                <Link href="/upload" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
            <motion.button
              className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
              whileHover={{ scale: 1.04, borderColor: "rgba(138,43,226,0.6)" }}
              whileTap={{ scale: 0.96 }}
            >
              <Play className="w-5 h-5 fill-current" />
              Voir la démo
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-white/50 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ AVIS CLIENTS ══════════════════════════════════════════════════ */}
      <section className="py-20 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 px-4"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-white/60 text-sm font-medium">4,9 / 5 — 2 300+ avis</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-3">
            Ils ont essayé, ils ont <span className="gradient-text">adoré</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Des milliers d&apos;utilisateurs transforment leurs photos chaque jour
          </p>
        </motion.div>

        <ReviewsMarquee />
      </section>

      {/* ══ GALERIE EXEMPLES ══════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Exemples de <span className="gradient-text">transformations</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Passez la souris sur les photos pour voir la transformation. Regardez les vidéos pour voir en action - en cours d'amélioration.
            </p>
          </motion.div>

          <ExamplesGallery />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Créer ma transformation
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ POURQUOI ASTRACREA ═══════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">

        {/* Dégradés de fondu haut & bas */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

        {/* Orbe violet gauche — grand & visible */}
        <motion.div
          className="absolute -left-20 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-accent-violet/30 blur-[90px] pointer-events-none"
          animate={{ x: [0, 70, -10, 0], y: [0, -50, 20, 0], scale: [1, 1.2, 0.92, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Orbe neon droite — visible */}
        <motion.div
          className="absolute -right-16 top-1/4 w-[420px] h-[420px] rounded-full bg-accent-neon/20 blur-[80px] pointer-events-none"
          animate={{ x: [0, -60, 15, 0], y: [0, 55, -20, 0], scale: [1, 1.25, 0.95, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        {/* Orbe rose centre */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-pink-500/15 blur-[70px] pointer-events-none"
          animate={{ scale: [1, 1.6, 0.85, 1], opacity: [0.4, 0.9, 0.5, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
        {/* Bande lumineuse bas */}
        <motion.div
          className="absolute left-1/2 bottom-6 -translate-x-1/2 w-[700px] h-28 rounded-full bg-accent-violet/25 blur-[60px] pointer-events-none"
          animate={{ scaleX: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Particules flottantes — plus grandes et plus lumineuses */}
        {[
          { x: "6%",  y: "18%", r: 3.5, dur: 4.0, delay: 0.0 },
          { x: "15%", y: "72%", r: 2.5, dur: 5.5, delay: 1.1 },
          { x: "28%", y: "8%",  r: 4.0, dur: 3.8, delay: 0.4 },
          { x: "38%", y: "82%", r: 2.5, dur: 6.2, delay: 2.2 },
          { x: "54%", y: "12%", r: 3.0, dur: 4.6, delay: 0.9 },
          { x: "67%", y: "78%", r: 2.0, dur: 5.1, delay: 1.8 },
          { x: "76%", y: "22%", r: 4.5, dur: 3.5, delay: 0.2 },
          { x: "86%", y: "60%", r: 3.0, dur: 5.8, delay: 3.1 },
          { x: "94%", y: "38%", r: 2.5, dur: 4.3, delay: 0.7 },
          { x: "44%", y: "48%", r: 2.0, dur: 6.8, delay: 1.5 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent-violet pointer-events-none"
            style={{ left: p.x, top: p.y, width: p.r * 2, height: p.r * 2, boxShadow: `0 0 ${p.r * 3}px rgba(138,43,226,0.8)` }}
            animate={{ y: [0, -22, 0], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}

        {/* Scan-lines lumineuses — bien visibles */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{
              top: `${22 + i * 48}%`,
              background: "linear-gradient(90deg, transparent 0%, rgba(138,43,226,0.6) 30%, rgba(57,255,20,0.3) 50%, rgba(138,43,226,0.6) 70%, transparent 100%)",
            }}
            animate={{ scaleX: [0.1, 1.3, 0.1], opacity: [0, 1, 0] }}
            transition={{ duration: 4 + i * 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 2.2 }}
          />
        ))}

        {/* ── Contenu ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Pourquoi <span className="gradient-text">AstraCrea</span> ?
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              La technologie la plus avancée pour vos créations visuelles
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 70, damping: 14 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="card-hover group relative overflow-hidden cursor-default"
              >
                {/* Glow border animé au hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(138,43,226,0.12), rgba(57,255,20,0.04))",
                    boxShadow: "inset 0 0 0 1px rgba(138,43,226,0.35)",
                  }}
                />
                {/* Spotlight qui suit le hover */}
                <div
                  className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(400px circle at 50% 0%, rgba(138,43,226,0.08), transparent 60%)" }}
                />

                {/* Icône flottante */}
                <motion.div
                  className="w-12 h-12 bg-accent-violet/10 rounded-xl flex items-center justify-center text-accent-violet mb-4 group-hover:bg-accent-violet/25 transition-colors relative z-10"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.2 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                >
                  {feature.icon}
                </motion.div>

                <h3 className="text-lg font-bold mb-2 relative z-10">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed relative z-10">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-surface/20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Questions <span className="gradient-text">fréquentes</span>
            </h2>
            <p className="text-white/50 text-lg">
              Tout ce que vous devez savoir avant de commencer
            </p>
          </motion.div>

          <FaqAccordion />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-white/40 text-sm mt-8"
          >
            Une autre question ?{" "}
            <a href="mailto:contact@riseandclose.co" className="text-accent-violet hover:underline">
              Contactez-nous
            </a>
          </motion.p>
        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHE ════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Comment ça <span className="gradient-text">marche ?</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Uploadez votre photo", desc: "Importez n'importe quelle photo de visage claire (JPG, PNG, WebP)" },
              { step: "02", title: "Choisissez le style", desc: "Sélectionnez parmi nos 20+ styles Celebrity Ultra HD" },
              { step: "03", title: "Téléchargez le résultat", desc: "Votre photo transformée en 4K Ultra HD est prête en 30s" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="card">
                  <span className="text-6xl font-black gradient-text opacity-30 absolute top-4 right-4">
                    {item.step}
                  </span>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-white/50">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-accent-violet/50 text-2xl z-10">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════════════════════ */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
        {/* Fond de base */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent-violet/10 to-accent-neon/5 pointer-events-none" />

        {/* Dégradés de fondu haut & bas */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-background via-background/70 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none z-10" />

        {/* Orbe violet principal */}
        <motion.div
          className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-accent-violet/25 blur-3xl pointer-events-none"
          animate={{ x: [0, 50, -20, 0], y: [0, -35, 20, 0], scale: [1, 1.25, 0.9, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Orbe neon secondaire */}
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-accent-neon/12 blur-3xl pointer-events-none"
          animate={{ x: [0, -40, 10, 0], y: [0, 25, -15, 0], scale: [1, 1.3, 1.05, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        {/* Orbe rose discret */}
        <motion.div
          className="absolute top-1/4 right-1/3 w-40 h-40 rounded-full bg-pink-500/8 blur-2xl pointer-events-none"
          animate={{ x: [0, 30, -10, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />

        {/* Anneaux qui se propagent depuis le centre */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-violet/20 pointer-events-none"
            style={{ width: 120, height: 120 }}
            animate={{ scale: [1, 6], opacity: [0.45, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: i * 1.5 }}
          />
        ))}

        {/* Particules flottantes */}
        {[
          { x: "20%", y: "25%", size: 3, delay: 0 },
          { x: "75%", y: "30%", size: 2, delay: 1.2 },
          { x: "85%", y: "65%", size: 4, delay: 0.6 },
          { x: "15%", y: "70%", size: 2, delay: 2.1 },
          { x: "50%", y: "15%", size: 3, delay: 1.8 },
          { x: "60%", y: "80%", size: 2, delay: 0.3 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent-violet/60 pointer-events-none"
            style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
            animate={{ y: [0, -18, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: "spring", stiffness: 60 }}
          className="max-w-3xl mx-auto text-center relative z-20"
        >
          <motion.h2
            className="text-4xl sm:text-6xl font-black mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            Prêt à vous <span className="gradient-text">transformer</span> ?
          </motion.h2>
          <motion.p
            className="text-white/60 text-xl mb-10"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
          >
            100 crédits offerts à l&apos;inscription (soit 1 image gratuite). Aucune carte bancaire requise.
          </motion.p>
          <motion.div
            className="relative inline-block"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
          >
            {/* Halo pulsant derrière le bouton */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-accent-violet/55 blur-xl pointer-events-none"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.15, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
            >
              <Link href="/upload" className="btn-primary text-xl px-10 py-5 inline-flex items-center gap-2 group">
                Commencer gratuitement
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══ CONTACT ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-surface/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Left — texte */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 flex flex-col justify-center"
            >
              <span className="inline-flex items-center gap-2 bg-accent-violet/10 border border-accent-violet/30 text-accent-violet text-xs font-semibold px-3 py-1.5 rounded-full mb-6 w-fit">
                <Send className="w-3.5 h-3.5" />
                Contact
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                Une question ?<br />
                <span className="gradient-text">Écrivez-nous</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                Support, partenariat, retour d&apos;expérience — on vous répond en général sous 24h.
              </p>
              <div className="space-y-3 text-sm text-white/40">
                <p>📧 contact@riseandclose.co</p>
                <p>⏱️ Réponse sous 24h en moyenne</p>
                <p>🔒 Vos données restent confidentielles</p>
              </div>
            </motion.div>

            {/* Right — form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3 card"
            >
              <ContactForm />
            </motion.div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
