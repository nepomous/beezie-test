import type { FC } from "react";
import type { SvgProps } from "react-native-svg";

export type Rarity = "ultra-rare" | "rare" | "uncommon" | "common" | "base";

/** SVG icon component type, matching the `*.svg` module declaration in `assets.d.ts`. */
export type SvgIcon = FC<SvgProps>;

export interface OddsTier {
  rarity: Rarity;
  label: string; // "Ultra-Rare"
  chancePercent: number; // 0.72
  valueRangeMin: number;
  valueRangeMax: number | null; // null = "8001+"
}

export interface ClawItem {
  id: string;
  name: string;
  imageUrl: string;
  fairMarketValue: number; // used as "Swap Value"
  rarity: Rarity;
}

export interface ClawMachine {
  id: string;
  slug: string; // used in the machine detail URL, e.g. "pokemon-gold" — distinct from `id`
  name: string; // "Pokémon Gold Claw"
  description: string;
  heroImageUrl: string;
  iconAsset: SvgIcon; // machine's own icon, e.g. src/assets/icons/500_box_icon.svg
  videoOpeningUrl: string; // local or remote asset
  pricePerPull: number;
  pointsPerPull: number;
  averageValue: number;
  inStock: boolean;
  odds: OddsTier[];
  itemPool: ClawItem[]; // used for draws and for "Top Items"
}

export interface RecentPull {
  id: string;
  item: ClawItem;
  userDisplayName: string;
  paidValue: number; // "$100" shown in the list
  timestamp: string;
}

export interface Wallet {
  beezieBalance: number;
  externalBalance: number;
}

export interface PullResult {
  pullId: string;
  items: ClawItem[]; // 1 or N
  expiresAt: number; // epoch ms - used for the countdown
}

export type PaymentMethod =
  | "beezie-wallet"
  | "external-wallet"
  | "credit-debit";
