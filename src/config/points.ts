/**
 * Points earned per dollar of swap value credited to the wallet.
 * Adjustable — tune this to change how generous swaps are without touching
 * call sites.
 */
export const POINTS_PER_DOLLAR_SWAPPED = 1.6;

/** Rounds to the nearest whole point, e.g. `calculateSwapPoints(16.92)` -> 27. */
export function calculateSwapPoints(swapValue: number): number {
  return Math.round(swapValue * POINTS_PER_DOLLAR_SWAPPED);
}
