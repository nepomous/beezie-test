import renderer, { act } from "react-test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WalletProvider } from "../../context/WalletContext";
import { useVault, VaultProvider } from "../../contexts/VaultContext";
import type { ClawItem } from "../../types/claw";
import { calculateSwapPoints } from "../../config/points";
import { ItemCard } from "../ItemCard";
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
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 0, height: 0 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
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
        </WalletProvider>
      </SafeAreaProvider>,
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

  it("deselects every item by default", () => {
    const { tree } = renderModal();

    // "Select all" (instead of "Clear") shows while nothing is selected.
    expect(
      tree.root.findByProps({ testID: "footer-select-all" }).props.children
        .props.children,
    ).toBe("Select all");
    expect(
      tree.root.findByProps({ testID: "select-badge-item-a" }).props
        .accessibilityLabel,
    ).toBe("Select Item A");
    expect(
      tree.root.findByProps({ testID: "select-badge-item-b" }).props
        .accessibilityLabel,
    ).toBe("Select Item B");
  });

  it("marks all selected items as swapping and shows them as swapped once the batch swap resolves", async () => {
    const { tree } = renderModal();

    act(() => {
      tree.root.findByProps({ testID: "footer-select-all" }).props.onPress();
    });
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

    // Every card was swapped, so both should now render the disabled
    // "Swapped" terminal state instead of disappearing from the grid.
    expect(
      tree.root.findByProps({ testID: "swap-button-item-a" }).props.disabled,
    ).toBe(true);
    expect(
      tree.root.findByProps({ testID: "swap-button-item-b" }).props.disabled,
    ).toBe(true);
  });

  it("keeps a single-swapped item visible in a disabled 'Swapped' state instead of removing it", async () => {
    const { tree } = renderModal();

    act(() => {
      tree.root.findByProps({ testID: "swap-button-item-a" }).props.onPress();
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4000);
    });

    // Item A stays in the grid, disabled and labeled "Swapped"...
    expect(
      tree.root.findByProps({ testID: "swap-button-item-a" }).props.disabled,
    ).toBe(true);
    expect(
      tree.root.findByProps({ testID: "select-badge-item-a" }).props
        .accessibilityLabel,
    ).toBe("Item A already swapped");
    // ...while Item B is unaffected and still swappable.
    expect(
      tree.root.findByProps({ testID: "swap-button-item-b" }).props.disabled,
    ).toBe(false);
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

  it("auto-expires the countdown by crediting remaining items WITHOUT closing, and locks the UI", async () => {
    const onClose = jest.fn();
    const expiresAt = Date.now() + 5000;
    const { tree, getVault } = renderModal(onClose, expiresAt);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(6000);
    });

    // Items are credited to the vault immediately on expiry...
    expect(getVault().keptItems).toEqual(items);
    // ...but the modal stays open instead of auto-closing.
    expect(onClose).not.toHaveBeenCalled();

    expect(
      tree.root.findAllByProps({ children: "Expired" }).length,
    ).toBeGreaterThan(0);
    expect(
      tree.root.findByProps({ testID: "footer-select-all" }).props.disabled,
    ).toBe(true);
    expect(
      tree.root.findAllByProps({ children: "Offer expired" }).length,
    ).toBeGreaterThan(0);
    expect(
      tree.root.findByProps({ testID: "footer-swap-button" }).props.disabled,
    ).toBe(true);
    expect(
      tree.root.findByProps({ testID: "swap-button-item-a" }).props.disabled,
    ).toBe(true);
    expect(
      tree.root.findByProps({ testID: "swap-button-item-b" }).props.disabled,
    ).toBe(true);

    // The "X" button now just closes — items were already credited.
    act(() => {
      tree.root.findByProps({ testID: "close-button" }).props.onPress();
    });
    expect(getVault().keptItems).toEqual(items);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders each card's real item.imageUrl instead of the mocked reward image", () => {
    const { tree } = renderModal();

    const imageA = tree.root.findByProps({ testID: "card-image-item-a" });
    expect(imageA.props.source).toEqual({ uri: items[0].imageUrl });
  });

  it("passes a swapDurationMs to a single swapping card and clears it once resolved", async () => {
    const { tree } = renderModal();

    act(() => {
      tree.root.findByProps({ testID: "swap-button-item-a" }).props.onPress();
    });

    const cardA = tree.root
      .findAllByType(ItemCard)
      .find((instance) => instance.props.item.id === "item-a")!;
    expect(typeof cardA.props.swapDurationMs).toBe("number");

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4000);
    });

    // The card stays mounted (now in the "Swapped" terminal state) instead
    // of being removed, and its swapDurationMs is cleared.
    const resolvedCardA = tree.root
      .findAllByType(ItemCard)
      .find((instance) => instance.props.item.id === "item-a")!;
    expect(resolvedCardA.props.swapDurationMs).toBeUndefined();
    expect(resolvedCardA.props.swapped).toBe(true);
  });

  it("passes the same rolled swapDurationMs to every card in a batch swap", () => {
    const { tree } = renderModal();

    act(() => {
      tree.root.findByProps({ testID: "footer-select-all" }).props.onPress();
    });
    act(() => {
      tree.root.findByProps({ testID: "footer-swap-button" }).props.onPress();
    });

    const cards = tree.root.findAllByType(ItemCard);
    const durationA = cards.find(
      (instance) => instance.props.item.id === "item-a",
    )!.props.swapDurationMs;
    const durationB = cards.find(
      (instance) => instance.props.item.id === "item-b",
    )!.props.swapDurationMs;

    expect(typeof durationA).toBe("number");
    expect(durationA).toBe(durationB);
  });
});
