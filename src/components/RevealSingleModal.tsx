import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import mockReward from "../assets/mock_reward.png";
import { calculateSwapPoints } from "../config/points";
import { useWallet } from "../context/WalletContext";
import { useVault } from "../contexts/VaultContext";
import { useResponsive } from "../hooks/useResponsive";
import { colors } from "../theme/colors";
import { itemFrame } from "../theme/itemFrame";
import { shape } from "../theme/shape";
import type { ClawItem } from "../types/claw";
import { formatCurrency } from "../utils/currency";
import { simulateDelay } from "../utils/simulateDelay";
import { SwapSuccessModal } from "./SwapSuccessModal";

interface RevealSingleModalProps {
  visible: boolean;
  item: ClawItem | null;
  onClose: () => void;
}

interface SuccessState {
  amount: number;
  points: number;
}

/**
 * Fullscreen reveal modal for a single-item pull (QTY = 1).
 * Desktop: image left, details right. Mobile: stacked, image on top.
 */
export function RevealSingleModal({
  visible,
  item,
  onClose,
}: RevealSingleModalProps) {
  const { isMobile } = useResponsive();
  const { credit } = useWallet();
  const vault = useVault();
  const insets = useSafeAreaInsets();
  const [isSwapping, setIsSwapping] = useState(false);
  const [successResult, setSuccessResult] = useState<SuccessState | null>(null);

  if (!item) return null;

  const handleKeepItem = () => {
    vault.addKept([item]);
    onClose();
  };

  // Closing before any decision (swap/keep) implicitly keeps the item so it's
  // never silently lost; a swap already in flight is left alone instead.
  const handleClose = () => {
    if (isSwapping) return;
    handleKeepItem();
  };

  const handleSwapNow = async () => {
    setIsSwapping(true);
    await simulateDelay(2000, 4000);

    credit(item.fairMarketValue);
    setIsSwapping(false);
    setSuccessResult({
      amount: item.fairMarketValue,
      points: calculateSwapPoints(item.fairMarketValue),
    });
  };

  const handleSuccessDismiss = () => {
    setSuccessResult(null);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={false}
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={styles.screen}>
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              { top: insets.top + 24 },
              pressed && styles.pressedOpacity,
            ]}
            onPress={handleClose}
            disabled={isSwapping}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          <View style={[styles.content, !isMobile && styles.contentDesktop]}>
            <View
              style={[
                styles.imageColumn,
                !isMobile && styles.imageColumnDesktop,
              ]}
            >
              <View style={[itemFrame.itemFrameOuter, styles.imageFrame]}>
                <View
                  style={[itemFrame.itemFrameInner, styles.imageFrameInner]}
                >
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : mockReward}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>

            <View
              style={[
                styles.detailsColumn,
                !isMobile && styles.detailsColumnDesktop,
              ]}
            >
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.swapLabel}>Swap Value</Text>
              <Text style={styles.swapValue}>
                {formatCurrency(item.fairMarketValue)}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.swapButton,
                    isSwapping && styles.swapButtonDisabled,
                    pressed && styles.pressedOpacity,
                  ]}
                  onPress={handleSwapNow}
                  disabled={isSwapping}
                  testID="swap-now-button"
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
                    <Text style={styles.swapButtonText}>Swap Now</Text>
                  )}
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.keepButton,
                    pressed && styles.pressedOpacity,
                  ]}
                  onPress={handleKeepItem}
                  disabled={isSwapping}
                  testID="keep-item-button"
                >
                  <Text style={styles.keepButtonText}>Keep Item</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {successResult && (
        <SwapSuccessModal
          amount={successResult.amount}
          points={successResult.points}
          onClose={handleSuccessDismiss}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  closeButton: {
    position: "absolute",
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: shape.circle,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  contentDesktop: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 960,
    alignSelf: "center",
    width: "100%",
  },
  imageColumn: {
    alignItems: "center",
  },
  imageColumnDesktop: {
    flex: 1,
  },
  imageFrame: {
    maxWidth: 420,
  },
  // Reveal frame is much larger than ItemCard's, so it needs more breathing
  // room than the shared 30px to match the Figma reference.
  imageFrameInner: {
    padding: 40,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  detailsColumn: {
    gap: 8,
  },
  detailsColumnDesktop: {
    flex: 1,
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  swapLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  swapValue: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: "800",
  },
  actions: {
    marginTop: 24,
    width: "100%",
    gap: 12,
  },
  swapButton: {
    height: 48,
    borderRadius: shape.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  swapButtonDisabled: {
    backgroundColor: colors.goldMuted,
  },
  swappingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swapButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  keepButton: {
    height: 48,
    borderRadius: shape.button,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keepButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  pressedOpacity: {
    opacity: 0.85,
  },
});
