import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { Wallet } from "../types/claw";

const INITIAL_BEEZIE_BALANCE = 1000;
// External wallet is a real balance now (was a hardcoded $0 placeholder
// inside PaymentModal), but there's no top-up/linking flow yet, so it's a
// fixed starting balance with no setter.
const INITIAL_EXTERNAL_BALANCE = 25000;

interface WalletContextValue extends Wallet {
  /**
   * Alias for `beezieBalance`, kept for backward compatibility with
   * call sites that predate the external wallet (header balance display,
   * `RevealSingleModal`/`RevealMultipleModal` reward crediting, existing
   * tests). New code should prefer `beezieBalance`.
   */
  balance: number;
  /** Returns true when `amount` can be spent from the Beezie wallet without the balance going negative. */
  canAfford: (amount: number) => boolean;
  /** Deducts `amount` from the Beezie wallet. Caller must check `canAfford` first. */
  deduct: (amount: number) => void;
  /** Adds `amount` to the Beezie wallet. */
  credit: (amount: number) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/** Provides the user's Beezie + external wallet balances, shared by the header and the purchase flow. */
export function WalletProvider({ children }: PropsWithChildren) {
  const [beezieBalance, setBeezieBalance] = useState(INITIAL_BEEZIE_BALANCE);
  const [externalBalance] = useState(INITIAL_EXTERNAL_BALANCE);

  const canAfford = useCallback(
    (amount: number) => amount <= beezieBalance,
    [beezieBalance],
  );

  const deduct = useCallback((amount: number) => {
    setBeezieBalance((current) => current - amount);
  }, []);

  const credit = useCallback((amount: number) => {
    setBeezieBalance((current) => current + amount);
  }, []);

  const value = useMemo(
    () => ({
      beezieBalance,
      externalBalance,
      balance: beezieBalance,
      canAfford,
      deduct,
      credit,
    }),
    [beezieBalance, externalBalance, canAfford, deduct, credit],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
