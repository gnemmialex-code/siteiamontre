"use client";

import { motion } from "framer-motion";
import { Check, Pen } from "lucide-react";
import { useState, useEffect } from "react";

function useIsPointerDevice() {
  const [isPointer, setIsPointer] = useState(false);
  useEffect(() => {
    setIsPointer(window.matchMedia("(hover: hover)").matches);
  }, []);
  return isPointer;
}

export interface Style {
  id: string;
  label: string;
  description: string;
  emoji: string;
  prompt: string;
  tags: string[];
  previewImg?: string;
  tier?: "pro" | "elite";
}

// ─── MARQUES DE MONTRES ──────────────────────────────────────────────────────
// Les 5 marques disponibles. Toutes réservées au plan Pro (tier: "pro").
// 📸 PHOTOS : déposez les visuels d'aperçu dans /public/styles/ avec ces noms
//    de fichier exacts (previewImg). Formats : png/jpg/jpeg/webp.
// 🎲 Chaque marque génère un MODÈLE ALÉATOIRE de sa collection (prompt ci-dessous).
export const STYLES: Style[] = [
  {
    id: "hublot",
    label: "Hublot",
    description: "Modèle aléatoire de la collection Hublot",
    emoji: "⌚",
    prompt: "ultra realistic product photography of a random luxury Hublot wristwatch model from their collection, highly detailed dial and bezel, premium materials, studio lighting, sharp focus, 4k",
    tags: ["Montre", "Luxe"],
    previewImg: "/styles/hublot.png",
    tier: "pro",
  },
  {
    id: "rolex",
    label: "Rolex",
    description: "Modèle aléatoire de la collection Rolex",
    emoji: "⌚",
    prompt: "ultra realistic product photography of a random luxury Rolex wristwatch model from their collection, highly detailed dial and bracelet, premium materials, studio lighting, sharp focus, 4k",
    tags: ["Montre", "Luxe"],
    previewImg: "/styles/rolex.png",
    tier: "pro",
  },
  {
    id: "richard_mille",
    label: "Richard Mille",
    description: "Modèle aléatoire de la collection Richard Mille",
    emoji: "⌚",
    prompt: "ultra realistic product photography of a random luxury Richard Mille wristwatch model from their collection, skeleton tourbillon movement, highly detailed, premium materials, studio lighting, sharp focus, 4k",
    tags: ["Montre", "Luxe"],
    previewImg: "/styles/richardmille.png",
    tier: "pro",
  },
  {
    id: "patek_philippe",
    label: "Patek Philippe",
    description: "Modèle aléatoire de la collection Patek Philippe",
    emoji: "⌚",
    prompt: "ultra realistic product photography of a random luxury Patek Philippe wristwatch model from their collection, highly detailed dial and complications, premium materials, studio lighting, sharp focus, 4k",
    tags: ["Montre", "Luxe"],
    previewImg: "/styles/patekphilippe.png",
    tier: "pro",
  },
  {
    id: "cartier",
    label: "Cartier",
    description: "Modèle aléatoire de la collection Cartier",
    emoji: "⌚",
    prompt: "ultra realistic product photography of a random luxury Cartier wristwatch model from their collection, highly detailed dial and case, premium materials, studio lighting, sharp focus, 4k",
    tags: ["Montre", "Luxe"],
    previewImg: "/styles/cartier.png",
    tier: "pro",
  },
];

interface StyleSelectorProps {
  selected: string | null;
  onSelect: (style: Style) => void;
  customPrompt: string;
  onCustomPromptChange: (v: string) => void;
}

export default function StyleSelector({ selected, onSelect, customPrompt, onCustomPromptChange }: StyleSelectorProps) {
  const isPointerDevice = useIsPointerDevice();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STYLES.map((style, i) => {
          const isSelected = selected === style.id;
          return (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={isPointerDevice ? { scale: 1.05, transition: { duration: 0.15 } } : undefined}
              onClick={() => onSelect(style)}
              className={`
                relative rounded-xl border text-left transition-all duration-200 overflow-hidden
                [@media(hover:hover)]:hover:z-10
                ${isSelected
                  ? "border-accent-violet shadow-violet"
                  : "border-surface-border bg-surface hover:border-accent-violet/40 hover:bg-surface-hover"
                }
              `}
            >
              {/* Image preview */}
              {style.previewImg && (
                <div className="w-full h-20 overflow-hidden bg-surface-hover relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={style.previewImg}
                    alt={style.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                    }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-accent-violet/20" />
                  )}
                </div>
              )}

              <div className={`p-3 ${isSelected ? "bg-accent-violet/10" : ""}`}>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-accent-violet rounded-full flex items-center justify-center z-10">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-xl mb-1 block">{style.emoji}</span>
                <p className="font-semibold text-xs text-white leading-tight mb-0.5">
                  {style.label}
                </p>
                <p className="text-white/40 text-xs leading-tight">{style.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Prompt personnalisé */}
      <div className="border border-surface-border rounded-xl p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <Pen className="w-4 h-4" />
          Prompt personnalisé <span className="text-white/30 text-xs font-normal">(optionnel)</span>
        </p>
        <p className="text-white/30 text-xs mb-3">
          Décris en plus de détails ce que tu veux. S&apos;ajoute au style sélectionné.
        </p>
        <textarea
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="Ex: fond urbain la nuit, vêtements en cuir, éclairage néon bleu, ambiance futuriste..."
          rows={6}
          className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-accent-violet/60 resize-y min-h-[120px]"
        />
      </div>
    </div>
  );
}
