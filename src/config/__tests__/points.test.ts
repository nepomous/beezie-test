import { calculateSwapPoints, POINTS_PER_DOLLAR_SWAPPED } from "../points";

describe("calculateSwapPoints", () => {
  it("rounds to the nearest whole point for a known value", () => {
    expect(calculateSwapPoints(16.92)).toBe(27);
  });

  it("scales linearly with POINTS_PER_DOLLAR_SWAPPED", () => {
    expect(calculateSwapPoints(100)).toBe(
      Math.round(100 * POINTS_PER_DOLLAR_SWAPPED),
    );
  });

  it("returns 0 for a zero swap value", () => {
    expect(calculateSwapPoints(0)).toBe(0);
  });
});
