import {
  getClawMachineById,
  getClawMachineBySlug,
  getMoreClawMachines as getMoreClawMachinesMock,
} from "../mocks/clawMachines";
import type { ClawMachineSummary } from "../mocks/clawMachines";
import { getRecentPullsByMachineId } from "../mocks/recentPulls";
import type {
  ClawItem,
  ClawMachine,
  OddsTier,
  PaymentMethod,
  PullResult,
  Rarity,
  RecentPull,
} from "../types/claw";

const REVEAL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes to decide whether to swap or keep

function randomDelay(minMs = 300, maxMs = 600): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Selects a rarity using `chancePercent` weights (normalized to 100%). */
function pickWeightedRarity(odds: OddsTier[]): Rarity {
  const totalWeight = odds.reduce((sum, tier) => sum + tier.chancePercent, 0);
  let roll = Math.random() * totalWeight;

  for (const tier of odds) {
    roll -= tier.chancePercent;
    if (roll <= 0) {
      return tier.rarity;
    }
  }

  return odds[odds.length - 1].rarity;
}

function pickRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Selects an item using the machine odds, falling back to any pool item when needed. */
function drawItem(machine: ClawMachine): ClawItem {
  const rarity = pickWeightedRarity(machine.odds);
  const candidates = machine.itemPool.filter((item) => item.rarity === rarity);
  return pickRandomItem(candidates.length > 0 ? candidates : machine.itemPool);
}

export async function getClawMachine(slug: string): Promise<ClawMachine> {
  await randomDelay();

  const machine = getClawMachineBySlug(slug);
  if (!machine) {
    throw new Error(`Claw machine not found: ${slug}`);
  }

  return machine;
}

export async function getRecentPulls(machineId: string): Promise<RecentPull[]> {
  await randomDelay();
  return getRecentPullsByMachineId(machineId);
}

export async function getMoreClawMachines(
  excludeId?: string,
): Promise<ClawMachineSummary[]> {
  await randomDelay();
  return getMoreClawMachinesMock(excludeId);
}

export async function purchasePull(
  machineId: string,
  quantity: number,
  paymentMethod: PaymentMethod,
): Promise<PullResult> {
  await randomDelay();

  const machine = getClawMachineById(machineId);
  if (!machine) {
    throw new Error(`Claw machine not found: ${machineId}`);
  }
  if (quantity < 1) {
    throw new Error("Pull quantity must be at least 1.");
  }

  const pullId = `pull-${machineId}-${paymentMethod}-${Date.now()}`;

  // Give each draw a unique instance id scoped to this pull — the catalog
  // item id repeats whenever the same item is drawn more than once, which
  // broke per-item selection/swap state (and React list keys) in the reveal
  // modals.
  const items = Array.from({ length: quantity }, (_, index) => {
    const drawn = drawItem(machine);
    return { ...drawn, id: `${pullId}-${drawn.id}-${index}` };
  });

  return {
    pullId,
    items,
    expiresAt: Date.now() + REVEAL_WINDOW_MS,
  };
}
