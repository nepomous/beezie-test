import renderer, { act } from "react-test-renderer";

import type { ClawItem } from "../../types/claw";
import { VaultProvider, useVault } from "../VaultContext";

const itemA: ClawItem = {
  id: "item-a",
  name: "Item A",
  imageUrl: "https://example.com/a.png",
  fairMarketValue: 100,
  rarity: "common",
};

const itemB: ClawItem = {
  id: "item-b",
  name: "Item B",
  imageUrl: "https://example.com/b.png",
  fairMarketValue: 200,
  rarity: "rare",
};

function Consumer({
  onReady,
}: {
  onReady: (vault: ReturnType<typeof useVault>) => void;
}) {
  onReady(useVault());
  return null;
}

describe("VaultContext", () => {
  it("accumulates kept items across multiple addKept calls", () => {
    let vault: ReturnType<typeof useVault>;
    act(() => {
      renderer.create(
        <VaultProvider>
          <Consumer onReady={(value) => (vault = value)} />
        </VaultProvider>,
      );
    });

    expect(vault!.keptItems).toEqual([]);

    act(() => {
      vault.addKept([itemA]);
    });
    expect(vault!.keptItems).toEqual([itemA]);

    act(() => {
      vault.addKept([itemB]);
    });
    expect(vault!.keptItems).toEqual([itemA, itemB]);
  });
});
