"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Sparkles, Download, Trash2, Zap, Plus, LogOut,
  Shuffle, Film, Crown, Settings, History,
  ChevronRight, Check, Star, Replace, PlusCircle, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resizeImageFile } from "@/lib/resize-image";
import UploadBox from "../components/UploadBox";
import VideoUploadBox from "../components/VideoUploadBox";
import { STYLES, Style } from "../components/StyleSelector";
import PaywallModal from "../components/PaywallModal";
import LiveNotification from "../components/LiveNotification";

/* ─── Refinement options ─────────────────────────────────── */
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

function DashOptionChips({ title, options, selected, onSelect }: {
  title: string; options: OptionItem[]; selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button key={opt.id}
            onClick={() => onSelect(selected === opt.id ? null : opt.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              selected === opt.id
                ? "bg-accent-violet/20 border-accent-violet text-white"
                : "border-surface-border text-white/45 hover:border-accent-violet/40 hover:text-white"
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Types ─────────────────────────────────────────────── */
type NavView = "create" | "history" | "subscription" | "settings";
type GenType = "create" | "swapface" | "video";
type ObjectOption = "addObject" | "fullGeneration" | "replaceObject";

interface Generation {
  id: string;
  output_image_url: string;
  input_image_url: string;
  style: string;
  created_at: string;
}
interface UserStats {
  credits: number;
  total_generations: number;
  member_since: string;
}

/* ─── Constants ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "create"       as NavView, label: "Créer",        icon: Sparkles, desc: "Nouvelle génération" },
  { id: "history"      as NavView, label: "Historique",   icon: History,  desc: "Mes créations"       },
  { id: "subscription" as NavView, label: "Abonnement",   icon: Crown,    desc: "Formules & crédits"  },
  { id: "settings"     as NavView, label: "Paramètres",   icon: Settings, desc: "Mon compte"          },
];

const GEN_TABS: { id: GenType; label: string; icon: React.ElementType }[] = [
  { id: "create",   label: "Créer",    icon: Sparkles },
  { id: "swapface", label: "SwapFace", icon: Shuffle  },
  { id: "video",    label: "Vidéo IA", icon: Film     },
];

const PLANS_DATA = [
  {
    id: "essentiel", name: "Essentiel", icon: Zap,   price: "9,90€",  credits: "2 500",
    color: "border-surface-border", badgeBg: "bg-white/10", badgeText: "text-white/60",
    features: ["Génération photo", "Qualité HD", "Sans watermark", "Historique", "20+ styles"],
  },
  {
    id: "pro",        name: "Pro",        icon: Star,  price: "24,90€", credits: "8 000",
    color: "border-accent-violet", badgeBg: "bg-accent-violet/20", badgeText: "text-accent-violet",
    badge: "Populaire",
    features: ["Tout Essentiel", "Vidéo IA", "Image IA", "Vitesse prioritaire", "50+ styles"],
  },
  {
    id: "elite",      name: "Elite",      icon: Crown, price: "59,90€", credits: "Illimité",
    color: "border-amber-400/50", badgeBg: "bg-amber-400/20", badgeText: "text-amber-400",
    badge: "Elite",
    features: ["Tout Pro", "Crédits illimités", "API accès", "Support prioritaire", "Early access"],
  },
];

/* ─── Animated nav button ────────────────────────────────── */
function NavButton({
  item, active, onClick,
}: {
  item: typeof NAV_ITEMS[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="relative w-full overflow-hidden rounded-2xl text-left"
    >
      {/* Always-running colour sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: active
            ? "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.45) 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.18) 50%, transparent 100%)",
        }}
        animate={{ x: ["-110%", "220%"] }}
        transition={{ duration: active ? 1.8 : 2.8, repeat: Infinity, ease: "linear", repeatDelay: active ? 0.2 : 0.8 }}
      />

      {/* Active background */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(34,211,238,0.08) 100%)" }}
        />
      )}

      {/* Left accent line */}
      {active && (
        <motion.div
          layoutId="nav-active-line"
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-accent-violet to-accent-neon"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {/* Content */}
      <div className={`relative z-10 flex items-center gap-3.5 px-4 py-3.5 ${active ? "text-white" : "text-white/50 hover:text-white/80"} transition-colors`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
          active ? "bg-accent-violet/30 text-accent-violet" : "bg-surface-hover"
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none mb-1">{item.label}</p>
          <p className="text-xs text-white/35">{item.desc}</p>
        </div>
        {active && (
          <ChevronRight className="w-4 h-4 text-accent-violet ml-auto" />
        )}
      </div>
    </motion.button>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [navView, setNavView]   = useState<NavView>("create");
  const [genType, setGenType]   = useState<GenType>("create");

  /* data */
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [stats,       setStats]       = useState<UserStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [userEmail,   setUserEmail]   = useState<string | null>(null);

  /* generation state – create (style + image fusionnés) */
  const [styleFile,     setStyleFile]     = useState<File | null>(null);
  const [stylePreview,  setStylePreview]  = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [clothing,      setClothing]      = useState<string | null>(null);
  const [mood,          setMood]          = useState<string | null>(null);
  const [styleBg,       setStyleBg]       = useState<string | null>(null);
  const [accessory,     setAccessory]     = useState<string | null>(null);
  const [freePrompt,    setFreePrompt]    = useState("");

  /* generation state – swapface */
  const [swapSrcFile,     setSwapSrcFile]     = useState<File | null>(null);
  const [swapSrcPreview,  setSwapSrcPreview]  = useState<string | null>(null);
  const [swapTgtFile,     setSwapTgtFile]     = useState<File | null>(null);
  const [swapTgtPreview,  setSwapTgtPreview]  = useState<string | null>(null);
  const [faceIndex,       setFaceIndex]       = useState<"0"|"1"|"auto">("auto");
  const [swapExtraPrompt, setSwapExtraPrompt] = useState("");

  /* generation state – video */
  const [videoFile,         setVideoFile]         = useState<File | null>(null);
  const [videoPreview,      setVideoPreview]       = useState<string | null>(null);
  const [videoPrompt,       setVideoPrompt]        = useState("");
  const [videoObjectOptions,setVideoObjectOptions] = useState<Set<ObjectOption>>(new Set());

  /* common */
  const [consent,       setConsent]       = useState(false);
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [genProgress,   setGenProgress]   = useState(0);
  const [error,         setError]         = useState<string | null>(null);
  const [showPaywall,   setShowPaywall]   = useState(false);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    Promise.all([fetchGenerations(), fetchStats()]).finally(() => setLoading(false));
  }, []);

  const fetchGenerations = async () => {
    try {
      const res  = await fetch("/api/generations");
      if (!res.ok) return;
      const data = await res.json();
      setGenerations(data.generations ?? []);
    } catch { /* silent */ }
  };

  const fetchStats = async () => {
    try {
      const res  = await fetch("/api/credits");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
      if (res.ok) { setGenerations(prev => prev.filter(g => g.id !== id)); toast.success("Supprimé"); }
    } finally { setDeletingId(null); }
  };

  const handleDownload = async (url: string, id: string) => {
    try {
      const blob      = await (await fetch(url)).blob();
      const objectUrl = URL.createObjectURL(blob);
      const a         = document.createElement("a");
      a.href = objectUrl; a.download = `astracrea-${id}.png`; a.click();
      URL.revokeObjectURL(objectUrl);
    } catch { toast.error("Erreur de téléchargement"); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const toggleObjectOption = (
    options: Set<ObjectOption>,
    setOptions: (s: Set<ObjectOption>) => void,
    opt: ObjectOption,
  ) => {
    const next = new Set(options);
    if (next.has(opt)) { next.delete(opt); }
    else { if (opt === "fullGeneration") next.clear(); else next.delete("fullGeneration"); next.add(opt); }
    setOptions(next);
  };

  const handleStyleSelect = (style: Style) => {
    if (selectedStyle?.id === style.id) {
      setSelectedStyle(null);
      setClothing(null); setMood(null); setStyleBg(null); setAccessory(null);
    } else {
      setSelectedStyle(style);
    }
  };

  const simulateProgress = () => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 95) { clearInterval(iv); p = 95; }
      setGenProgress(Math.min(p, 95));
    }, 500);
    return iv;
  };

  const handleGenerate = async () => {
    setError(null);
    if (!consent) { setError("Veuillez accepter les conditions."); return; }

    const formData = new FormData();

    if (genType === "create") {
      if (!styleFile) { setError("Veuillez uploader une photo."); return; }
      if (!selectedStyle && !freePrompt.trim()) { setError("Veuillez choisir un style ou entrer une description."); return; }
      const enriched = buildEnrichedPrompt(selectedStyle, clothing, mood, styleBg, accessory);
      formData.append("image", await resizeImageFile(styleFile));
      if (selectedStyle) {
        formData.append("style_id",    selectedStyle.id);
        formData.append("style_label", selectedStyle.label);
      }
      if (enriched)             formData.append("style_prompt", enriched);
      if (freePrompt.trim())    formData.append("custom_prompt", freePrompt.trim());
      formData.append("mode", "style");
    } else if (genType === "swapface") {
      if (!swapSrcFile) { setError("Veuillez uploader votre visage source."); return; }
      if (!swapTgtFile) { setError("Veuillez uploader la photo cible."); return; }
      formData.append("source_image", await resizeImageFile(swapSrcFile));
      formData.append("target_image", await resizeImageFile(swapTgtFile));
      formData.append("face_index",   faceIndex);
      if (swapExtraPrompt) formData.append("extra_prompt", swapExtraPrompt);
      formData.append("mode", "swapface");
    } else if (genType === "video") {
      if (!videoFile)   { setError("Veuillez uploader une vidéo."); return; }
      if (!videoPrompt) { setError("Veuillez entrer un prompt."); return; }
      formData.append("video",          videoFile);
      formData.append("prompt",         videoPrompt);
      formData.append("object_options", JSON.stringify([...videoObjectOptions]));
      formData.append("mode",           "video");
    }

    setIsGenerating(true);
    setGenProgress(0);
    const iv = simulateProgress();

    try {
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      clearInterval(iv);
      setGenProgress(100);

      if (res.status === 402) { setIsGenerating(false); setShowPaywall(true); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erreur lors de la génération"); }

      const data = await res.json();
      if (data.generation_id) {
        toast.success("Génération terminée !");
        setTimeout(() => router.push(`/result?id=${data.generation_id}`), 400);
      }
    } catch (err: unknown) {
      clearInterval(iv);
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const userInitial = userEmail?.[0]?.toUpperCase() ?? "?";

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background flex overflow-hidden">

      {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
      <aside className="w-72 xl:w-80 shrink-0 border-r border-surface-border flex flex-col sticky top-0 h-screen bg-background/70 backdrop-blur-xl">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface-border flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-violet-neon rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">
            Celeb<span className="gradient-text">Swap</span>
          </span>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-surface-border">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-hover">
            <div className="w-10 h-10 rounded-xl bg-gradient-violet-neon flex items-center justify-center text-white font-black text-base flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{userEmail?.split("@")[0] ?? "—"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Zap className="w-3 h-3 text-accent-violet" />
                <span className="text-accent-violet text-xs font-bold">{stats?.credits ?? "—"}</span>
                <span className="text-white/30 text-xs">crédits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
          {NAV_ITEMS.map(item => (
            <NavButton
              key={item.id}
              item={item}
              active={navView === item.id}
              onClick={() => setNavView(item.id)}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-surface-border space-y-3">
          {/* Credits bar */}
          <div className="px-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/40">Crédits restants</span>
              <span className="text-accent-violet font-bold">{stats?.credits ?? 0} / 2500</span>
            </div>
            <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((stats?.credits ?? 0) / 2500) * 100, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-violet-neon rounded-full"
              />
            </div>
          </div>

          {userEmail === "gnemmialex@gmail.com" && (
            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-accent-violet border border-accent-violet/30 hover:bg-accent-violet/10 transition-all text-sm font-semibold"
            >
              <Settings className="w-4 h-4" />
              Espace Admin
            </Link>
          )}

          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/40 hover:text-red-400 border border-surface-border hover:border-red-500/30 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </motion.button>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden relative"
        style={{ backgroundImage: "url('/paysage.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px] pointer-events-none z-0" />

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="px-6 lg:px-8">
            <AnimatePresence mode="wait">

              {/* ══ CREATE VIEW ══ */}
              {navView === "create" && (
                <motion.div key={`create-${genType}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

                  {/* Progress overlay */}
                  {isGenerating && (
                    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="bg-surface border border-surface-border rounded-3xl p-8 w-80 text-center shadow-2xl">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-14 h-14 rounded-full border-2 border-accent-violet/30 border-t-accent-violet mx-auto mb-5" />
                        <p className="font-bold text-white mb-1">Génération en cours…</p>
                        <p className="text-white/40 text-sm mb-4">Merci de patienter</p>
                        <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                          <motion.div className="h-full bg-gradient-violet-neon rounded-full" animate={{ width: `${genProgress}%` }} transition={{ ease: "easeOut", duration: 0.4 }} />
                        </div>
                        <p className="text-accent-violet text-xs font-bold mt-2">{Math.round(genProgress)}%</p>
                      </div>
                    </div>
                  )}

                  {/* ── Gen type tabs — centred, avec espace au-dessus ── */}
                  <div className="pt-10 pb-6 flex justify-center">
                    <div className="flex gap-2 p-1 bg-surface/60 backdrop-blur-xl border border-surface-border rounded-2xl">
                      {GEN_TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = genType === tab.id;
                        return (
                          <motion.button
                            key={tab.id}
                            onClick={() => { setGenType(tab.id); setError(null); }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all overflow-hidden ${
                              active ? "bg-accent-violet text-white shadow-violet" : "text-white/45 hover:text-white"
                            }`}
                          >
                            {active && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ["-120%", "220%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                              />
                            )}
                            <Icon className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Forms — compacts, centrés, glass ── */}
                  <div className="max-w-4xl mx-auto pb-10">

                  {/* ── CRÉER (Style IA + Image IA fusionnés) ── */}
                  {genType === "create" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Col gauche — upload */}
                      <div className="lg:col-span-1">
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <StepBadge n={1} />Votre photo
                          </h2>
                          <UploadBox
                            onFileSelected={(f,p)=>{setStyleFile(f);setStylePreview(p);setError(null);}}
                            onClear={()=>{setStyleFile(null);setStylePreview(null);}}
                            preview={stylePreview}
                            label="Photo de visage"
                          />
                          <p className="text-white/30 text-xs mt-2">💡 Visage bien visible.</p>
                        </div>
                      </div>

                      {/* Col droite — style + options + prompt + generate */}
                      <div className="lg:col-span-2 space-y-4">

                        {/* Style Celebrity — optionnel */}
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-sm flex items-center gap-2">
                              <StepBadge n={2} />
                              Style Celebrity
                              <span className="text-white/30 text-[10px] font-normal">(optionnel)</span>
                            </h2>
                            {selectedStyle && (
                              <span className="text-[10px] font-semibold text-accent-violet bg-accent-violet/10 border border-accent-violet/30 px-2 py-0.5 rounded-full">
                                {selectedStyle.emoji} {selectedStyle.label}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {STYLES.map(style => {
                              const isSelected = selectedStyle?.id === style.id;
                              return (
                                <button
                                  key={style.id}
                                  onClick={() => handleStyleSelect(style)}
                                  className={`relative rounded-xl border text-left transition-all overflow-hidden ${
                                    isSelected ? "border-accent-violet" : "border-surface-border bg-surface hover:border-accent-violet/40"
                                  }`}
                                >
                                  {style.previewImg && (
                                    <div className="w-full h-12 overflow-hidden bg-surface-hover relative">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={style.previewImg} alt={style.label} className="w-full h-full object-cover"
                                        onError={e=>{(e.currentTarget.parentElement as HTMLElement).style.display="none";}} />
                                      {isSelected && <div className="absolute inset-0 bg-accent-violet/20" />}
                                    </div>
                                  )}
                                  <div className={`px-2 py-1.5 ${isSelected ? "bg-accent-violet/10" : ""}`}>
                                    {isSelected && (
                                      <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-accent-violet rounded-full flex items-center justify-center z-10">
                                        <span className="text-white text-[8px]">✓</span>
                                      </div>
                                    )}
                                    <span className="text-sm block">{style.emoji}</span>
                                    <p className="font-semibold text-[10px] text-white leading-tight">{style.label}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Personnalisation — visible uniquement si style sélectionné */}
                        <AnimatePresence>
                          {selectedStyle && (
                            <motion.div
                              key="refinement"
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.18 }}
                              className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4 space-y-3"
                            >
                              <h2 className="font-semibold text-sm flex items-center gap-2">
                                <StepBadge n={3} />
                                Personnaliser
                                <span className="text-white/30 text-[10px] font-normal">(optionnel)</span>
                              </h2>
                              <DashOptionChips title="Vêtements"    options={CLOTHING_OPTIONS}   selected={clothing}  onSelect={setClothing} />
                              <DashOptionChips title="Ambiance"     options={MOOD_OPTIONS}        selected={mood}      onSelect={setMood} />
                              <DashOptionChips title="Décor / Fond" options={BACKGROUND_OPTIONS}  selected={styleBg}   onSelect={setStyleBg} />
                              <DashOptionChips title="Accessoires"  options={ACCESSORY_OPTIONS}   selected={accessory} onSelect={setAccessory} />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Description libre */}
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <StepBadge n={selectedStyle ? 4 : 3} />
                            Description libre
                            {selectedStyle
                              ? <span className="text-white/30 text-[10px] font-normal">(optionnel)</span>
                              : <span className="text-red-400/50 text-[10px] font-normal">(requis sans style)</span>
                            }
                          </h2>
                          <textarea
                            value={freePrompt}
                            onChange={e => setFreePrompt(e.target.value)}
                            placeholder={selectedStyle
                              ? "Ajoutez des détails : expression, lumière, couleur de cheveux…"
                              : "Décrivez la transformation souhaitée : tenue, ambiance, fond, lumière…"
                            }
                            rows={2}
                            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none"
                          />
                        </div>

                        <GenerateCard
                          consent={consent}
                          setConsent={setConsent}
                          error={error}
                          onGenerate={handleGenerate}
                          canGenerate={!!(styleFile && (selectedStyle || freePrompt.trim()) && consent)}
                          credits={100}
                          step={selectedStyle ? 5 : 4}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── SWAPFACE ── */}
                  {genType === "swapface" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><StepBadge n={1} />Photos</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-white/60 mb-2">Votre visage <span className="text-accent-violet">*</span></p>
                              <UploadBox onFileSelected={(f,p)=>{setSwapSrcFile(f);setSwapSrcPreview(p);}} onClear={()=>{setSwapSrcFile(null);setSwapSrcPreview(null);}} preview={swapSrcPreview} label="Visage source" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white/60 mb-2">Photo cible <span className="text-accent-violet">*</span></p>
                              <UploadBox onFileSelected={(f,p)=>{setSwapTgtFile(f);setSwapTgtPreview(p);}} onClear={()=>{setSwapTgtFile(null);setSwapTgtPreview(null);}} preview={swapTgtPreview} label="Photo cible" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4 space-y-3">
                          <h2 className="font-semibold text-sm flex items-center gap-2"><StepBadge n={2} />Options</h2>
                          <div className="flex gap-2">
                            {[{v:"auto",l:"Auto"},{v:"0",l:"Visage 1"},{v:"1",l:"Visage 2"}].map(o=>(
                              <button key={o.v} onClick={()=>setFaceIndex(o.v as "0"|"1"|"auto")}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all ${faceIndex===o.v?"bg-accent-violet/15 border-accent-violet text-white":"border-surface-border text-white/50 hover:border-accent-violet/40"}`}>
                                {o.l}
                              </button>
                            ))}
                          </div>
                          <textarea value={swapExtraPrompt} onChange={e=>setSwapExtraPrompt(e.target.value)}
                            placeholder="Infos supplémentaires…" rows={2}
                            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none" />
                        </div>
                      </div>
                      <div className="lg:col-span-1">
                        <GenerateCard consent={consent} setConsent={setConsent} error={error} onGenerate={handleGenerate} canGenerate={!!(swapSrcFile && swapTgtFile && consent)} credits={120} step={3} />
                      </div>
                    </div>
                  )}

                  {/* ── VIDEO IA ── */}
                  {genType === "video" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><StepBadge n={1} />Votre vidéo</h2>
                          <VideoUploadBox onFileSelected={(f,p)=>{setVideoFile(f);setVideoPreview(p);}} onClear={()=>{setVideoFile(null);setVideoPreview(null);}} preview={videoPreview} label="Vidéo à transformer" />
                        </div>
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><StepBadge n={2} />Prompt</h2>
                          <textarea value={videoPrompt} onChange={e=>setVideoPrompt(e.target.value)}
                            placeholder="Décrivez la transformation souhaitée…" rows={3}
                            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none" />
                        </div>
                        <div className="bg-surface/70 backdrop-blur-xl border border-surface-border rounded-2xl p-4">
                          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><StepBadge n={3} />Modifier un objet <span className="text-white/30 text-xs font-normal">(optionnel)</span></h2>
                          <div className="space-y-2">
                            {([
                              {id:"addObject" as ObjectOption, icon:PlusCircle, label:"Ajouter un objet", desc:"Insère dans la vidéo"},
                              {id:"replaceObject" as ObjectOption, icon:Replace, label:"Remplacer un objet", desc:"Frame par frame"},
                            ]).map(({id,icon:Icon,label,desc})=>{
                              const checked = videoObjectOptions.has(id);
                              return (
                                <button key={id} onClick={()=>toggleObjectOption(videoObjectOptions,setVideoObjectOptions,id)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${checked?"bg-accent-violet/15 border-accent-violet":"border-surface-border hover:border-accent-violet/40 hover:bg-surface-hover"}`}>
                                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${checked?"bg-accent-violet border-accent-violet":"border-surface-border"}`}>
                                    {checked&&<span className="text-white text-[10px]">✓</span>}
                                  </div>
                                  <Icon className={`w-4 h-4 flex-shrink-0 ${checked?"text-accent-violet":"text-white/40"}`} />
                                  <div>
                                    <p className={`text-xs font-semibold ${checked?"text-white":"text-white/70"}`}>{label}</p>
                                    <p className="text-white/35 text-xs">{desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-1">
                        <GenerateCard consent={consent} setConsent={setConsent} error={error} onGenerate={handleGenerate} canGenerate={!!(videoFile && videoPrompt && consent)} credits={150} step={4} />
                      </div>
                    </div>
                  )}

                  </div>{/* end max-w-4xl */}
                </motion.div>
              )}

              {/* ══ HISTORY VIEW ══ */}
              {navView === "history" && (
                <motion.div key="history" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="mb-7 pt-8">
                    <h1 className="text-3xl font-black mb-1">Historique</h1>
                    <p className="text-white/40">{generations.length} création{generations.length!==1?"s":""}</p>
                  </div>
                  {generations.length === 0 ? (
                    <div className="text-center py-24 card">
                      <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-4" />
                      <p className="text-white/50 font-semibold mb-2">Aucune création</p>
                      <p className="text-white/30 text-sm mb-5">Lance ta première génération</p>
                      <button onClick={()=>setNavView("create")} className="btn-primary inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />Créer maintenant
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {generations.map((gen,i)=>(
                        <motion.div key={gen.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:i*0.04}}
                          className="group relative rounded-xl overflow-hidden border border-surface-border hover:border-accent-violet/40 transition-all">
                          <div className="aspect-square relative">
                            <Image src={gen.output_image_url} alt={gen.style} fill className="object-cover" />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                            <Link href={`/result?id=${gen.id}`} className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20">
                              <Sparkles className="w-3.5 h-3.5" />
                            </Link>
                            <button onClick={()=>handleDownload(gen.output_image_url,gen.id)} className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={()=>handleDelete(gen.id)} disabled={deletingId===gen.id} className="w-8 h-8 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-red-400 border border-red-500/20">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                            <p className="text-white text-xs font-medium truncate">{gen.style}</p>
                            <p className="text-white/50 text-xs">{new Date(gen.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══ SUBSCRIPTION VIEW ══ */}
              {navView === "subscription" && (
                <motion.div key="subscription" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="mb-7 pt-8">
                    <h1 className="text-3xl font-black mb-1">Formules</h1>
                    <p className="text-white/40">Choisissez l&apos;abonnement qui vous correspond</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                    {PLANS_DATA.map((plan,i)=>{
                      const Icon = plan.icon;
                      return (
                        <motion.div key={plan.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
                          className={`card border ${plan.color} relative flex flex-col`}>
                          {plan.badge && (
                            <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${plan.badgeBg} ${plan.badgeText} border border-current`}>{plan.badge}</span>
                          )}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl ${plan.badgeBg} flex items-center justify-center ${plan.badgeText}`}><Icon className="w-5 h-5" /></div>
                            <div>
                              <p className="font-bold">{plan.name}</p>
                              <p className={`text-xs ${plan.badgeText}`}>{plan.credits} crédits/mois</p>
                            </div>
                          </div>
                          <p className="text-3xl font-black mb-5">{plan.price}<span className="text-sm font-normal text-white/40">/mois</span></p>
                          <ul className="space-y-2 mb-6 flex-1">
                            {plan.features.map(f=>(
                              <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                                <Check className="w-4 h-4 text-accent-violet flex-shrink-0" />{f}
                              </li>
                            ))}
                          </ul>
                          <Link href="/pricing" className="btn-primary text-center w-full">Choisir {plan.name}</Link>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="card flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-violet/10 rounded-xl flex items-center justify-center text-accent-violet">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/50 text-sm">Crédits restants</p>
                      <p className="text-2xl font-black text-accent-violet">{stats?.credits ?? 0}</p>
                    </div>
                    <Link href="/pricing" className="btn-ghost flex items-center gap-1 text-sm">
                      <Plus className="w-4 h-4" />Recharger
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ══ SETTINGS VIEW ══ */}
              {navView === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="mb-7 pt-8">
                    <h1 className="text-3xl font-black mb-1">Paramètres</h1>
                    <p className="text-white/40">Gérez votre compte</p>
                  </div>
                  <div className="max-w-md space-y-4">
                    <div className="card space-y-4">
                      <h2 className="font-bold">Informations du compte</h2>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-violet-neon flex items-center justify-center text-white text-xl font-black">{userInitial}</div>
                        <div>
                          <p className="font-semibold">{userEmail ?? "—"}</p>
                          <p className="text-white/40 text-sm">
                            Membre depuis {stats?.member_since ? new Date(stats.member_since).toLocaleDateString("fr-FR",{month:"long",year:"numeric"}) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="card space-y-3">
                      <h2 className="font-bold">Statistiques</h2>
                      <div className="flex justify-between py-2 border-b border-surface-border">
                        <span className="text-white/50 text-sm">Générations totales</span>
                        <span className="font-bold">{stats?.total_generations ?? generations.length}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-white/50 text-sm">Crédits restants</span>
                        <span className="font-bold text-accent-violet">{stats?.credits ?? 0}</span>
                      </div>
                    </div>
                    <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}} onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
                      <LogOut className="w-4 h-4" />Se déconnecter
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </main>

      <PaywallModal isOpen={showPaywall} onClose={()=>setShowPaywall(false)} reason="Crédits épuisés — Rechargez pour continuer" />
      <LiveNotification />
    </div>
  );
}

/* ─── Small helpers ─────────────────────────────────────── */
function StepBadge({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {n}
    </span>
  );
}

function GenerateCard({
  consent, setConsent, error, onGenerate, canGenerate, credits, step,
}: {
  consent: boolean;
  setConsent: (v: boolean) => void;
  error: string | null;
  onGenerate: () => void;
  canGenerate: boolean;
  credits: number;
  step: number;
}) {
  return (
    <div className="card">
      <h2 className="font-bold text-base mb-4 flex items-center gap-2">
        <StepBadge n={step} />Générer
      </h2>

      <label className="flex items-start gap-3 cursor-pointer group mb-5">
        <div className="relative mt-0.5 flex-shrink-0">
          <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="sr-only" />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${consent?"bg-accent-violet border-accent-violet":"border-surface-border group-hover:border-accent-violet/50"}`}>
            {consent && <span className="text-white text-xs">✓</span>}
          </div>
        </div>
        <span className="text-white/55 text-sm leading-relaxed">
          Je confirme avoir le droit d&apos;utiliser ces médias et j&apos;accepte les{" "}
          <a href="/terms" className="text-accent-violet hover:underline">conditions d&apos;utilisation</a>.
        </span>
      </label>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      <motion.button
        onClick={onGenerate}
        disabled={!canGenerate}
        whileHover={canGenerate ? { scale: 1.02 } : {}}
        whileTap={canGenerate ? { scale: 0.97 } : {}}
        className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {canGenerate && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
          />
        )}
        <Sparkles className="w-5 h-5 relative z-10" />
        <span className="relative z-10">Générer Ultra HD — {credits} crédits</span>
      </motion.button>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/25 flex-wrap">
        <span>🔒 Supprimé après traitement</span>
        <span>⚡ ~30s</span>
        <span>📐 4K</span>
      </div>
    </div>
  );
}
