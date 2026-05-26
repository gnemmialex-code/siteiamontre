"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import UploadBox from "../components/UploadBox";
import VideoUploadBox from "../components/VideoUploadBox";
import StyleSelector, { STYLES, Style } from "../components/StyleSelector";
import Loader from "../components/Loader";
import PaywallModal from "../components/PaywallModal";
import { Sparkles, AlertCircle, Shuffle, ChevronDown, ImageIcon, Film, PlusCircle, Wand2, Replace } from "lucide-react";

const GENERATION_STEPS = [
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

const IMAGE_STEPS = [
  "Analyse de l'image",
  "Interprétation du prompt",
  "Génération IA",
  "Composition",
  "Upscale 4K",
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

type Mode = "style" | "swapface" | "image" | "video";

type ObjectOption = "addObject" | "fullGeneration" | "replaceObject";

export default function UploadPage() {
  const router = useRouter();

  // Mode
  const [mode, setMode] = useState<Mode>("style");

  // Style mode
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  // SwapFace mode
  const [swapSourceFile, setSwapSourceFile] = useState<File | null>(null);
  const [swapSourcePreview, setSwapSourcePreview] = useState<string | null>(null);
  const [swapTargetFile, setSwapTargetFile] = useState<File | null>(null);
  const [swapTargetPreview, setSwapTargetPreview] = useState<string | null>(null);
  const [faceIndex, setFaceIndex] = useState<"0" | "1" | "auto">("auto");
  const [swapExtraPrompt, setSwapExtraPrompt] = useState("");
  const [showSwapPrompt, setShowSwapPrompt] = useState(false);

  // Image mode
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageObjectOptions, setImageObjectOptions] = useState<Set<ObjectOption>>(new Set());

  // Video mode
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoObjectOptions, setVideoObjectOptions] = useState<Set<ObjectOption>>(new Set());

  // Common
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleObjectOption = (
    options: Set<ObjectOption>,
    setOptions: (s: Set<ObjectOption>) => void,
    opt: ObjectOption
  ) => {
    const next = new Set(options);
    if (next.has(opt)) {
      next.delete(opt);
    } else {
      if (opt === "fullGeneration") {
        next.clear();
      } else {
        next.delete("fullGeneration");
      }
      next.add(opt);
    }
    setOptions(next);
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

    if (mode === "style") {
      if (!file) { setError("Veuillez sélectionner une photo."); return; }
      if (!selectedStyle) { setError("Veuillez choisir un style."); return; }
    } else if (mode === "swapface") {
      if (!swapSourceFile) { setError("Veuillez uploader votre visage source."); return; }
      if (!swapTargetFile) { setError("Veuillez uploader la photo cible."); return; }
    } else if (mode === "image") {
      if (!imageObjectOptions.has("fullGeneration") && !imageFile) { setError("Veuillez uploader une image ou activer la génération 100%."); return; }
      if (!imagePrompt) { setError("Veuillez entrer un prompt."); return; }
    } else if (mode === "video") {
      if (!videoFile) { setError("Veuillez uploader une vidéo."); return; }
      if (!videoPrompt) { setError("Veuillez entrer un prompt."); return; }
    }
    if (!consent) { setError("Vous devez accepter les conditions d'utilisation."); return; }

    setIsGenerating(true);
    setCurrentStep(0);
    setProgress(0);

    const steps =
      mode === "style" ? GENERATION_STEPS :
      mode === "swapface" ? SWAPFACE_STEPS :
      mode === "image" ? IMAGE_STEPS :
      VIDEO_STEPS;
    const progressInterval = simulateProgress(steps);

    try {
      const formData = new FormData();

      if (mode === "style") {
        formData.append("image", file!);
        formData.append("style_id", selectedStyle!.id);
        formData.append("style_prompt", selectedStyle!.prompt + (customPrompt ? `, ${customPrompt}` : ""));
        formData.append("style_label", selectedStyle!.label);
        formData.append("mode", "style");
      } else if (mode === "swapface") {
        formData.append("source_image", swapSourceFile!);
        formData.append("target_image", swapTargetFile!);
        formData.append("face_index", faceIndex);
        if (swapExtraPrompt) formData.append("extra_prompt", swapExtraPrompt);
        formData.append("mode", "swapface");
      } else if (mode === "image") {
        if (imageFile) formData.append("image", imageFile);
        formData.append("prompt", imagePrompt);
        formData.append("object_options", JSON.stringify([...imageObjectOptions]));
        formData.append("mode", "image");
      } else if (mode === "video") {
        formData.append("video", videoFile!);
        formData.append("prompt", videoPrompt);
        formData.append("object_options", JSON.stringify([...videoObjectOptions]));
        formData.append("mode", "video");
      } else {

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
    mode === "style" ? GENERATION_STEPS :
    mode === "swapface" ? SWAPFACE_STEPS :
    mode === "image" ? IMAGE_STEPS :
    VIDEO_STEPS;

  const canGenerate =
    mode === "style" ? !!(file && selectedStyle && consent) :
    mode === "swapface" ? !!(swapSourceFile && swapTargetFile && consent) :
    mode === "image" ? !!((imageObjectOptions.has("fullGeneration") || imageFile) && imagePrompt && consent) :
    mode === "video" ? !!(videoFile && videoPrompt && consent) :
    false;

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
            Uploadez votre photo, choisissez un style, et laissez l&apos;IA faire le reste
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex justify-center mb-8"
        >
          <div className="flex flex-wrap gap-1 p-1 bg-surface border border-surface-border rounded-2xl">
            <button
              onClick={() => { setMode("style"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "style" ? "bg-accent-violet text-white shadow-violet" : "text-white/50 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Style IA
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
              onClick={() => { setMode("image"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "image" ? "bg-accent-violet text-white shadow-violet" : "text-white/50 hover:text-white"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Image IA
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

          {/* ── MODE STYLE IA ── */}
          {mode === "style" && (
            <motion.div key="style" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload */}
                <div className="lg:col-span-1">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
                      Votre photo
                    </h2>
                    <UploadBox onFileSelected={(f, p) => { setFile(f); setPreview(p); setError(null); }} onClear={() => { setFile(null); setPreview(null); }} preview={preview} label="Photo de visage" />
                    <div className="mt-4 p-3 bg-surface-hover rounded-xl">
                      <p className="text-white/40 text-xs leading-relaxed">
                        💡 Photo nette, visage bien visible, bonne luminosité.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Style + Generate */}
                <div className="lg:col-span-2 space-y-6">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                      Style Celebrity
                    </h2>
                    <StyleSelector
                      selected={selectedStyle?.id ?? null}
                      onSelect={setSelectedStyle}
                      customPrompt={customPrompt}
                      onCustomPromptChange={setCustomPrompt}
                    />
                  </motion.div>

                  <GenerateCard consent={consent} setConsent={setConsent} error={error} onGenerate={handleGenerate} canGenerate={canGenerate} credits={100} stepNumber={3} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MODE SWAPFACE ── */}
          {mode === "swapface" && (
            <motion.div key="swapface" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Les deux uploads */}
                <div className="lg:col-span-2 space-y-6">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                    <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
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

                  {/* Options */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card space-y-5">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                      Options
                    </h2>

                    {/* Sélection du visage cible */}
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
                        ].map((opt) => (
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

                    {/* Prompt additionnel */}
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
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-surface-border">
                              <p className="text-white/30 text-xs mt-3 mb-2">
                                Donne plus d&apos;infos à l&apos;IA pour affiner le résultat.
                              </p>
                              <textarea
                                value={swapExtraPrompt}
                                onChange={(e) => setSwapExtraPrompt(e.target.value)}
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

                {/* Generate */}
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
                    <GenerateCard consent={consent} setConsent={setConsent} error={error} onGenerate={handleGenerate} canGenerate={canGenerate} credits={100} stepNumber={4} />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          {/* ── MODE IMAGE IA ── */}
          {mode === "image" && (
            <motion.div key="image" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Upload image (masqué en génération 100%) */}
                <div className="lg:col-span-1">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
                      Image de base
                    </h2>
                    {imageObjectOptions.has("fullGeneration") ? (
                      <div className="aspect-square rounded-2xl border-2 border-dashed border-surface-border flex flex-col items-center justify-center text-center p-6 opacity-40">
                        <Wand2 className="w-10 h-10 text-white/30 mb-3" />
                        <p className="text-white/40 text-sm">Non requis en génération 100%</p>
                      </div>
                    ) : (
                      <UploadBox
                        onFileSelected={(f, p) => { setImageFile(f); setImagePreview(p); setError(null); }}
                        onClear={() => { setImageFile(null); setImagePreview(null); }}
                        preview={imagePreview}
                        label="Image de base"
                      />
                    )}
                    <div className="mt-4 p-3 bg-surface-hover rounded-xl">
                      <p className="text-white/40 text-xs leading-relaxed">
                        💡 L&apos;image sur laquelle travailler. Non requis pour la génération 100%.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Prompt + Options + Generate */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Prompt */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                      Prompt
                    </h2>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Décrivez ce que vous souhaitez générer ou modifier…"
                      rows={4}
                      className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none"
                    />
                  </motion.div>

                  {/* Options objet */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
                      Type de transformation <span className="text-white/30 text-xs font-normal ml-1">(optionnel)</span>
                    </h2>
                    <div className="space-y-3">
                      {([
                        { id: "addObject" as ObjectOption, icon: PlusCircle, label: "Ajouter un objet", desc: "Génère et insère un nouvel objet sur l'image existante" },
                        { id: "fullGeneration" as ObjectOption, icon: Wand2, label: "Génération 100%", desc: "Crée une image entièrement depuis le prompt, sans base" },
                        { id: "replaceObject" as ObjectOption, icon: Replace, label: "Remplacer un objet", desc: "Détecte et remplace un élément précis dans l'image" },
                      ] as { id: ObjectOption; icon: React.ElementType; label: string; desc: string }[]).map(({ id, icon: Icon, label, desc }) => {
                        const checked = imageObjectOptions.has(id);
                        const disabled = id !== "fullGeneration" && imageObjectOptions.has("fullGeneration") && !checked;
                        return (
                          <button
                            key={id}
                            onClick={() => toggleObjectOption(imageObjectOptions, setImageObjectOptions, id)}
                            disabled={disabled}
                            className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                              checked
                                ? "bg-accent-violet/15 border-accent-violet"
                                : disabled
                                ? "border-surface-border opacity-30 cursor-not-allowed"
                                : "border-surface-border hover:border-accent-violet/40 hover:bg-surface-hover"
                            }`}
                          >
                            <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                              checked ? "bg-accent-violet border-accent-violet" : "border-surface-border"
                            }`}>
                              {checked && <span className="text-white text-xs">✓</span>}
                            </div>
                            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${checked ? "text-accent-violet" : "text-white/40"}`} />
                            <div>
                              <p className={`text-sm font-semibold ${checked ? "text-white" : "text-white/70"}`}>{label}</p>
                              <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>

                  <GenerateCard consent={consent} setConsent={setConsent} error={error} onGenerate={handleGenerate} canGenerate={canGenerate} credits={80} stepNumber={4} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MODE VIDÉO IA ── */}
          {mode === "video" && (
            <motion.div key="video" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Upload vidéo + Prompt */}
                <div className="lg:col-span-2 space-y-6">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
                      Votre vidéo
                    </h2>
                    <VideoUploadBox
                      onFileSelected={(f, p) => { setVideoFile(f); setVideoPreview(p); setError(null); }}
                      onClear={() => { setVideoFile(null); setVideoPreview(null); }}
                      preview={videoPreview}
                      label="Vidéo à transformer"
                    />
                  </motion.div>

                  {/* Prompt vidéo */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                      Prompt
                    </h2>
                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Décrivez la transformation souhaitée sur la vidéo…"
                      rows={4}
                      className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-none"
                    />
                  </motion.div>

                  {/* Options objet vidéo */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
                      Modifier un objet <span className="text-white/30 text-xs font-normal ml-1">(optionnel)</span>
                    </h2>
                    <div className="space-y-3">
                      {([
                        { id: "addObject" as ObjectOption, icon: PlusCircle, label: "Ajouter un objet", desc: "Insère un nouvel objet dans la vidéo" },
                        { id: "replaceObject" as ObjectOption, icon: Replace, label: "Remplacer un objet", desc: "Remplace un élément précis dans chaque frame de la vidéo" },
                      ] as { id: ObjectOption; icon: React.ElementType; label: string; desc: string }[]).map(({ id, icon: Icon, label, desc }) => {
                        const checked = videoObjectOptions.has(id);
                        return (
                          <button
                            key={id}
                            onClick={() => toggleObjectOption(videoObjectOptions, setVideoObjectOptions, id)}
                            className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                              checked
                                ? "bg-accent-violet/15 border-accent-violet"
                                : "border-surface-border hover:border-accent-violet/40 hover:bg-surface-hover"
                            }`}
                          >
                            <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                              checked ? "bg-accent-violet border-accent-violet" : "border-surface-border"
                            }`}>
                              {checked && <span className="text-white text-xs">✓</span>}
                            </div>
                            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${checked ? "text-accent-violet" : "text-white/40"}`} />
                            <div>
                              <p className={`text-sm font-semibold ${checked ? "text-white" : "text-white/70"}`}>{label}</p>
                              <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>

                {/* Info + Generate */}
                <div className="lg:col-span-1">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <div className="p-4 bg-accent-violet/5 border border-accent-violet/20 rounded-2xl mb-6 text-sm text-white/60 leading-relaxed">
                      <p className="font-semibold text-white mb-1">Comment ça marche ?</p>
                      <ol className="space-y-1 list-decimal list-inside text-xs text-white/50">
                        <li>Upload ta vidéo (MP4, MOV, WebM)</li>
                        <li>Écris ce que tu veux transformer</li>
                        <li>Coche si tu veux modifier un objet</li>
                        <li>L&apos;IA traite chaque frame en HD</li>
                      </ol>
                    </div>
                    <GenerateCard consent={consent} setConsent={setConsent} error={error} onGenerate={handleGenerate} canGenerate={canGenerate} credits={150} stepNumber={4} />
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

function GenerateCard({
  consent, setConsent, error, onGenerate, canGenerate, credits, stepNumber = 3,
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
        <span className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white text-xs font-bold">
          {stepNumber}
        </span>
        Générer
      </h2>

      <label className="flex items-start gap-3 cursor-pointer group mb-6">
        <div className="relative mt-0.5 flex-shrink-0">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="sr-only" />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            consent ? "bg-accent-violet border-accent-violet" : "border-surface-border group-hover:border-accent-violet/50"
          }`}>
            {consent && <span className="text-white text-xs">✓</span>}
          </div>
        </div>
        <span className="text-white/60 text-sm leading-relaxed">
          Je confirme avoir le droit d&apos;utiliser ces photos et j&apos;accepte les{" "}
          <a href="/terms" className="text-accent-violet hover:underline">conditions d&apos;utilisation</a>.
          Usage créatif personnel uniquement.
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
        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
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
