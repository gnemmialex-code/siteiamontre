"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import Navbar from "../components/Navbar";
import UploadBox from "../components/UploadBox";
import VideoUploadBox from "../components/VideoUploadBox";
import { STYLES, Style } from "../components/StyleSelector";
import Loader from "../components/Loader";
import PaywallModal from "../components/PaywallModal";
import { supabase } from "@/lib/supabase";
import {
  Sparkles, AlertCircle, Shuffle, ChevronDown, ChevronUp, Film, Lock,
} from "lucide-react";

// ── Additional refinement options ─────────────────────────────────────────────

interface OptionItem { id: string; label: string; prompt: string; }

const CLOTHING_OPTIONS: OptionItem[] = [
  { id: "casual",        label: "👕 Casual chic",    prompt: "casual chic outfit, relaxed stylish attire" },
  { id: "formal_suit",   label: "🤵 Costume formel", prompt: "wearing a formal suit, sharp elegant attire" },
  { id: "elegant_dress", label: "👗 Robe élégante",  prompt: "wearing an elegant evening dress, glamorous" },
  { id: "streetwear",    label: "🧢 Streetwear",     prompt: "streetwear urban fashion, trendy look" },
  { id: "haute_couture", label: "✨ Haute couture",  prompt: "haute couture designer fashion, luxury outfit" },
  { id: "sporty",        label: "⚡ Sportswear",     prompt: "athletic sportswear, dynamic sporty look" },
];

const MOOD_OPTIONS: OptionItem[] = [
  { id: "glamour",      label: "💫 Glamour",      prompt: "glamorous confident stunning expression" },
  { id: "edgy",         label: "🖤 Edgy",          prompt: "edgy rock aesthetic, intense bold look" },
  { id: "romantic",     label: "🌸 Romantique",    prompt: "romantic soft aesthetic, gentle warm expression" },
  { id: "professional", label: "💼 Pro",           prompt: "professional confident businesslike look" },
  { id: "mysterious",   label: "🌙 Mystérieux",    prompt: "mysterious alluring dark expression" },
  { id: "futuristic",   label: "🤖 Futuriste",     prompt: "futuristic cyberpunk aesthetic, neon vibes" },
];

const BACKGROUND_OPTIONS: OptionItem[] = [
  { id: "studio",     label: "⬜ Studio",     prompt: "clean professional studio background" },
  { id: "city_night", label: "🌃 Ville nuit", prompt: "nighttime cityscape background, bokeh lights" },
  { id: "nature",     label: "🌿 Nature",     prompt: "lush green nature outdoor background" },
  { id: "luxury",     label: "💎 Luxe",       prompt: "luxury opulent interior background" },
  { id: "beach",      label: "🏖️ Plage",      prompt: "golden hour tropical beach background" },
  { id: "abstract",   label: "🎨 Abstrait",   prompt: "abstract colorful artistic background" },
];

const ACCESSORY_OPTIONS: OptionItem[] = [
  { id: "none",       label: "❌ Aucun",      prompt: "" },
  { id: "sunglasses", label: "🕶️ Lunettes",   prompt: "wearing stylish designer sunglasses" },
  { id: "jewelry",    label: "💍 Bijoux",     prompt: "wearing luxury gold jewelry and accessories" },
  { id: "hat",        label: "🎩 Chapeau",    prompt: "wearing a stylish fashionable hat" },
  { id: "scarf",      label: "🧣 Écharpe",    prompt: "wearing an elegant silk scarf" },
];

