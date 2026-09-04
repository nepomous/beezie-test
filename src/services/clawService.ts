import { getClawMachineById } from "../mocks/clawMachines";
import { getRecentPullsByMachineId } from "../mocks/recentPulls";
import type {
  ClawItem,
  ClawMachine,
  OddsTier,
  PaymentMethod,
  PullResult,
  Rarity,
  RecentPull,
  Wallet,
} from "../types/claw";

const REVEAL_WINDOW_MS = 15 * 60 * 1000; // 15 minutos para decidir swap/keep

const mockWallet: Wallet = {
  beezieBalance: 2500,
  externalBalance: 1000,
};

function randomDelay(minMs = 300, maxMs = 600): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sorteia uma raridade respeitando os pesos de `chancePercent` (normalizados para 100%). */
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

/** Sorteia um item do pool respeitando as odds da máquina; cai para qualquer item se a raridade sorteada não tiver itens no pool. */
function drawItem(machine: ClawMachine): ClawItem {
  const rarity = pickWeightedRarity(machine.odds);
  const candidates = machine.itemPool.filter((item) => item.rarity === rarity);
  return pickRandomItem(candidates.length > 0 ? candidates : machine.itemPool);
}

export async function getClawMachine(id: string): Promise<ClawMachine> {
  await randomDelay();

  const machine = getClawMachineById(id);
  if (!machine) {
    throw new Error(`Claw machine não encontrada: ${id}`);
  }

  return machine;
}

export async function getRecentPulls(machineId: string): Promise<RecentPull[]> {
  await randomDelay();
  return getRecentPullsByMachineId(machineId);
}

export async function getWallet(): Promise<Wallet> {
  await randomDelay();
  return { ...mockWallet };
}

export async function purchasePull(
  machineId: string,
  quantity: number,
  paymentMethod: PaymentMethod,
): Promise<PullResult> {
  await randomDelay();

  const machine = getClawMachineById(machineId);
  if (!machine) {
    throw new Error(`Claw machine não encontrada: ${machineId}`);
  }
  if (quantity < 1) {
    throw new Error("A quantidade da pull deve ser ao menos 1.");
  }

  const items = Array.from({ length: quantity }, () => drawItem(machine));

  return {
    pullId: `pull-${machineId}-${paymentMethod}-${Date.now()}`,
    items,
    expiresAt: Date.now() + REVEAL_WINDOW_MS,
  };
}
