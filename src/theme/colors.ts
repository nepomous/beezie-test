import type { Rarity } from "../types/claw";

/**
 * Dark theme color tokens shared across the app (near-black background,
 * gold/yellow accent), matching the Beezie Claw visual reference.
 */
export const colors = {
  background: "#0d0d0d",
  surface: "#161616",
  surfaceAlt: "#1f1f1f",
  border: "#2a2a2a",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  gold: "#F5C518",
  success: "#4ADE80",
  danger: "#F87171",
} as const;

interface RarityColor {
  background: string;
  border: string;
  text: string;
}

/** Accent color per rarity tier, used for the odds table badges. */
export const rarityColors: Record<Rarity, RarityColor> = {
  "ultra-rare": {
    background: "rgba(245, 197, 24, 0.12)",
    border: "#F5C518",
    text: "#F5C518",
  },
  rare: {
    background: "rgba(185, 117, 240, 0.12)",
    border: "#B975F0",
    text: "#B975F0",
  },
  uncommon: {
    background: "rgba(74, 222, 128, 0.12)",
    border: "#4ADE80",
    text: "#4ADE80",
  },
  common: {
    background: "rgba(96, 165, 250, 0.12)",
    border: "#60A5FA",
    text: "#60A5FA",
  },
  base: {
    background: "rgba(156, 163, 175, 0.12)",
    border: "#9CA3AF",
    text: "#9CA3AF",
  },
};
