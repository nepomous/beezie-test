import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

const INITIAL_BALANCE = 1000;

interface WalletContextValue {
  balance: number;
  /** Returns true when `amount` can be spent without the balance going negative. */
  canAfford: (amount: number) => boolean;
  /** Deducts `amount` from the balance. Caller must check `canAfford` first. */
  deduct: (amount: number) => void;
  /** Adds `amount` to the balance. */
  credit: (amount: number) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/** Provides the user's Beezie wallet balance, shared by the header and the purchase flow. */
export function WalletProvider({ children }: PropsWithChildren) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);

  const canAfford = useCallback(
    (amount: number) => amount <= balance,
    [balance],
  );

  const deduct = useCallback((amount: number) => {
    setBalance((current) => current - amount);
  }, []);

  const credit = useCallback((amount: number) => {
    setBalance((current) => current + amount);
  }, []);

  const value = useMemo(
    () => ({ balance, canAfford, deduct, credit }),
    [balance, canAfford, deduct, credit],
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
