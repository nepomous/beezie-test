import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../theme/colors";

interface CreditDebitSimulationModalProps {
  visible: boolean;
  onClose: () => void;
  onSimulateSuccess: () => void;
  onSimulateError: () => void;
  isProcessing: boolean;
  errorMessage: string | null;
}

/**
 * Stand-in for a real card payment gateway. Lets the user simulate either
 * outcome so the rest of the purchase flow (success animation / error
 * handling) can be exercised without a real processor integration.
 */
export function CreditDebitSimulationModal({
  visible,
  onClose,
  onSimulateSuccess,
  onSimulateError,
  isProcessing,
  errorMessage,
}: CreditDebitSimulationModalProps) {
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
          <Text style={styles.title}>Simulate card payment</Text>
          <Text style={styles.note}>
            No real charge will be made. Choose an outcome to continue.
          </Text>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {isProcessing ? (
            <ActivityIndicator color={colors.gold} style={styles.spinner} />
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={styles.successButton}
                onPress={onSimulateSuccess}
              >
                <Text style={styles.successButtonText}>
                  Simulate successful payment
                </Text>
              </Pressable>
              <Pressable style={styles.errorButton} onPress={onSimulateError}>
                <Text style={styles.errorButtonText}>
                  Simulate payment error
                </Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}
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
    maxWidth: 380,
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
  note: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  spinner: {
    marginVertical: 12,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  successButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  successButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  errorButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  errorButtonText: {
    color: colors.danger,
    fontWeight: "700",
  },
  closeButton: {
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
