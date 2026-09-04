import { pokemonGoldClaw } from "./clawMachines";
import type { RecentPull } from "../types/claw";

const itemByName = (name: string) => {
  const item = pokemonGoldClaw.itemPool.find(
    (candidate) => candidate.name === name,
  );
  if (!item) {
    throw new Error(`Item mockado não encontrado: ${name}`);
  }
  return item;
};

export const recentPulls: RecentPull[] = [
  {
    id: "pull-001",
    item: itemByName("Blastoise Shadowless Foil"),
    userDisplayName: "AshK.",
    paidValue: 500,
    timestamp: "2026-09-04T13:42:00.000Z",
  },
  {
    id: "pull-002",
    item: itemByName("Eevee Community Day"),
    userDisplayName: "MistyW.",
    paidValue: 500,
    timestamp: "2026-09-04T13:35:00.000Z",
  },
  {
    id: "pull-003",
    item: itemByName("Pikachu Surfing VMAX"),
    userDisplayName: "BrockS.",
    paidValue: 500,
    timestamp: "2026-09-04T13:28:00.000Z",
  },
  {
    id: "pull-004",
    item: itemByName("Caterpie Basic"),
    userDisplayName: "GaryO.",
    paidValue: 500,
    timestamp: "2026-09-04T13:20:00.000Z",
  },
  {
    id: "pull-005",
    item: itemByName("Mewtwo Cosmic Holo #001"),
    userDisplayName: "RedT.",
    paidValue: 500,
    timestamp: "2026-09-04T13:12:00.000Z",
  },
  {
    id: "pull-006",
    item: itemByName("Jigglypuff Sing Foil"),
    userDisplayName: "DawnP.",
    paidValue: 500,
    timestamp: "2026-09-04T13:05:00.000Z",
  },
  {
    id: "pull-007",
    item: itemByName("Lucario Steel Aura"),
    userDisplayName: "LeafG.",
    paidValue: 500,
    timestamp: "2026-09-04T12:58:00.000Z",
  },
];

export function getRecentPullsByMachineId(machineId: string): RecentPull[] {
  if (machineId !== pokemonGoldClaw.id) {
    return [];
  }
  return recentPulls;
}