function buildEnrichedPrompt(
  style: Style | null,
  clothing: string | null,
  mood: string | null,
  bg: string | null,
  accessory: string | null,
): string {
  const parts: string[] = [];
  if (style) parts.push(style.prompt);
  const cp = CLOTHING_OPTIONS.find(o => o.id === clothing)?.prompt;
  if (cp) parts.push(cp);
  const mp = MOOD_OPTIONS.find(o => o.id === mood)?.prompt;
  if (mp) parts.push(mp);
  const bp = BACKGROUND_OPTIONS.find(o => o.id === bg)?.prompt;
  if (bp) parts.push(bp);
  const ap = ACCESSORY_OPTIONS.find(o => o.id === accessory)?.prompt;
  if (ap && accessory !== "none") parts.push(ap);
  return parts.join(", ");
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const CREATE_STEPS = [
  "Détection du visage",
  "Extraction des features",
  "Application du style",
  "Génération IA",
  "Upscale 4K",
  "Finalisation",
];

const SWAPFACE_STEPS = [
  "Détection des visages",
  "Extraction du visage source",
  "Alignement facial",
  "Swap haute fidélité",
  "Retouche finale",
  "Finalisation",
];

const VIDEO_STEPS = [
  "Analyse de la vidéo",
  "Extraction des frames",
  "Traitement IA",
  "Recomposition",
  "Rendu final",
  "Finalisation",
];

type Mode = "create" | "swapface" | "video";

// ── OptionChips ───────────────────────────────────────────────────────────────

function OptionChips({
  title, options, selected, onSelect,
}: {
  title: string;
  options: OptionItem[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onSelect(selected === opt.id ? null : opt.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selected === opt.id
                ? "bg-accent-violet/20 border-accent-violet text-white"
                : "border-surface-border text-white/50 hover:border-accent-violet/40 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── StepBadge ─────────────────────────────────────────────────────────────────

function StepBadge({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {n}
    </span>
  );
}

// ── GenerateCard ──────────────────────────────────────────────────────────────

function GenerateCard({
  consent, setConsent, error, onGenerate, canGenerate, credits, stepNumber = 4,
}: {
  consent: boolean;
  setConsent: (v: boolean) => void;
  error: string | null;
  onGenerate: () => void;
  canGenerate: boolean;
  credits: number;
  stepNumber?: number;
}) {
  return (
    <div className="card">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <StepBadge n={stepNumber} />
        Générer
      </h2>

      <label className="flex items-start gap-3 cursor-pointer group mb-6">
        <div className="relative mt-0.5 flex-shrink-0">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="sr-only" />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            consent ? "bg-accent-violet border-accent-violet" : "border-surface-border group-hover:border-accent-violet/50"
          }`}>
            {consent && <span className="text-white text-xs">✓</span>}
          </div>
        </div>
        <span className="text-white/60 text-sm leading-relaxed">
          Je confirme avoir le droit d&apos;utiliser ces photos et j&apos;accepte les{" "}
          <a href="/terms" className="text-accent-violet hover:underline">conditions d&apos;utilisation</a>.
        </span>
      </label>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-5 h-5" />
        Générer Ultra HD — {credits} crédits
      </button>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/30 flex-wrap">
        <span>🔒 Photos supprimées après traitement</span>
        <span>⚡ ~30 secondes</span>
        <span>📐 4K Ultra HD</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState<Mode>("create");

  // Create mode
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [showStyleSection, setShowStyleSection] = useState(true);
  const [clothing, setClothing] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [accessory, setAccessory] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  // SwapFace mode
  const [swapSourceFile, setSwapSourceFile] = useState<File | null>(null);
  const [swapSourcePreview, setSwapSourcePreview] = useState<string | null>(null);
  const [swapTargetFile, setSwapTargetFile] = useState<File | null>(null);
  const [swapTargetPreview, setSwapTargetPreview] = useState<string | null>(null);
  const [faceIndex, setFaceIndex] = useState<"0" | "1" | "auto">("auto");
  const [swapExtraPrompt, setSwapExtraPrompt] = useState("");
  const [showSwapPrompt, setShowSwapPrompt] = useState(false);

  // Video mode
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState("");

  // Common
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
  }, []);

  const handleStyleSelect = (style: Style) => {
    if (selectedStyle?.id === style.id) {
      setSelectedStyle(null);
      setClothing(null);
      setMood(null);
      setBackground(null);
      setAccessory(null);
    } else {
      setSelectedStyle(style);
    }
  };

  const simulateProgress = (steps: string[]) => {
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 15 + 5;
      if (prog >= 100) { prog = 100; clearInterval(interval); }
      setProgress(Math.min(prog, 95));
      setCurrentStep(Math.min(Math.floor((prog / 100) * steps.length), steps.length - 1));
    }, 500);
    return interval;
  };

  const handleGenerate = async () => {
    setError(null);

    if (mode === "create") {
      if (!file) { setError("Veuillez sélectionner une photo."); return; }
      if (!selectedStyle && !prompt.trim()) {
        setError("Veuillez choisir un style ou entrer une description.");
        return;
      }
    } else if (mode === "swapface") {
      if (!swapSourceFile) { setError("Veuillez uploader votre visage source."); return; }
      if (!swapTargetFile) { setError("Veuillez uploader la photo cible."); return; }
    } else if (mode === "video") {
      if (!videoFile) { setError("Veuillez uploader une vidéo."); return; }
      if (!videoPrompt) { setError("Veuillez entrer un prompt."); return; }
    }
    if (!consent) { setError("Vous devez accepter les conditions d'utilisation."); return; }

    setIsGenerating(true);
    setCurrentStep(0);
    setProgress(0);

    const steps =
      mode === "swapface" ? SWAPFACE_STEPS :
      mode === "video" ? VIDEO_STEPS :
      CREATE_STEPS;
    const progressInterval = simulateProgress(steps);

    try {
      const formData = new FormData();

      if (mode === "create") {
        const enrichedPrompt = buildEnrichedPrompt(selectedStyle, clothing, mood, background, accessory);
        formData.append("image", file!);
        if (selectedStyle) {
          formData.append("style_id", selectedStyle.id);
          formData.append("style_label", selectedStyle.label);
        }
        if (enrichedPrompt) formData.append("style_prompt", enrichedPrompt);
        if (prompt.trim()) formData.append("custom_prompt", prompt.trim());
        formData.append("mode", "style");

      } else if (mode === "swapface") {
        formData.append("source_image", swapSourceFile!);
        formData.append("target_image", swapTargetFile!);
        formData.append("face_index", faceIndex);
        if (swapExtraPrompt) formData.append("extra_prompt", swapExtraPrompt);
        formData.append("mode", "swapface");

      } else if (mode === "video") {
        formData.append("video", videoFile!);
        formData.append("prompt", videoPrompt);
        formData.append("mode", "video");
      }

      const res = await fetch("/api/generate", { method: "POST", body: formData });

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep(steps.length - 1);

      if (res.status === 402) { setIsGenerating(false); setShowPaywall(true); return; }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la génération");
      }

      const data = await res.json();
      if (data.generation_id) {
        toast.success("Génération terminée !");
        setTimeout(() => router.push(`/result?id=${data.generation_id}`), 500);
      }
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const steps =
    mode === "swapface" ? SWAPFACE_STEPS :
    mode === "video" ? VIDEO_STEPS :
    CREATE_STEPS;

  const canGenerate =
    mode === "create" ? !!(file && (selectedStyle || prompt.trim()) && consent) :
    mode === "swapface" ? !!(swapSourceFile && swapTargetFile && consent) :
    mode === "video" ? !!(videoFile && videoPrompt && consent) :
    false;

  const hasRefinements = selectedStyle && isLoggedIn;
  const generateStep = hasRefinements ? 5 : 4;

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center max-w-sm w-full px-4">
            <Loader message="Génération en cours..." progress={progress} steps={steps} currentStep={currentStep} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-3">
            Créer votre <span className="gradient-text">transformation</span>
          </h1>
          <p className="text-white/50 text-lg">
            Uploadez votre photo, personnalisez le style, et laissez l&apos;IA faire le reste
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex justify-center mb-8"
        >
          <div className="flex flex-wrap gap-1 p-1 bg-surface border border-surface-border rounded-2xl">
            <button
              onClick={() => { setMode("create"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "create" ? "bg-accent-violet text-white shadow-violet" : "text-white/50 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Créer
            </button>
            <button
              onClick={() => { setMode("swapface"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "swapface" ? "bg-accent-violet text-white shadow-violet" : "text-white/50 hover:text-white"
              }`}
            >
              <Shuffle className="w-4 h-4" />
              SwapFace
            </button>
            <button
              onClick={() => { setMode("video"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "video" ? "bg-accent-violet text-white shadow-violet" : "text-white/50 hover:text-white"
              }`}
            >
              <Film className="w-4 h-4" />
              Vidéo IA
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── MODE CRÉER (Style IA + Image IA fusionnés) ── */}
          {mode === "create" && (
            <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Photo upload */}
                <div className="lg:col-span-1">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <StepBadge n={1} />
                      Votre photo
                    </h2>
                    <UploadBox
                      onFileSelected={(f, p) => { setFile(f); setPreview(p); setError(null); }}
                      onClear={() => { setFile(null); setPreview(null); }}
                      preview={preview}
                      label="Photo de visage"
                    />
                    <div className="mt-4 p-3 bg-surface-hover rounded-xl">
                      <p className="text-white/40 text-xs leading-relaxed">
                        💡 Photo nette, visage bien visible, bonne luminosité.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Style Celebrity — collapsible, optional */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card">
                    <button
                      onClick={() => setShowStyleSection(!showStyleSection)}
                      className="w-full flex items-center justify-between"
                    >
                      <h2 className="font-bold text-lg flex items-center gap-2">
                        <StepBadge n={2} />
                        Style Celebrity
                        <span className="text-xs font-normal text-white/30 ml-1">(optionnel)</span>
                      </h2>
                      <div className="flex items-center gap-2">
                        {selectedStyle && (
                          <span className="text-xs font-semibold text-accent-violet bg-accent-violet/10 border border-accent-violet/30 px-2.5 py-1 rounded-full">
                            {selectedStyle.emoji} {selectedStyle.label}
                          </span>
                        )}
                        {showStyleSection
                          ? <ChevronUp className="w-4 h-4 text-white/40" />
                          : <ChevronDown className="w-4 h-4 text-white/40" />
                        }
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {showStyleSection && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 relative">
                            {/* Style grid */}
                            <div className={!isLoggedIn ? "blur-sm pointer-events-none select-none opacity-40" : ""}>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {STYLES.map((style, i) => {
                                  const isSelected = selectedStyle?.id === style.id;
                                  return (
                                    <motion.button
                                      key={style.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: i * 0.04 }}
                                      onClick={() => handleStyleSelect(style)}
                                      className={`relative rounded-xl border text-left transition-all duration-200 overflow-hidden ${
                                        isSelected
                                          ? "border-accent-violet shadow-violet"
                                          : "border-surface-border bg-surface hover:border-accent-violet/40 hover:bg-surface-hover"
                                      }`}
                                    >
                                      {style.previewImg && (
                                        <div className="w-full h-16 overflow-hidden bg-surface-hover relative">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={style.previewImg}
                                            alt={style.label}
                                            className="w-full h-full object-cover"
                                            onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                                          />
                                          {isSelected && <div className="absolute inset-0 bg-accent-violet/20" />}
                                        </div>
                                      )}
                                      <div className={`p-2.5 ${isSelected ? "bg-accent-violet/10" : ""}`}>
                                        {isSelected && (
                                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent-violet rounded-full flex items-center justify-center z-10">
                                            <span className="text-white text-[9px]">✓</span>
                                          </div>
                                        )}
                                        <span className="text-base mb-0.5 block">{style.emoji}</span>
                                        <p className="font-semibold text-xs text-white leading-tight">{style.label}</p>
                                        <p className="text-white/40 text-[10px] leading-tight mt-0.5">{style.description}</p>
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Paywall overlay — non-logged users */}
                            {!isLoggedIn && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                                <div className="text-center bg-background/80 backdrop-blur-lg rounded-2xl px-8 py-7 border border-surface-border shadow-2xl">
                                  <div className="relative w-12 h-12 mx-auto mb-3">
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                                      className="w-12 h-12 rounded-full border-2 border-white/10 border-t-accent-violet"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Lock className="w-4 h-4 text-accent-violet" />
                                    </div>
                                  </div>
                                  <p className="text-white/70 text-sm font-medium mb-1">Styles exclusifs</p>
                                  <p className="text-white/40 text-xs mb-4">Créez un compte gratuit pour y accéder</p>
                                  <Link
                                    href="/register"
                                    className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    S&apos;inscrire pour voir
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Refinement questions — only when style is selected + logged in */}
                  <AnimatePresence>
                    {hasRefinements && (
                      <motion.div
                        key="refinement"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="card space-y-5"
                      >
                        <h2 className="font-bold text-lg flex items-center gap-2">
                          <StepBadge n={3} />
                          Personnaliser
                          <span className="text-xs font-normal text-white/30 ml-1">(optionnel)</span>
                        </h2>
                        <OptionChips
                          title="Vêtements"
                          options={CLOTHING_OPTIONS}
                          selected={clothing}
                          onSelect={setClothing}
                        />
                        <OptionChips
                          title="Ambiance"
                          options={MOOD_OPTIONS}
                          selected={mood}
                          onSelect={setMood}
                        />
                        <OptionChips
                          title="Décor / Fond"
                          options={BACKGROUND_OPTIONS}
                          selected={background}
                          onSelect={setBackground}
                        />
                        <OptionChips
                          title="Accessoires"
                          options={ACCESSORY_OPTIONS}
                          selected={accessory}
                          onSelect={setAccessory}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Free prompt */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <StepBadge n={hasRefinements ? 4 : 3} />
                      Description libre
                      {selectedStyle
                        ? <span className="text-xs font-normal text-white/30 ml-1">(optionnel)</span>
                        : <span className="text-xs font-normal text-red-400/50 ml-1">(requis sans style)</span>
                      }
                    </h2>
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder={selectedStyle
                        ? "Ajoutez des détails supplémentaires : expression, lumière, couleur de cheveux…"
                        : "Décrivez la transformation souhaitée : tenue, ambiance, fond, lumière…"
                      }
                      rows={3}
                      className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-y min-h-[80px]"
                    />
                  </motion.div>

                  {/* Generate */}
                  <GenerateCard
                    consent={consent}
                    setConsent={setConsent}
                    error={error}
                    onGenerate={handleGenerate}
                    canGenerate={canGenerate}
                    credits={100}
                    stepNumber={generateStep}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MODE SWAPFACE ── */}
          {mode === "swapface" && (
            <motion.div key="swapface" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                    <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <StepBadge n={1} />
                      Photos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-white/70 mb-3">Votre visage <span className="text-accent-violet">*</span></p>
                        <UploadBox
                          onFileSelected={(f, p) => { setSwapSourceFile(f); setSwapSourcePreview(p); setError(null); }}
                          onClear={() => { setSwapSourceFile(null); setSwapSourcePreview(null); }}
                          preview={swapSourcePreview}
                          label="Photo de votre visage"
                        />
                        <p className="text-white/30 text-xs mt-2">Le visage à utiliser comme source</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/70 mb-3">Photo cible <span className="text-accent-violet">*</span></p>
                        <UploadBox
                          onFileSelected={(f, p) => { setSwapTargetFile(f); setSwapTargetPreview(p); setError(null); }}
                          onClear={() => { setSwapTargetFile(null); setSwapTargetPreview(null); }}
                          preview={swapTargetPreview}
                          label="Photo où changer le visage"
                        />
                        <p className="text-white/30 text-xs mt-2">La photo sur laquelle appliquer le swap</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card space-y-5">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                      <StepBadge n={2} />
                      Options
                    </h2>
                    <div>
                      <p className="text-sm font-medium text-white/70 mb-3">
                        Visage à remplacer dans la photo cible
                        <span className="text-white/30 text-xs ml-2">(si plusieurs visages)</span>
                      </p>
                      <div className="flex gap-2">
                        {[
                          { value: "auto", label: "Automatique" },
                          { value: "0",    label: "Visage 1" },
                          { value: "1",    label: "Visage 2" },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setFaceIndex(opt.value as "0" | "1" | "auto")}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                              faceIndex === opt.value
                                ? "bg-accent-violet/15 border-accent-violet text-white"
                                : "border-surface-border text-white/50 hover:text-white hover:border-accent-violet/40"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border border-surface-border rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowSwapPrompt(!showSwapPrompt)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-surface-hover transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Informations supplémentaires <span className="text-white/30 text-xs">(optionnel)</span>
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSwapPrompt ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {showSwapPrompt && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-4 pb-4 border-t border-surface-border">
                              <p className="text-white/30 text-xs mt-3 mb-2">
                                Donne plus d&apos;infos à l&apos;IA pour affiner le résultat.
                              </p>
                              <textarea
                                value={swapExtraPrompt}
                                onChange={e => setSwapExtraPrompt(e.target.value)}
                                placeholder="Ex: améliorer la luminosité, harmoniser la couleur de peau, fond flou..."
                                rows={3}
                                className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>

                <div className="lg:col-span-1">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <div className="p-4 bg-accent-violet/5 border border-accent-violet/20 rounded-2xl mb-6 text-sm text-white/60 leading-relaxed">
                      <p className="font-semibold text-white mb-1">Comment ça marche ?</p>
                      <ol className="space-y-1 list-decimal list-inside text-xs text-white/50">
                        <li>Upload ton visage source</li>
                        <li>Upload la photo cible</li>
                        <li>Sélectionne le visage à remplacer</li>
                        <li>L&apos;IA swap les visages en HD</li>
                      </ol>
                    </div>
                    <GenerateCard
                      consent={consent}
                      setConsent={setConsent}
                      error={error}
                      onGenerate={handleGenerate}
                      canGenerate={canGenerate}
                      credits={100}
                      stepNumber={3}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MODE VIDÉO IA ── */}
          {mode === "video" && (
            <motion.div key="video" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <StepBadge n={1} />
                      Votre vidéo
                    </h2>
                    <VideoUploadBox
                      onFileSelected={(f, p) => { setVideoFile(f); setVideoPreview(p); setError(null); }}
                      onClear={() => { setVideoFile(null); setVideoPreview(null); }}
                      preview={videoPreview}
                      label="Vidéo à transformer"
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <StepBadge n={2} />
                      Prompt
                    </h2>
                    <textarea
                      value={videoPrompt}
                      onChange={e => setVideoPrompt(e.target.value)}
                      placeholder="Décrivez la transformation souhaitée sur la vidéo…"
                      rows={4}
                      className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none"
                    />
                  </motion.div>
                </div>

                <div className="lg:col-span-1">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <div className="p-4 bg-accent-violet/5 border border-accent-violet/20 rounded-2xl mb-6 text-sm text-white/60 leading-relaxed">
                      <p className="font-semibold text-white mb-1">Comment ça marche ?</p>
                      <ol className="space-y-1 list-decimal list-inside text-xs text-white/50">
                        <li>Upload ta vidéo (MP4, MOV, WebM)</li>
                        <li>Écris ce que tu veux transformer</li>
                        <li>L&apos;IA traite chaque frame en HD</li>
                      </ol>
                    </div>
                    <GenerateCard
                      consent={consent}
                      setConsent={setConsent}
                      error={error}
                      onGenerate={handleGenerate}
                      canGenerate={canGenerate}
                      credits={150}
                      stepNumber={3}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} reason="Crédits épuisés — Rechargez pour continuer" />
    </div>
  );
}
