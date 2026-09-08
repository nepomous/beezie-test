import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useWallet } from "../context/WalletContext";
import { useVault } from "../contexts/VaultContext";
import { useResponsive } from "../hooks/useResponsive";
import { calculateSwapPoints } from "../config/points";
import { colors } from "../theme/colors";
import { shape } from "../theme/shape";
import type { ClawItem } from "../types/claw";
import { formatCurrency } from "../utils/currency";
import { simulateDelay } from "../utils/simulateDelay";
import { ItemCard } from "./ItemCard";
import { SwapSuccessModal } from "./SwapSuccessModal";

/** Countdown pulses between normal/alert color once under this many ms remain. */
const COUNTDOWN_CRITICAL_MS = 60_000;
const PRESSED_OPACITY = 0.85;

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

/** Rolls the randomized swap duration (ms), mirroring `randomDelay` in clawService.ts. */
function rollSwapDuration(): number {
  return 2000 + Math.random() * 2000;
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
  // Rolled swap duration per item id, so the progress bar animates over the
  // exact same duration used by the `simulateSwapDelay` await.
  const [swappingDurations, setSwappingDurations] = useState<
    Map<string, number>
  >(new Map());
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
  const [countdownPulse] = useState(() => new Animated.Value(0));
  const [footerSwapProgress] = useState(() => new Animated.Value(0));

  if (items !== resetForItems) {
    setResetForItems(items);
    setRemainingItems(items);
    setSelectedIds(new Set(items.map((item) => item.id)));
    setSwappingIds(new Set());
    setSwappingDurations(new Map());
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

  const remainingMs = expiresAt ? expiresAt - now : null;
  const isCountdownCritical =
    remainingMs !== null &&
    remainingMs > 0 &&
    remainingMs < COUNTDOWN_CRITICAL_MS &&
    !successResult;

  useEffect(() => {
    if (!isCountdownCritical) {
      countdownPulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(countdownPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(countdownPulse, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isCountdownCritical, countdownPulse]);

  const countdownTextColor = countdownPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, colors.danger],
  });

  const isFooterSwapping = swappingIds.size > 0;
  // Any in-flight swap (single or batch) shares the same rolled duration
  // when it's a batch, so the first entry works for either case.
  const footerSwapDurationMs =
    swappingDurations.size > 0
      ? swappingDurations.values().next().value
      : undefined;

  useEffect(() => {
    if (!isFooterSwapping || !footerSwapDurationMs) {
      footerSwapProgress.setValue(0);
      return undefined;
    }
    const animation = Animated.timing(footerSwapProgress, {
      toValue: 1,
      duration: footerSwapDurationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [isFooterSwapping, footerSwapDurationMs, footerSwapProgress]);

  const footerSwapProgressWidth = footerSwapProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

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
    const duration = rollSwapDuration();
    setSwappingIds((current) => new Set(current).add(item.id));
    setSwappingDurations((current) => new Map(current).set(item.id, duration));
    await simulateDelay(duration, duration);

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
    setSwappingDurations((current) => {
      const next = new Map(current);
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

    const duration = rollSwapDuration();
    setSwappingIds(idsToSwap);
    setSwappingDurations(
      new Map(Array.from(idsToSwap, (id) => [id, duration])),
    );
    await simulateDelay(duration, duration);

    const total = itemsToSwap.reduce(
      (sum, item) => sum + item.fairMarketValue,
      0,
    );
    credit(total);
    vault.addKept(itemsToKeep);

    setRemainingItems([]);
    setSelectedIds(new Set());
    setSwappingIds(new Set());
    setSwappingDurations(new Map());
    setCloseOnSuccessDismiss(true);
    setSuccessResult({ amount: total, points: calculateSwapPoints(total) });
  };

  const handleSuccessDismiss = () => {
    setSuccessResult(null);
    if (closeOnSuccessDismiss) {
      onClose();
    }
  };

  const isBulkActionDisabled = selectedIds.size === 0 || isFooterSwapping;

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
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressedOpacity,
            ]}
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
          {remainingItems.map((item) => (
            <View key={item.id} style={{ width: isMobile ? "48%" : "23%" }}>
              <ItemCard
                item={item}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelected(item.id)}
                swapping={swappingIds.has(item.id)}
                swapDurationMs={swappingDurations.get(item.id)}
                onSwap={() => handleSwapSingle(item)}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Animated.Text
            style={[
              styles.expiresText,
              isCountdownCritical && { color: countdownTextColor },
            ]}
          >
            {formatCountdown(expiresAt, now)}
          </Animated.Text>

          <View style={styles.footerActions}>
            <Pressable
              style={({ pressed }) => pressed && styles.pressedOpacity}
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
              style={({ pressed }) => [
                styles.bulkSwapButton,
                isBulkActionDisabled && styles.bulkSwapButtonDisabled,
                pressed && styles.pressedOpacity,
              ]}
              onPress={handleSwapSelected}
              disabled={isBulkActionDisabled}
              testID="footer-swap-button"
            >
              {isFooterSwapping && typeof footerSwapDurationMs === "number" && (
                <Animated.View
                  testID="footer-swap-progress"
                  style={[
                    styles.bulkSwapButtonProgress,
                    { width: footerSwapProgressWidth },
                  ]}
                />
              )}
              {isFooterSwapping ? (
                <View style={styles.footerSwappingRow}>
                  <ActivityIndicator color={colors.background} size="small" />
                  <Text style={styles.bulkSwapButtonText}>
                    SWAP in progress
                  </Text>
                </View>
              ) : (
                <Text style={styles.bulkSwapButtonText}>
                  {selectedIds.size > 0
                    ? `Swap ${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""} for ${formatCurrency(selectedTotal)}`
                    : "Swap"}
                </Text>
              )}
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
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: shape.circle,
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
    borderRadius: shape.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Lighter tone as the base (shrinks as the progress fill covers it), darker
  // tone as the growing fill below.
  bulkSwapButtonDisabled: {
    backgroundColor: colors.goldDark,
  },
  bulkSwapButtonProgress: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.goldMuted,
  },
  footerSwappingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bulkSwapButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "700",
  },
  pressedOpacity: {
    opacity: PRESSED_OPACITY,
  },
});
