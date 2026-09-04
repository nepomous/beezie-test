import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { purchasePull } from "../services/clawService";
import { colors } from "../theme/colors";
import type { PullResult } from "../types/claw";
import { formatCurrency } from "../utils/currency";

interface PaymentModalPlaceholderProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: PullResult) => void;
  machineId: string;
  machineName: string;
  quantity: number;
  totalPrice: number;
}

/**
 * Temporary stand-in for the "Review & pay" modal (payment method selection,
 * order summary). Payment method is hardcoded to the Beezie wallet for now;
 * will be replaced by the real PaymentModal with full method selection.
 */
export function PaymentModalPlaceholder({
  visible,
  onClose,
  onConfirm,
  machineId,
  machineName,
  quantity,
  totalPrice,
}: PaymentModalPlaceholderProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsPurchasing(true);
    setError(null);
    try {
      const result = await purchasePull(machineId, quantity, "beezie-wallet");
      onConfirm(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir o pagamento. Tente novamente.",
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Review & pay</Text>
          <Text style={styles.placeholderNote}>
            Payment method placeholder — pays with Beezie wallet by default.
            Full method selection coming in the next prompt.
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item</Text>
            <Text style={styles.summaryValue}>{machineName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity</Text>
            <Text style={styles.summaryValue}>{quantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setError(null);
                onClose();
              }}
              disabled={isPurchasing}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                isPurchasing && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
              )}
            </Pressable>
          </View>
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
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  placeholderNote: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  totalValue: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  confirmButton: {
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.gold,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
});
