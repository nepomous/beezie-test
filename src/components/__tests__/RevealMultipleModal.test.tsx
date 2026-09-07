import renderer, { act } from "react-test-renderer";

import { WalletProvider } from "../../context/WalletContext";
import { useVault, VaultProvider } from "../../contexts/VaultContext";
import type { ClawItem } from "../../types/claw";
import { calculateSwapPoints } from "../../config/points";
import { RevealMultipleModal } from "../RevealMultipleModal";

const items: ClawItem[] = [
  {
    id: "item-a",
    name: "Item A",
    imageUrl: "https://example.com/a.png",
    fairMarketValue: 100,
    rarity: "common",
  },
  {
    id: "item-b",
    name: "Item B",
    imageUrl: "https://example.com/b.png",
    fairMarketValue: 200,
    rarity: "rare",
  },
];

// Exposes the current vault contents to assertions without duplicating
// VaultProvider's internals.
function VaultSpy({
  onReady,
}: {
  onReady: (vault: ReturnType<typeof useVault>) => void;
}) {
  onReady(useVault());
  return null;
}

function renderModal(
  onClose: () => void = jest.fn(),
  expiresAt: number | null = null,
) {
  let vault: ReturnType<typeof useVault>;
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <WalletProvider>
        <VaultProvider>
          <VaultSpy onReady={(value) => (vault = value)} />
          <RevealMultipleModal
            visible
            items={items}
            expiresAt={expiresAt}
            onClose={onClose}
          />
        </VaultProvider>
      </WalletProvider>,
    );
  });
  return { tree: tree!, getVault: () => vault! };
}

describe("RevealMultipleModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("selects every item by default", () => {
    const { tree } = renderModal();

    // "Clear" (instead of "Select all") only shows once at least one item is selected.
    expect(
      tree.root.findByProps({ testID: "footer-select-all" }).props.children
        .props.children,
    ).toBe("Clear");
    expect(
      tree.root.findByProps({ testID: "select-badge-item-a" }).props
        .accessibilityLabel,
    ).toBe("Deselect Item A");
    expect(
      tree.root.findByProps({ testID: "select-badge-item-b" }).props
        .accessibilityLabel,
    ).toBe("Deselect Item B");
  });

  it("marks all selected items as swapping and clears them once the batch swap resolves", async () => {
    const { tree } = renderModal();

    act(() => {
      tree.root.findByProps({ testID: "footer-swap-button" }).props.onPress();
    });

    expect(
      tree.root.findByProps({ testID: "swap-button-item-a" }).props.disabled,
    ).toBe(true);
    expect(
      tree.root.findByProps({ testID: "swap-button-item-b" }).props.disabled,
    ).toBe(true);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4000);
    });

    expect(
      tree.root.findByProps({ testID: "swap-success-message" }).props.children,
    ).toBe("$300 will be credited to your wallet shortly");
    expect(
      tree.root.findByProps({ testID: "swap-success-points" }).props.children,
    ).toBe(`+${calculateSwapPoints(300)} points`);

    // Every card was swapped, so the grid should now be empty.
    expect(
      tree.root.findAllByProps({ testID: "swap-button-item-a" }).length,
    ).toBe(0);
  });

  it('keeps non-swapping items in the vault and closes when "X" is pressed', () => {
    const onClose = jest.fn();
    const { tree, getVault } = renderModal(onClose);

    act(() => {
      tree.root.findByProps({ testID: "close-button" }).props.onPress();
    });

    expect(getVault().keptItems).toEqual(items);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("auto-expires the countdown and resolves the same way as pressing X", async () => {
    const onClose = jest.fn();
    const expiresAt = Date.now() + 5000;
    const { getVault } = renderModal(onClose, expiresAt);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(6000);
    });

    expect(getVault().keptItems).toEqual(items);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders each card's real item.imageUrl instead of the mocked reward image", () => {
    const { tree } = renderModal();

    const imageA = tree.root.findByProps({ testID: "card-image-item-a" });
    expect(imageA.props.source).toEqual({ uri: items[0].imageUrl });
  });
});
