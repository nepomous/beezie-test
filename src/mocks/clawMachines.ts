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
    imageUrl: "https://images.scrydex.com/pokemon/me2pt5-294/large",
    fairMarketValue: 12000,
    rarity: "ultra-rare",
  },
  {
    id: "item-mewtwo-cosmic-holo",
    name: "Mewtwo Cosmic Holo #001",
    imageUrl: "https://images.scrydex.com/pokemon/me2pt5-281/large",
    fairMarketValue: 9500,
    rarity: "ultra-rare",
  },
  {
    id: "item-blastoise-shadowless-foil",
    name: "Blastoise Shadowless Foil",
    imageUrl: "https://images.pokemontcg.io/sv7/30_hires.png",
    fairMarketValue: 5200,
    rarity: "rare",
  },
  {
    id: "item-umbreon-moonlit-star",
    name: "Umbreon Moonlit Star",
    imageUrl: "https://images.pokemontcg.io/sv8pt5/161_hires.png",
    fairMarketValue: 3400,
    rarity: "rare",
  },
  {
    id: "item-pikachu-surfing-vmax",
    name: "Pikachu Surfing VMAX",
    imageUrl: "https://images.pokemontcg.io/swsh11tg/TG29_hires.png",
    fairMarketValue: 1200,
    rarity: "uncommon",
  },
  {
    id: "item-gengar-phantom-holo",
    name: "Gengar Phantom Holo",
    imageUrl: "https://images.scrydex.com/pokemon/me3-50/large",
    fairMarketValue: 900,
    rarity: "uncommon",
  },
  {
    id: "item-lucario-steel-aura",
    name: "Lucario Steel Aura",
    imageUrl: "https://images.scrydex.com/pokemon/me2pt5-113/large",
    fairMarketValue: 1500,
    rarity: "uncommon",
  },
  {
    id: "item-eevee-community-day",
    name: "Eevee Community Day",
    imageUrl: "https://images.pokemontcg.io/sv8pt5/167_hires.png",
    fairMarketValue: 250,
    rarity: "common",
  },
  {
    id: "item-snorlax-sleepy-holo",
    name: "Snorlax Sleepy Holo",
    imageUrl: "https://images.scrydex.com/pokemon/me3-63/large",
    fairMarketValue: 180,
    rarity: "common",
  },
  {
    id: "item-jigglypuff-sing-foil",
    name: "Jigglypuff Sing Foil",
    imageUrl: "https://images.pokemontcg.io/me2/76_hires.png",
    fairMarketValue: 320,
    rarity: "common",
  },
  {
    id: "item-caterpie-basic",
    name: "Caterpie Basic",
    imageUrl: "https://images.pokemontcg.io/sv9/1_hires.png",
    fairMarketValue: 15,
    rarity: "base",
  },
  {
    id: "item-rattata-basic",
    name: "Rattata Basic",
    imageUrl: "https://images.scrydex.com/pokemon/me3-60/large",
    fairMarketValue: 10,
    rarity: "base",
  },
  {
    id: "item-magikarp-splash",
    name: "Magikarp Splash",
    imageUrl: "https://images.pokemontcg.io/sv10/48_hires.png",
    fairMarketValue: 25,
    rarity: "base",
  },
];

export const pokemonGoldClaw: ClawMachine = {
  id: "pokemon-gold-claw",
  name: "Pokémon Gold Claw",
  description:
    "A golden claw machine filled with rare Pokémon cards. Every pull guarantees a physical item, from common to ultra-rare.",
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
    id: "tcg-platinum-claw-1",
    name: "TCG Platinum",
    heroImageUrl:
      "https://placehold.co/400x400/0d0d0d/F5C518.png?text=TCG+Platinum",
    pricePerPull: 500,
    averageValue: 505,
  },
  {
    id: "tcg-platinum-claw-2",
    name: "TCG Platinum",
    heroImageUrl:
      "https://placehold.co/400x400/0d0d0d/F5C518.png?text=TCG+Platinum",
    pricePerPull: 500,
    averageValue: 505,
  },
  {
    id: "wildcard-claw",
    name: "Wildcard",
    heroImageUrl:
      "https://placehold.co/400x400/0d0d0d/F5C518.png?text=Wildcard",
    pricePerPull: 30,
    averageValue: 25,
  },
];

export function getClawMachineById(id: string): ClawMachine | undefined {
  return clawMachines.find((machine) => machine.id === id);
}

export function getMoreClawMachines(): ClawMachineSummary[] {
  return moreClawMachines;
}
