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
  /** Standard project accent yellow — confirmed via Figma dev-mode inspect. */
  gold: "#FFCA28",
  /** ~18% darker than `gold`, used for the "Do Not Refresh" progress fill. */
  goldDark: "#D1A621",
  /** Desaturated/dimmed `gold`, used for disabled gold buttons (e.g. swap-in-progress) so they stay readable as "still a button" against the dark background instead of fading into it. */
  goldMuted: "#BE9C37",
  success: "#4ADE80",
  danger: "#F87171",
  /** Dark outer frame of nested reveal-grid item cards. */
  cardFrame: "#252525",
  /** White inner image box nested inside `cardFrame`. */
  cardSurface: "#FFFFFF",
  /** Unselected state of the item-card selection badge (solid black, no transparency). */
  badgeUnselected: "#000000",
} as const;

interface RarityColor {
  background: string;
  /** Higher-alpha (~35%) tint used as the LinearGradient start color in `OddsTable` — `background` itself is too faint (12%) to read as a visible fade over the near-black screen background. */
  gradientStart: string;
  border: string;
  text: string;
}

/** Accent color per rarity tier, used for the odds table badges. */
export const rarityColors: Record<Rarity, RarityColor> = {
  "ultra-rare": {
    background: "rgba(245, 197, 24, 0.12)",
    gradientStart: "rgba(245, 197, 24, 0.35)",
    border: "#F5C518",
    text: "#F5C518",
  },
  rare: {
    background: "rgba(185, 117, 240, 0.12)",
    gradientStart: "rgba(185, 117, 240, 0.35)",
    border: "#B975F0",
    text: "#B975F0",
  },
  uncommon: {
    background: "rgba(74, 222, 128, 0.12)",
    gradientStart: "rgba(74, 222, 128, 0.35)",
    border: "#4ADE80",
    text: "#4ADE80",
  },
  common: {
    background: "rgba(96, 165, 250, 0.12)",
    gradientStart: "rgba(96, 165, 250, 0.35)",
    border: "#60A5FA",
    text: "#60A5FA",
  },
  base: {
    background: "rgba(156, 163, 175, 0.12)",
    gradientStart: "rgba(156, 163, 175, 0.35)",
    border: "#9CA3AF",
    text: "#9CA3AF",
  },
};
