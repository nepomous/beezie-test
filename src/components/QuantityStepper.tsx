import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { radius } from "../theme/shape";

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

/** Numeric +/- stepper used to pick the pull quantity, clamped to [min, max]. */
export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
}: QuantityStepperProps) {
  const canDecrease = !disabled && quantity > min;
  const canIncrease = !disabled && quantity < max;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={!canDecrease}
        onPress={() => onChange(Math.max(min, quantity - 1))}
        style={[styles.button, !canDecrease && styles.buttonDisabled]}
      >
        <Text
          style={[styles.buttonText, !canDecrease && styles.buttonTextDisabled]}
        >
          −
        </Text>
      </Pressable>

      <Text style={styles.value}>{quantity}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={!canIncrease}
        onPress={() => onChange(Math.min(max, quantity + 1))}
        style={[styles.button, !canIncrease && styles.buttonDisabled]}
      >
        <Text
          style={[styles.buttonText, !canIncrease && styles.buttonTextDisabled]}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  button: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  value: {
    minWidth: 32,
    textAlign: "center",
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
