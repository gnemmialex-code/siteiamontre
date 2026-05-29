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

export const STYLES: Style[] = [
  // ── Essentiel (accès tous plans) ─────────────────────────
  {
    id: "hollywood_glamour",
    label: "Hollywood Glamour",
    description: "Lumière dorée, look star de cinéma",
    emoji: "🎬",
    prompt: "hollywood glamour photography, golden hour lighting, film star aesthetic, cinematic portrait, ultra sharp, 4k",
    tags: ["Cinéma", "Glamour"],
    previewImg: "/styles/hollywood_glamour.png",
  },
  {
    id: "vogue_editorial",
    label: "Vogue Editorial",
    description: "Mode haut de gamme, rendu magazine",
    emoji: "📸",
    prompt: "vogue editorial fashion photography, high fashion, luxury aesthetic, professional studio lighting, crisp details",
    tags: ["Mode", "Magazine"],
    previewImg: "/styles/vogue_editorial.png",
  },
  {
    id: "red_carpet",
    label: "Red Carpet",
    description: "Tapis rouge, look événementiel premium",
    emoji: "🌟",
    prompt: "red carpet celebrity event photography, glamorous formal attire, professional event lighting, sharp portrait",
    tags: ["Gala", "Luxe"],
    previewImg: "/styles/red_carpet.png",
  },
  {
    id: "music_video",
    label: "Music Video",
    description: "Clip musical, look artistique",
    emoji: "🎵",
    prompt: "music video aesthetic, artistic lighting, pop star look, vibrant colors, cinematic quality",
    tags: ["Musique", "Artistique"],
    previewImg: "/styles/music_video.png",
  },
  {
    id: "billboard_mag",
    label: "Billboard Magazine",
    description: "Cover de magazine musical",
    emoji: "🎤",
    prompt: "billboard magazine cover portrait, music industry photography, professional studio, editorial quality",
    tags: ["Magazine", "Musique"],
    previewImg: "/styles/billboard_magazine.png",
  },
  {
    id: "met_gala",
    label: "Met Gala",
    description: "Haute couture, look avant-gardiste",
    emoji: "👑",
    prompt: "met gala fashion photography, haute couture, avant-garde fashion, luxury, ultra detailed portrait",
    tags: ["Mode", "Art"],
    previewImg: "/styles/met_gala.png",
  },
  {
    id: "luxury_brand",
    label: "Luxury Brand",
    description: "Campagne publicitaire luxe",
    emoji: "💎",
    prompt: "luxury brand campaign photography, minimalist aesthetic, high-end fashion, perfect lighting, ultra detailed",
    tags: ["Luxe", "Pub"],
    previewImg: "/styles/luxury_brand.png",
  },
  {
    id: "sports_star",
    label: "Sports Star",
    description: "Athlète star, look champion",
    emoji: "⚡",
    prompt: "professional athlete portrait, sports photography, dynamic lighting, champion aesthetic, studio quality",
    tags: ["Sport", "Dynamique"],
    previewImg: "/styles/sports_star.png",
  },

  // ── Pro exclusifs ─────────────────────────────────────────
  {
    id: "Portrait_Pro",
    label: "Protrait Pro",
    description: "Néons, ambiance pro",
    emoji: "👔",
    prompt: "portrait photography, neon lights, black background, dramatic neon lighting, ultra detailed",
    tags: ["Professionnal", "Neon"],
    previewImg: "/styles/portrait_futur.png",
    tier: "pro",
  },
  {
    id: "dubai_luxury",
    label: "Dubai Luxury",
    description: "Skyline luxe, lifestyle haut de gamme",
    emoji: "🏙️",
    prompt: "luxury lifestyle photography in Dubai, premium hotel rooftop, city skyline background, golden sunset, high-end fashion",
    tags: ["Luxe", "Ville"],
    previewImg: "/styles/dubai.png",
    tier: "pro",
  },
  {
    id: "street_style",
    label: "Street Style",
    description: "Look urbain, fashion week off-duty",
    emoji: "🕶️",
    prompt: "street style fashion photography, urban outdoor setting, candid editorial look, natural light, fashion week aesthetic",
    tags: ["Street", "Mode"],
    previewImg: "/styles/street.png",
    tier: "pro",
  },
  {
    id: "celebrity_camera",
    label: "Celbrity Camera",
    description: "Célébrité entourée de paparazzis, look star",
    emoji: "📸",
    prompt: "premium celebrity photography, clean professional backdrop, confident powerful pose, luxury product launch aesthetic",
    tags: ["Celebrity", "Pro"],
    previewImg: "/styles/celebrity_camera.png",
    tier: "pro",
  },
  {
    id: "yacht_club",
    label: "Yacht Club",
    description: "Vie sur mer, élégance nautique",
    emoji: "⛵",
    prompt: "luxury yacht lifestyle photography, Mediterranean sea background, nautical elegance, golden hour sunlight, premium fashion editorial",
    tags: ["Luxe", "Mer"],
    previewImg: "/styles/yacht_person.png",
    tier: "pro",
  },

  // ── Elite exclusifs ───────────────────────────────────────
  {
    id: "armee",
    label: "Armée",
    description: "Look militaire, ambiance de guerre épique",
    emoji: "🪖",
    prompt: "Hollywood movie poster photography, epic cinematic lighting, dramatic hero pose, VFX-quality compositing, IMAX cinematic resolution",
    tags: ["Cinéma", "Épique"],
    previewImg: "/styles/armee.png",
    tier: "elite",
  },
  {
    id: "royal_portrait",
    label: "Royal Portrait",
    description: "Portrait royal, prestance absolue",
    emoji: "👸",
    prompt: "royal formal portrait photography, regal aristocratic setting, opulent interior background, crown jewels aesthetic, old masters painting quality",
    tags: ["Royal", "Art"],
    previewImg: "/styles/royal.png",
    tier: "elite",
  },
  {
    id: "album_cover",
    label: "Album Cover",
    description: "Pochette d'album iconique",
    emoji: "🎶",
    prompt: "iconic album cover art photography, record label quality, bold artistic direction, Grammy-level production, flawless skin, studio perfection",
    tags: ["Musique", "Art"],
    previewImg: "/styles/cover_music.png",
    tier: "elite",
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
