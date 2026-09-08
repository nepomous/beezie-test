import renderer, { act } from "react-test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useWallet, WalletProvider } from "../../context/WalletContext";
import { useVault, VaultProvider } from "../../contexts/VaultContext";
import type { ClawItem } from "../../types/claw";
import { calculateSwapPoints } from "../../config/points";
import { RevealSingleModal } from "../RevealSingleModal";

const item: ClawItem = {
  id: "item-a",
  name: "Item A",
  imageUrl: "https://example.com/a.png",
  fairMarketValue: 150,
  rarity: "rare",
};

// Exposes the current vault/wallet contents to assertions without
// duplicating the providers' internals.
function StateSpy({
  onReady,
}: {
  onReady: (state: {
    vault: ReturnType<typeof useVault>;
    wallet: ReturnType<typeof useWallet>;
  }) => void;
}) {
  onReady({ vault: useVault(), wallet: useWallet() });
  return null;
}

function renderModal(onClose: () => void = jest.fn()) {
  let state: {
    vault: ReturnType<typeof useVault>;
    wallet: ReturnType<typeof useWallet>;
  };
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
            <StateSpy onReady={(value) => (state = value)} />
            <RevealSingleModal visible item={item} onClose={onClose} />
          </VaultProvider>
        </WalletProvider>
      </SafeAreaProvider>,
    );
  });
  return { tree: tree!, getState: () => state! };
}

describe("RevealSingleModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the item's real image when imageUrl is present", () => {
    const { tree } = renderModal();

    const image = tree.root.findByProps({ resizeMode: "contain" });
    expect(image.props.source).toEqual({ uri: item.imageUrl });
  });

  it("keeps the item in the vault when Keep Item is pressed", () => {
    const onClose = jest.fn();
    const { tree, getState } = renderModal(onClose);

    act(() => {
      tree.root.findByProps({ testID: "keep-item-button" }).props.onPress();
    });

    expect(getState().vault.keptItems).toEqual([item]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the item when the close button is pressed before any decision", () => {
    const onClose = jest.fn();
    const { tree, getState } = renderModal(onClose);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "Close" }).props.onPress();
    });

    expect(getState().vault.keptItems).toEqual([item]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state, then credits the wallet and shows the success modal", async () => {
    const onClose = jest.fn();
    const { tree, getState } = renderModal(onClose);
    const initialBalance = getState().wallet.balance;

    act(() => {
      tree.root.findByProps({ testID: "swap-now-button" }).props.onPress();
    });

    expect(
      tree.root.findByProps({ testID: "swap-now-button" }).props.disabled,
    ).toBe(true);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4000);
    });

    expect(getState().wallet.balance).toBe(
      initialBalance + item.fairMarketValue,
    );
    expect(
      tree.root.findByProps({ testID: "swap-success-message" }).props.children,
    ).toBe("$150 will be credited to your wallet shortly");
    expect(
      tree.root.findByProps({ testID: "swap-success-points" }).props.children,
    ).toBe(`+${calculateSwapPoints(item.fairMarketValue)} points`);

    // The reveal modal isn't closed until the success modal is dismissed.
    expect(onClose).not.toHaveBeenCalled();
  });
});
