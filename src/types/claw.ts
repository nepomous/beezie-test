export type Rarity = "ultra-rare" | "rare" | "uncommon" | "common" | "base";

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
  fairMarketValue: number; // usado como "Swap Value"
  rarity: Rarity;
}

export interface ClawMachine {
  id: string;
  name: string; // "Pokémon Gold Claw"
  description: string;
  heroImageUrl: string;
  videoOpeningUrl: string; // asset local ou remoto
  pricePerPull: number;
  pointsPerPull: number;
  averageValue: number;
  odds: OddsTier[];
  itemPool: ClawItem[]; // usado para sortear + para "Top Items"
}

export interface RecentPull {
  id: string;
  item: ClawItem;
  userDisplayName: string;
  paidValue: number; // "$100" mostrado na lista
  timestamp: string;
}

export interface Wallet {
  beezieBalance: number;
  externalBalance: number;
}

export interface PullResult {
  pullId: string;
  items: ClawItem[]; // 1 ou N
  expiresAt: number; // epoch ms — usado no countdown
}

export type PaymentMethod =
  | "beezie-wallet"
  | "external-wallet"
  | "credit-debit";
