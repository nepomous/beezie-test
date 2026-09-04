import type { ClawItem, ClawMachine, OddsTier } from "../types/claw";

/**
 * Lightweight shape used for the "More Claw Machines" list, where only
 * enough data to render a preview card/link is needed.
 */
export interface ClawMachineSummary {
  id: string;
  name: string;
  heroImageUrl: string;
  pricePerPull: number;
  averageValue: number;
}

const pokemonGoldOdds: OddsTier[] = [
  {
    rarity: "ultra-rare",
    label: "Ultra-Rare",
    chancePercent: 0.72,
    valueRangeMin: 8001,
    valueRangeMax: null,
  },
  {
    rarity: "rare",
    label: "Rare",
    chancePercent: 4.28,
    valueRangeMin: 2001,
    valueRangeMax: 8000,
  },
  {
    rarity: "uncommon",
    label: "Uncommon",
    chancePercent: 15,
    valueRangeMin: 501,
    valueRangeMax: 2000,
  },
  {
    rarity: "common",
    label: "Common",
    chancePercent: 30,
    valueRangeMin: 101,
    valueRangeMax: 500,
  },
  {
    rarity: "base",
    label: "Base",
    chancePercent: 50,
    valueRangeMin: 1,
    valueRangeMax: 100,
  },
];

const pokemonGoldItemPool: ClawItem[] = [
  {
    id: "item-charizard-prisma-rainbow",
    name: "Charizard Prisma Rainbow #999",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Charizard",
    fairMarketValue: 12000,
    rarity: "ultra-rare",
  },
  {
    id: "item-mewtwo-cosmic-holo",
    name: "Mewtwo Cosmic Holo #001",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Mewtwo",
    fairMarketValue: 9500,
    rarity: "ultra-rare",
  },
  {
    id: "item-blastoise-shadowless-foil",
    name: "Blastoise Shadowless Foil",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Blastoise",
    fairMarketValue: 5200,
    rarity: "rare",
  },
  {
    id: "item-umbreon-moonlit-star",
    name: "Umbreon Moonlit Star",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Umbreon",
    fairMarketValue: 3400,
    rarity: "rare",
  },
  {
    id: "item-pikachu-surfing-vmax",
    name: "Pikachu Surfing VMAX",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Pikachu",
    fairMarketValue: 1200,
    rarity: "uncommon",
  },
  {
    id: "item-gengar-phantom-holo",
    name: "Gengar Phantom Holo",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Gengar",
    fairMarketValue: 900,
    rarity: "uncommon",
  },
  {
    id: "item-lucario-steel-aura",
    name: "Lucario Steel Aura",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Lucario",
    fairMarketValue: 1500,
    rarity: "uncommon",
  },
  {
    id: "item-eevee-community-day",
    name: "Eevee Community Day",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Eevee",
    fairMarketValue: 250,
    rarity: "common",
  },
  {
    id: "item-snorlax-sleepy-holo",
    name: "Snorlax Sleepy Holo",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Snorlax",
    fairMarketValue: 180,
    rarity: "common",
  },
  {
    id: "item-jigglypuff-sing-foil",
    name: "Jigglypuff Sing Foil",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Jigglypuff",
    fairMarketValue: 320,
    rarity: "common",
  },
  {
    id: "item-caterpie-basic",
    name: "Caterpie Basic",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Caterpie",
    fairMarketValue: 15,
    rarity: "base",
  },
  {
    id: "item-rattata-basic",
    name: "Rattata Basic",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Rattata",
    fairMarketValue: 10,
    rarity: "base",
  },
  {
    id: "item-magikarp-splash",
    name: "Magikarp Splash",
    imageUrl: "https://placehold.co/400x560/1a1a1a/F5C518.png?text=Magikarp",
    fairMarketValue: 25,
    rarity: "base",
  },
];

export const pokemonGoldClaw: ClawMachine = {
  id: "pokemon-gold-claw",
  name: "Pokémon Gold Claw",
  description:
    "Uma garra dourada recheada de cards Pokémon raros. Cada puxada garante um item físico, do comum ao ultra-raro.",
  heroImageUrl:
    "https://placehold.co/800x800/0d0d0d/F5C518.png?text=Pok%C3%A9mon+Gold+Claw",
  videoOpeningUrl: "/assets/videos/claw-opening.mp4",
  pricePerPull: 500,
  pointsPerPull: 500,
  averageValue: 420,
  odds: pokemonGoldOdds,
  itemPool: pokemonGoldItemPool,
};

export const clawMachines: ClawMachine[] = [pokemonGoldClaw];

export const moreClawMachines: ClawMachineSummary[] = [
  {
    id: "one-piece-legends-claw",
    name: "One Piece Legends Claw",
    heroImageUrl:
      "https://placehold.co/400x400/0d0d0d/F5C518.png?text=One+Piece+Legends",
    pricePerPull: 150,
    averageValue: 130,
  },
  {
    id: "sneaker-vault-claw",
    name: "Sneaker Vault Claw",
    heroImageUrl:
      "https://placehold.co/400x400/0d0d0d/F5C518.png?text=Sneaker+Vault",
    pricePerPull: 75,
    averageValue: 60,
  },
];

export function getClawMachineById(id: string): ClawMachine | undefined {
  return clawMachines.find((machine) => machine.id === id);
}
