import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { formatCurrency } from "../utils/currency";

interface SwapSuccessModalProps {
  amount: number;
  points: number;
  onClose: () => void;
}

/**
 * Confirmation modal shown once a swap (single-item or batch) resolves.
 * Reusable across reveal flows — wired to `RevealMultipleModal` for now;
 * `RevealSingleModal` can adopt it later without changes here.
 */
export function SwapSuccessModal({
  amount,
  points,
  onClose,
}: SwapSuccessModalProps) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>

          <Text style={styles.message} testID="swap-success-message">
            {`${formatCurrency(amount)} will be credited to your wallet shortly`}
          </Text>

          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText} testID="swap-success-points">
              {`+${points} points`}
            </Text>
          </View>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    color: colors.success,
    fontSize: 28,
    fontWeight: "800",
  },
  message: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  pointsBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(245, 197, 24, 0.12)",
    borderWidth: 1,
    borderColor: colors.gold,
  },
  pointsBadgeText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 8,
    width: "100%",
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
});
