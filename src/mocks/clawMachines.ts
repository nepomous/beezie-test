import Box500Icon from "../assets/icons/500_box_icon.svg";
import Box30Icon from "../assets/icons/30_box_icon.svg";
import BlackBallIcon from "../assets/icons/black_ball_icon.svg";
import WhiteBallIcon from "../assets/icons/white_ball_icon.svg";
import type { ClawItem, ClawMachine, OddsTier, SvgIcon } from "../types/claw";

/**
 * Lightweight shape used for the "More Claw Machines" list, where only
 * enough data to render a preview card/link is needed.
 */
export interface ClawMachineSummary {
  id: string;
  slug: string;
  name: string;
  heroImageUrl: string;
  iconAsset: SvgIcon;
  pricePerPull: number;
  averageValue: number;
  inStock: boolean;
}

const BASE_PRICE_PER_PULL = 100;

/**
 * Odds table anchored to a $100 pull (TCG Silver). Percentages are the same
 * across every machine; value ranges scale linearly with `pricePerPull` via
 * `deriveOddsTable()`.
 */
const baseOddsTable: OddsTier[] = [
  {
    rarity: "ultra-rare",
    label: "Ultra-Rare",
    chancePercent: 0.2,
    valueRangeMin: 1600.2,
    valueRangeMax: null,
  },
  {
    rarity: "rare",
    label: "Rare",
    chancePercent: 0.72,
    valueRangeMin: 1000.2,
    valueRangeMax: 1600,
  },
  {
    rarity: "uncommon",
    label: "Uncommon",
    chancePercent: 3.48,
    valueRangeMin: 300.2,
    valueRangeMax: 1000,
  },
  {
    rarity: "common",
    label: "Common",
    chancePercent: 21.08,
    valueRangeMin: 100.2,
    valueRangeMax: 300,
  },
  {
    rarity: "base",
    label: "Base",
    chancePercent: 74.52,
    valueRangeMin: 50,
    valueRangeMax: 100,
  },
];

function scaleValue(value: number, scale: number): number {
  return Math.round(value * scale * 100) / 100;
}

/** Derives a machine's odds table by scaling the $100-pull base table's value ranges. */
function deriveOddsTable(pricePerPull: number): OddsTier[] {
  const scale = pricePerPull / BASE_PRICE_PER_PULL;
  return baseOddsTable.map((tier) => ({
    ...tier,
    valueRangeMin: scaleValue(tier.valueRangeMin, scale),
    valueRangeMax:
      tier.valueRangeMax === null
        ? null
        : scaleValue(tier.valueRangeMax, scale),
  }));
}

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
  slug: "pokemon-gold",
  name: "Pokémon Gold Claw",
  description:
    "Every pull is a statement piece, every grail secured with Brink's and tokenized on Beezie.",
  heroImageUrl:
    "https://placehold.co/800x800/0d0d0d/F5C518.png?text=Pok%C3%A9mon+Gold+Claw",
  iconAsset: Box500Icon,
  videoOpeningUrl: "/assets/videos/claw-opening.mp4",
  pricePerPull: 500,
  pointsPerPull: 500,
  averageValue: 505,
  inStock: true,
  odds: deriveOddsTable(500),
  itemPool: pokemonGoldItemPool,
};

export const tcgPlatinumClaw: ClawMachine = {
  id: "tcg-platinum-claw",
  slug: "tcg-platinum",
  name: "TCG Platinum",
  description:
    "Platinum-tier slabs only. Every pull is graded, vaulted and ready to trade the moment it lands.",
  heroImageUrl:
    "https://placehold.co/800x800/0d0d0d/F5C518.png?text=TCG+Platinum",
  iconAsset: WhiteBallIcon,
  videoOpeningUrl: "/assets/videos/claw-opening.mp4",
  pricePerPull: 500,
  pointsPerPull: 500,
  averageValue: 512,
  inStock: true,
  odds: deriveOddsTable(500),
  itemPool: pokemonGoldItemPool,
};

export const tcgSilverClaw: ClawMachine = {
  id: "tcg-silver-claw",
  slug: "tcg-silver",
  name: "TCG Silver",
  description:
    "The everyday claw. Lower stakes, same vault, same instant swap the second you reveal.",
  heroImageUrl:
    "https://placehold.co/800x800/0d0d0d/F5C518.png?text=TCG+Silver",
  iconAsset: BlackBallIcon,
  videoOpeningUrl: "/assets/videos/claw-opening.mp4",
  pricePerPull: 100,
  pointsPerPull: 100,
  averageValue: 102,
  inStock: true,
  odds: deriveOddsTable(100),
  itemPool: pokemonGoldItemPool,
};

export const wildcardClaw: ClawMachine = {
  id: "wildcard-claw",
  slug: "wildcard",
  name: "Wildcard",
  description:
    "Thirty dollars, one pull, no idea what comes out. Restocks the moment it empties.",
  heroImageUrl: "https://placehold.co/800x800/0d0d0d/F5C518.png?text=Wildcard",
  iconAsset: Box30Icon,
  videoOpeningUrl: "/assets/videos/claw-opening.mp4",
  pricePerPull: 30,
  pointsPerPull: 30,
  averageValue: 31,
  inStock: false,
  odds: deriveOddsTable(30),
  itemPool: pokemonGoldItemPool,
};

export const clawMachines: ClawMachine[] = [
  pokemonGoldClaw,
  tcgPlatinumClaw,
  tcgSilverClaw,
  wildcardClaw,
];

function toSummary(machine: ClawMachine): ClawMachineSummary {
  return {
    id: machine.id,
    slug: machine.slug,
    name: machine.name,
    heroImageUrl: machine.heroImageUrl,
    iconAsset: machine.iconAsset,
    pricePerPull: machine.pricePerPull,
    averageValue: machine.averageValue,
    inStock: machine.inStock,
  };
}

export function getClawMachineById(id: string): ClawMachine | undefined {
  return clawMachines.find((machine) => machine.id === id);
}

/** Looks up a machine by its URL `slug` (e.g. "pokemon-gold") — distinct from `id`. */
export function getClawMachineBySlug(slug: string): ClawMachine | undefined {
  return clawMachines.find((machine) => machine.slug === slug);
}

/** Preview list for "More Claw Machines", derived from `clawMachines` (excludes `excludeId`). */
export function getMoreClawMachines(
  excludeId: string = pokemonGoldClaw.id,
): ClawMachineSummary[] {
  return clawMachines
    .filter((machine) => machine.id !== excludeId)
    .map(toSummary);
}
