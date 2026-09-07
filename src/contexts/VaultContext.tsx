import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { ClawItem } from "../types/claw";

interface VaultContextValue {
  keptItems: ClawItem[];
  /** Appends `items` to the vault (does not replace the existing list). */
  addKept: (items: ClawItem[]) => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

// TODO: persist `keptItems` to real storage/backend once one exists — this
// is in-memory only and resets on reload.
/** Provides the user's kept-item vault, shared by the reveal flow. */
export function VaultProvider({ children }: PropsWithChildren) {
  const [keptItems, setKeptItems] = useState<ClawItem[]>([]);

  const addKept = useCallback((items: ClawItem[]) => {
    if (items.length === 0) return;
    setKeptItems((current) => [...current, ...items]);
  }, []);

  const value = useMemo(() => ({ keptItems, addKept }), [keptItems, addKept]);

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault(): VaultContextValue {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}
