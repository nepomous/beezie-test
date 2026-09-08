import { pokemonGoldClaw, moreClawMachines } from "../../mocks/clawMachines";
import { recentPulls } from "../../mocks/recentPulls";
import {
  getClawMachine,
  getMoreClawMachines,
  getRecentPulls,
  purchasePull,
} from "../clawService";

describe("clawService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getClawMachine", () => {
    it("returns the matching machine for a valid id", async () => {
      const promise = getClawMachine("pokemon-gold-claw");
      await jest.advanceTimersByTimeAsync(1000);

      await expect(promise).resolves.toEqual(pokemonGoldClaw);
    });

    it("rejects for an id that doesn't exist", async () => {
      const promise = getClawMachine("does-not-exist");
      // Attach the rejection handler before advancing timers so the
      // rejection (which fires while the timer resolves) isn't briefly
      // unhandled.
      const assertion = expect(promise).rejects.toThrow(
        "Claw machine not found: does-not-exist",
      );
      await jest.advanceTimersByTimeAsync(1000);
      await assertion;
    });
  });

  describe("purchasePull", () => {
    it("returns exactly `quantity` items", async () => {
      const promise = purchasePull("pokemon-gold-claw", 25, "beezie-wallet");
      await jest.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result.items).toHaveLength(25);
    });

    it("sets expiresAt to a 15-minute window from the moment the pull resolves", async () => {
      const REVEAL_WINDOW_MS = 15 * 60 * 1000;
      const startTime = new Date("2026-01-01T00:00:00.000Z").getTime();
      jest.setSystemTime(startTime);

      const promise = purchasePull("pokemon-gold-claw", 1, "beezie-wallet");
      await jest.advanceTimersByTimeAsync(1000);
      const result = await promise;

      // randomDelay() resolves 300-600ms after the call, so expiresAt lands
      // that same window past the 15-minute mark from the pull's start time.
      expect(result.expiresAt).toBeGreaterThanOrEqual(
        startTime + 300 + REVEAL_WINDOW_MS,
      );
      expect(result.expiresAt).toBeLessThanOrEqual(
        startTime + 600 + REVEAL_WINDOW_MS,
      );
    });

    it("draws item rarities that approximate the configured odds over many pulls", async () => {
      const SAMPLE_SIZE = 8000;
      const TOLERANCE_PERCENT = 6;

      const promise = purchasePull(
        "pokemon-gold-claw",
        SAMPLE_SIZE,
        "beezie-wallet",
      );
      await jest.advanceTimersByTimeAsync(1000);
      const result = await promise;

      const countsByRarity = new Map<string, number>();
      for (const item of result.items) {
        countsByRarity.set(
          item.rarity,
          (countsByRarity.get(item.rarity) ?? 0) + 1,
        );
      }

      for (const tier of pokemonGoldClaw.odds) {
        const observedPercent =
          ((countsByRarity.get(tier.rarity) ?? 0) / SAMPLE_SIZE) * 100;

        expect(observedPercent).toBeGreaterThanOrEqual(
          tier.chancePercent - TOLERANCE_PERCENT,
        );
        expect(observedPercent).toBeLessThanOrEqual(
          tier.chancePercent + TOLERANCE_PERCENT,
        );
      }
    });
  });

  describe("getRecentPulls", () => {
    it("returns the mocked recent pulls for a known machine id", async () => {
      const promise = getRecentPulls("pokemon-gold-claw");
      await jest.advanceTimersByTimeAsync(1000);

      await expect(promise).resolves.toEqual(recentPulls);
    });

    it("returns an empty array for an unknown machine id", async () => {
      const promise = getRecentPulls("does-not-exist");
      await jest.advanceTimersByTimeAsync(1000);

      await expect(promise).resolves.toEqual([]);
    });
  });

  describe("getMoreClawMachines", () => {
    it("returns the mocked machine summaries", async () => {
      const promise = getMoreClawMachines();
      await jest.advanceTimersByTimeAsync(1000);

      await expect(promise).resolves.toEqual(moreClawMachines);
    });
  });
});
