import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import mockReward from "../assets/mock_reward.png";
import { useWallet } from "../context/WalletContext";
import { useVault } from "../contexts/VaultContext";
import { useResponsive } from "../hooks/useResponsive";
import { calculateSwapPoints } from "../config/points";
import { colors } from "../theme/colors";
import type { ClawItem } from "../types/claw";
import { formatCurrency } from "../utils/currency";
import { SwapSuccessModal } from "./SwapSuccessModal";

interface RevealMultipleModalProps {
  visible: boolean;
  items: ClawItem[];
  /** Shared expiration for the whole pull (epoch ms), or null to hide the countdown. */
  expiresAt: number | null;
  onClose: () => void;
}

interface SuccessState {
  amount: number;
  points: number;
}

/** Simulates network latency for a swap, mirroring `randomDelay` in clawService.ts. */
function simulateSwapDelay(): Promise<void> {
  const ms = 2000 + Math.random() * 2000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCountdown(expiresAt: number | null, now: number): string {
  if (!expiresAt) return "";
  const totalSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Expires in ${minutes} min ${seconds} sec`;
}

/**
 * Fullscreen grid reveal modal for a multi-item pull (QTY > 1). All items
 * start selected (checkmark); the user deselects the ones to keep in the
 * vault. Supports per-card swaps and a bulk footer swap, both of which go
 * through an artificial loading delay before crediting the wallet.
 */
export function RevealMultipleModal({
  visible,
  items,
  expiresAt,
  onClose,
}: RevealMultipleModalProps) {
  const { isMobile } = useResponsive();
  const { credit } = useWallet();
  const vault = useVault();

  const [remainingItems, setRemainingItems] = useState<ClawItem[]>(items);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(items.map((item) => item.id)),
  );
  const [swappingIds, setSwappingIds] = useState<Set<string>>(new Set());
  const [successResult, setSuccessResult] = useState<SuccessState | null>(null);
  // Whether dismissing the success modal should also close the whole reveal —
  // true after a batch swap (the pull is fully resolved), false after an
  // individual swap where other items may still be pending a decision.
  const [closeOnSuccessDismiss, setCloseOnSuccessDismiss] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Tracks the last `items` reference we reset from, so a new pull (a new
  // `items` array) can reset local state during render instead of in an
  // effect — see https://react.dev/learn/you-might-not-need-an-effect.
  const [resetForItems, setResetForItems] = useState(items);
  // Guards the auto-expire effect below so it only fires once per pull.
  const hasAutoExpiredRef = useRef(false);

  if (items !== resetForItems) {
    setResetForItems(items);
    setRemainingItems(items);
    setSelectedIds(new Set(items.map((item) => item.id)));
    setSwappingIds(new Set());
    setSuccessResult(null);
    setCloseOnSuccessDismiss(false);
  }

  useEffect(() => {
    hasAutoExpiredRef.current = false;
  }, [items]);

  // Marks every item not currently mid-swap as kept in the vault, then
  // closes the whole reveal. Used by the X button and by the countdown
  // auto-expiring; an in-flight swap is left alone so it can still resolve.
  const resolveAndClose = useCallback(() => {
    const itemsToKeep = remainingItems.filter(
      (item) => !swappingIds.has(item.id),
    );
    if (itemsToKeep.length > 0) {
      vault.addKept(itemsToKeep);
    }
    setRemainingItems((current) =>
      current.filter((item) => swappingIds.has(item.id)),
    );
    setSelectedIds(new Set());
    onClose();
  }, [remainingItems, swappingIds, vault, onClose]);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    // Don't auto-expire on top of a success modal that's already showing,
    // and only fire once per pull.
    if (!expiresAt || successResult || now < expiresAt) return;
    if (hasAutoExpiredRef.current) return;
    hasAutoExpiredRef.current = true;
    resolveAndClose();
  }, [expiresAt, now, successResult, resolveAndClose]);

  const selectedTotal = useMemo(
    () =>
      remainingItems
        .filter((item) => selectedIds.has(item.id))
        .reduce((sum, item) => sum + item.fairMarketValue, 0),
    [remainingItems, selectedIds],
  );

  if (remainingItems.length === 0 && items.length === 0) return null;

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === 0) {
      setSelectedIds(new Set(remainingItems.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSwapSingle = async (item: ClawItem) => {
    setSwappingIds((current) => new Set(current).add(item.id));
    await simulateSwapDelay();

    credit(item.fairMarketValue);

    const willCloseAll = remainingItems.length <= 1;
    setRemainingItems((current) =>
      current.filter((entry) => entry.id !== item.id),
    );
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setSwappingIds((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setCloseOnSuccessDismiss(willCloseAll);
    setSuccessResult({
      amount: item.fairMarketValue,
      points: calculateSwapPoints(item.fairMarketValue),
    });
  };

  const handleSwapSelected = async () => {
    const idsToSwap = new Set(selectedIds);
    if (idsToSwap.size === 0) return;

    const itemsToSwap = remainingItems.filter((item) => idsToSwap.has(item.id));
    const itemsToKeep = remainingItems.filter(
      (item) => !idsToSwap.has(item.id),
    );

    setSwappingIds(idsToSwap);
    await simulateSwapDelay();

    const total = itemsToSwap.reduce(
      (sum, item) => sum + item.fairMarketValue,
      0,
    );
    credit(total);
    vault.addKept(itemsToKeep);

    setRemainingItems([]);
    setSelectedIds(new Set());
    setSwappingIds(new Set());
    setCloseOnSuccessDismiss(true);
    setSuccessResult({ amount: total, points: calculateSwapPoints(total) });
  };

  const handleSuccessDismiss = () => {
    setSuccessResult(null);
    if (closeOnSuccessDismiss) {
      onClose();
    }
  };

  const isBulkActionDisabled = selectedIds.size === 0 || swappingIds.size > 0;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={resolveAndClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Claw - Full screen reveal</Text>
          <Pressable
            style={styles.closeButton}
            onPress={resolveAndClose}
            hitSlop={12}
            testID="close-button"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {remainingItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isSwapping = swappingIds.has(item.id);

            return (
              <View
                key={item.id}
                style={[styles.card, { width: isMobile ? "48%" : "23%" }]}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : mockReward}
                    style={styles.cardImage}
                    resizeMode="cover"
                    testID={`card-image-${item.id}`}
                  />
                  <Pressable
                    style={[
                      styles.selectBadge,
                      isSelected && styles.selectBadgeSelected,
                    ]}
                    onPress={() => toggleSelected(item.id)}
                    disabled={isSwapping}
                    hitSlop={8}
                    testID={`select-badge-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isSelected
                        ? `Deselect ${item.name}`
                        : `Select ${item.name}`
                    }
                  >
                    <Text
                      style={[
                        styles.selectBadgeText,
                        isSelected && styles.selectBadgeTextSelected,
                      ]}
                    >
                      {isSelected ? "✓" : "+"}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.cardName} numberOfLines={2}>
                  {item.name}
                </Text>

                <Pressable
                  style={[
                    styles.swapButton,
                    isSwapping && styles.swapButtonDisabled,
                  ]}
                  onPress={() => handleSwapSingle(item)}
                  disabled={isSwapping}
                  testID={`swap-button-${item.id}`}
                >
                  {isSwapping ? (
                    <View style={styles.swappingRow}>
                      <ActivityIndicator
                        color={colors.background}
                        size="small"
                      />
                      <Text style={styles.swapButtonText}>
                        SWAP in progress
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.swapButtonText}>
                      {`Swap for ${formatCurrency(item.fairMarketValue)}`}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.expiresText}>
            {formatCountdown(expiresAt, now)}
          </Text>

          <View style={styles.footerActions}>
            <Pressable
              onPress={handleToggleAll}
              disabled={swappingIds.size > 0}
              testID="footer-select-all"
              hitSlop={8}
            >
              <Text style={styles.selectAllText}>
                {selectedIds.size > 0 ? "Clear" : "Select all"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.bulkSwapButton,
                isBulkActionDisabled && styles.bulkSwapButtonDisabled,
              ]}
              onPress={handleSwapSelected}
              disabled={isBulkActionDisabled}
              testID="footer-swap-button"
            >
              <Text style={styles.bulkSwapButtonText}>
                {selectedIds.size > 0
                  ? `Swap ${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""} for ${formatCurrency(selectedTotal)}`
                  : "Swap"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {successResult && (
        <SwapSuccessModal
          amount={successResult.amount}
          points={successResult.points}
          onClose={handleSuccessDismiss}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    gap: 8,
  },
  imageWrapper: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  selectBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectBadgeSelected: {
    backgroundColor: colors.gold,
  },
  selectBadgeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  selectBadgeTextSelected: {
    color: colors.background,
  },
  cardName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  swapButton: {
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  swapButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  swappingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swapButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expiresText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  selectAllText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  bulkSwapButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  bulkSwapButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  bulkSwapButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "700",
  },
});
