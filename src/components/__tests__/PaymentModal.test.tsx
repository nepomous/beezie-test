import renderer, { act } from "react-test-renderer";

import { WalletProvider } from "../../context/WalletContext";
import type { ComponentProps } from "react";
import { CreditDebitSimulationModal } from "../CreditDebitSimulationModal";
import { PaymentModal } from "../PaymentModal";

// Force the desktop layout, which lists all three payment methods as plain
// PaymentOption rows (the mobile layout splits them across tabs/cards).
jest.mock("../../hooks/useResponsive", () => ({
  useResponsive: () => ({
    width: 1200,
    height: 900,
    breakpoint: "desktop",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderPaymentModal(
  props: Partial<ComponentProps<typeof PaymentModal>> = {},
) {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <WalletProvider>
        <PaymentModal
          visible
          onClose={onClose}
          onConfirm={onConfirm}
          machineId="pokemon-gold-claw"
          machineName="Pokémon Gold Claw"
          quantity={1}
          totalPrice={500}
          pointsPerPull={500}
          {...props}
        />
      </WalletProvider>,
    );
  });
  return { tree, onClose, onConfirm };
}

// `testID` cascades onto RN's internal host nodes too, so narrow down to the
// composite `Pressable` we set `style`/`onPress` on directly.
function findOptionPressable(tree: renderer.ReactTestRenderer, testID: string) {
  return tree.root
    .findAllByProps({ testID })
    .find(
      (instance) =>
        typeof instance.type !== "string" &&
        (instance.type as { name?: string }).name === "Pressable",
    )!;
}

describe("PaymentModal", () => {
  it("selecting a payment option updates its selected visual state", () => {
    const { tree } = renderPaymentModal();

    const beezieOption = () =>
      findOptionPressable(tree, "payment-option-beezie-wallet");
    const externalOption = () =>
      findOptionPressable(tree, "payment-option-external-wallet");
    const creditOption = () =>
      findOptionPressable(tree, "payment-option-credit-debit");

    // Beezie wallet is selected by default.
    expect(beezieOption().props.style[1]).toBeTruthy();
    expect(externalOption().props.style[1]).toBeFalsy();
    expect(creditOption().props.style[1]).toBeFalsy();

    act(() => {
      externalOption().props.onPress();
    });
    expect(beezieOption().props.style[1]).toBeFalsy();
    expect(externalOption().props.style[1]).toBeTruthy();
    expect(creditOption().props.style[1]).toBeFalsy();

    act(() => {
      creditOption().props.onPress();
    });
    expect(externalOption().props.style[1]).toBeFalsy();
    expect(creditOption().props.style[1]).toBeTruthy();

    act(() => {
      beezieOption().props.onPress();
    });
    expect(creditOption().props.style[1]).toBeFalsy();
    expect(beezieOption().props.style[1]).toBeTruthy();
  });

  it("keeps external wallet selectable but blocks Confirm while it's selected", () => {
    const { tree, onConfirm } = renderPaymentModal();

    act(() => {
      findOptionPressable(
        tree,
        "payment-option-external-wallet",
      ).props.onPress();
    });

    const confirmButton = tree.root.findByProps({ testID: "confirm-button" });
    expect(confirmButton.props.disabled).toBe(true);

    act(() => {
      confirmButton.props.onPress();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows an error and doesn't confirm when the Beezie wallet balance can't cover the total", async () => {
    const { tree, onConfirm } = renderPaymentModal({ totalPrice: 1500 });

    await act(async () => {
      tree.root.findByProps({ testID: "confirm-button" }).props.onPress();
      await jest.advanceTimersByTimeAsync(1000);
    });

    expect(
      tree.root.findByProps({ testID: "payment-error" }).props.children,
    ).toBe("Insufficient balance. Please top up your Beezie wallet.");
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms a valid Beezie wallet payment and calls onConfirm with the pull result", async () => {
    const { tree, onConfirm } = renderPaymentModal({
      quantity: 3,
      totalPrice: 500,
    });

    await act(async () => {
      tree.root.findByProps({ testID: "confirm-button" }).props.onPress();
      await jest.advanceTimersByTimeAsync(1000);
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const result = onConfirm.mock.calls[0][0];
    expect(result.items).toHaveLength(3);
    expect(typeof result.pullId).toBe("string");
    expect(typeof result.expiresAt).toBe("number");
  });

  it("opens the CreditDebitSimulationModal when confirming with credit/debit selected", () => {
    const { tree } = renderPaymentModal();

    act(() => {
      findOptionPressable(tree, "payment-option-credit-debit").props.onPress();
    });
    act(() => {
      tree.root.findByProps({ testID: "confirm-button" }).props.onPress();
    });

    expect(tree.root.findByType(CreditDebitSimulationModal).props.visible).toBe(
      true,
    );
  });
});
