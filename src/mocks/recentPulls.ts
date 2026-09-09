import { getClawMachineById, pokemonGoldClaw } from "./clawMachines";
import type { ClawItem, RecentPull } from "../types/claw";

interface RecentPullTemplate {
  id: string;
  itemName: string;
  userDisplayName: string;
  timestamp: string;
}

const recentPullTemplates: RecentPullTemplate[] = [
  {
    id: "pull-001",
    itemName: "Blastoise Shadowless Foil",
    userDisplayName: "AshK.",
    timestamp: "2026-09-04T13:42:00.000Z",
  },
  {
    id: "pull-002",
    itemName: "Eevee Community Day",
    userDisplayName: "MistyW.",
    timestamp: "2026-09-04T13:35:00.000Z",
  },
  {
    id: "pull-003",
    itemName: "Pikachu Surfing VMAX",
    userDisplayName: "BrockS.",
    timestamp: "2026-09-04T13:28:00.000Z",
  },
  {
    id: "pull-004",
    itemName: "Caterpie Basic",
    userDisplayName: "GaryO.",
    timestamp: "2026-09-04T13:20:00.000Z",
  },
  {
    id: "pull-005",
    itemName: "Mewtwo Cosmic Holo #001",
    userDisplayName: "RedT.",
    timestamp: "2026-09-04T13:12:00.000Z",
  },
  {
    id: "pull-006",
    itemName: "Jigglypuff Sing Foil",
    userDisplayName: "DawnP.",
    timestamp: "2026-09-04T13:05:00.000Z",
  },
  {
    id: "pull-007",
    itemName: "Lucario Steel Aura",
    userDisplayName: "LeafG.",
    timestamp: "2026-09-04T12:58:00.000Z",
  },
];

function findItemByName(itemPool: ClawItem[], name: string): ClawItem {
  const item = itemPool.find((candidate) => candidate.name === name);
  if (!item) {
    throw new Error(`Mock item not found: ${name}`);
  }
  return item;
}

function buildRecentPulls(itemPool: ClawItem[]): RecentPull[] {
  return recentPullTemplates.map((template) => {
    const item = findItemByName(itemPool, template.itemName);
    return {
      id: template.id,
      item,
      userDisplayName: template.userDisplayName,
      // "Recent Pulls" shows the item's fair market value, not a paid amount.
      paidValue: item.fairMarketValue,
      timestamp: template.timestamp,
    };
  });
}

export const recentPulls: RecentPull[] = buildRecentPulls(
  pokemonGoldClaw.itemPool,
);

/**
 * All 4 machines currently share the same item pool, so the same recent-pull
 * templates (item name, user, paid value) apply to any of them, resolved
 * against that machine's own `itemPool` by name.
 */
export function getRecentPullsByMachineId(machineId: string): RecentPull[] {
  const machine = getClawMachineById(machineId);
  if (!machine) {
    return [];
  }
  return buildRecentPulls(machine.itemPool);
}
