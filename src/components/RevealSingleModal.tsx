import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useResponsive } from "../hooks/useResponsive";
import { colors } from "../theme/colors";
import type { ClawItem } from "../types/claw";
import { formatCurrency } from "../utils/currency";

interface RevealSingleModalProps {
  visible: boolean;
  item: ClawItem | null;
  onClose: () => void;
  /** 0-based position of `item` within the pull, used for multi-item pulls. */
  itemIndex?: number;
  /** Total number of items in the pull; the "Item X of N" label only shows when > 1. */
  itemCount?: number;
}

/**
 * Fullscreen reveal modal for a single item. Also reused to step through a
 * multi-item pull one item at a time (see `itemIndex`/`itemCount`), since
 * there's no dedicated grid reveal yet.
 * Desktop: image left, details right. Mobile: stacked, image on top.
 */
export function RevealSingleModal({
  visible,
  item,
  onClose,
  itemIndex,
  itemCount,
}: RevealSingleModalProps) {
  const { isMobile } = useResponsive();

  if (!item) return null;

  const handleKeepItem = () => {
    // TODO: call real API to add `item` to the user's collection/vault.
    console.log("Keep item:", item.id);
    onClose();
  };

  const handleSwapNow = () => {
    // TODO: call real API to credit `item.fairMarketValue` to the user's wallet.
    console.log("Swap now, credited to wallet:", item.fairMarketValue);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.screen}>
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>

        <View style={[styles.content, !isMobile && styles.contentDesktop]}>
          <View
            style={[styles.imageColumn, !isMobile && styles.imageColumnDesktop]}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View
            style={[
              styles.detailsColumn,
              !isMobile && styles.detailsColumnDesktop,
            ]}
          >
            {itemCount !== undefined &&
              itemCount > 1 &&
              itemIndex !== undefined && (
                <Text style={styles.itemProgress}>
                  Item {itemIndex + 1} of {itemCount}
                </Text>
              )}
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.swapLabel}>Swap Value</Text>
            <Text style={styles.swapValue}>
              {formatCurrency(item.fairMarketValue)}
            </Text>

            <View style={styles.actions}>
              <Pressable style={styles.swapButton} onPress={handleSwapNow}>
                <Text style={styles.swapButtonText}>Swap Now</Text>
              </Pressable>
              <Pressable style={styles.keepButton} onPress={handleKeepItem}>
                <Text style={styles.keepButtonText}>Keep Item</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
    top: 24,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
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
  image: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 0.8,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  detailsColumn: {
    gap: 8,
    alignItems: "center",
  },
  detailsColumnDesktop: {
    flex: 1,
    alignItems: "flex-start",
  },
  itemProgress: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
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
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  swapButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  keepButton: {
    height: 48,
    borderRadius: 8,
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
});
