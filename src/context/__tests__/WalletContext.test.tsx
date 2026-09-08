import { Component, type ReactNode } from "react";
import renderer, { act as rendererAct } from "react-test-renderer";
import { renderHook, act } from "@testing-library/react-native";

import { useWallet, WalletProvider } from "../WalletContext";

const INITIAL_BALANCE = 1000;

function renderWallet() {
  return renderHook(() => useWallet(), { wrapper: WalletProvider });
}

describe("WalletContext", () => {
  it("starts with the initial balance", async () => {
    const { result } = await renderWallet();

    expect(result.current.balance).toBe(INITIAL_BALANCE);
  });

  it("credit(amount) adds to the balance", async () => {
    const { result } = await renderWallet();

    await act(() => {
      result.current.credit(250);
    });

    expect(result.current.balance).toBe(INITIAL_BALANCE + 250);
  });

  it("deduct(amount) subtracts from the balance", async () => {
    const { result } = await renderWallet();

    await act(() => {
      result.current.deduct(300);
    });

    expect(result.current.balance).toBe(INITIAL_BALANCE - 300);
  });

  describe("canAfford", () => {
    it("returns true when the amount equals the balance", async () => {
      const { result } = await renderWallet();

      expect(result.current.canAfford(INITIAL_BALANCE)).toBe(true);
    });

    it("returns true when the amount is one less than the balance", async () => {
      const { result } = await renderWallet();

      expect(result.current.canAfford(INITIAL_BALANCE - 1)).toBe(true);
    });

    it("returns false when the amount is one more than the balance", async () => {
      const { result } = await renderWallet();

      expect(result.current.canAfford(INITIAL_BALANCE + 1)).toBe(false);
    });
  });

  it("throws when used outside a WalletProvider", () => {
    // A render-time throw doesn't reliably propagate through `renderHook`/
    // `act`'s promise chain, so catch it with a real error boundary instead.
    class CaughtErrorBoundary extends Component<
      { onError: (error: Error) => void; children: ReactNode },
      { hasError: boolean }
    > {
      state = { hasError: false };
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      componentDidCatch(error: Error) {
        this.props.onError(error);
      }
      render() {
        return this.state.hasError ? null : this.props.children;
      }
    }

    function ThrowingConsumer() {
      useWallet();
      return null;
    }

    const onError = jest.fn();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    rendererAct(() => {
      renderer.create(
        <CaughtErrorBoundary onError={onError}>
          <ThrowingConsumer />
        </CaughtErrorBoundary>,
      );
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "useWallet must be used within a WalletProvider",
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});
