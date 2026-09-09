import renderer, { act } from "react-test-renderer";

import { WalletProvider } from "../../context/WalletContext";
import type { ComponentProps } from "react";
import { pokemonGoldClaw } from "../../mocks/clawMachines";
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
          machineIcon={pokemonGoldClaw.iconAsset}
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
    // At the default totalPrice (500), Beezie wallet (1000) and external
    // wallet (25000) can both afford it, so external is a real, selectable
    // option here — this test only checks that selecting it doesn't confirm.
    const { tree, onConfirm } = renderPaymentModal();

    act(() => {
      findOptionPressable(
        tree,
        "payment-option-external-wallet",
      ).props.onPress();
    });

    const confirmButton = tree.root.findByProps({ testID: "confirm-button" });
    expect(confirmButton.props.disabled).toBeFalsy();

    act(() => {
      confirmButton.props.onPress();
    });
    // External wallet purchases aren't implemented as a real payment flow
    // yet, so Confirm is a no-op safety net once it's actually reachable.
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("auto-selects external wallet and disables Beezie wallet when Beezie's balance can't cover the total", () => {
    // Beezie wallet starts at 1000, external wallet at 25000.
    const { tree } = renderPaymentModal({ totalPrice: 1500 });

    const beezieOption = findOptionPressable(
      tree,
      "payment-option-beezie-wallet",
    );
    const externalOption = findOptionPressable(
      tree,
      "payment-option-external-wallet",
    );

    expect(beezieOption.props.disabled).toBe(true);
    expect(beezieOption.props.onPress).toBeUndefined();
    expect(externalOption.props.style[1]).toBeTruthy();
    expect(externalOption.props.disabled).toBeFalsy();
  });

  it("falls back to credit/debit and disables both wallets when neither balance covers the total", () => {
    const { tree } = renderPaymentModal({ totalPrice: 30000 });

    const beezieOption = findOptionPressable(
      tree,
      "payment-option-beezie-wallet",
    );
    const externalOption = findOptionPressable(
      tree,
      "payment-option-external-wallet",
    );
    const creditOption = findOptionPressable(
      tree,
      "payment-option-credit-debit",
    );

    expect(beezieOption.props.disabled).toBe(true);
    expect(externalOption.props.disabled).toBe(true);
    expect(creditOption.props.style[1]).toBeTruthy();

    const confirmButton = tree.root.findByProps({ testID: "confirm-button" });
    expect(confirmButton.props.disabled).toBeFalsy();
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
