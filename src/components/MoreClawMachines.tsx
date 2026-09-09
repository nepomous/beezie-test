import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ClawMachineSummary } from "../mocks/clawMachines";
import { colors } from "../theme/colors";
import { radius, shape } from "../theme/shape";
import { formatCurrency } from "../utils/currency";

interface MoreClawMachinesProps {
  machines: ClawMachineSummary[];
}

/** Preview row for other claw machines; tapping one navigates to its detail screen. */
export function MoreClawMachines({ machines }: MoreClawMachinesProps) {
  const router = useRouter();

  if (machines.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>More Claw Machines</Text>
      <View style={styles.row}>
        {machines.map((machine) => {
          const Icon = machine.iconAsset;

          return (
            <Pressable
              key={machine.id}
              accessibilityRole="button"
              accessibilityLabel={`${machine.name}, ${formatCurrency(machine.pricePerPull)}`}
              style={styles.card}
              onPress={() => {
                router.push(`/claw/${machine.slug}`);
              }}
            >
              <View style={styles.iconChip}>
                <Icon width={32} height={32} />
              </View>
              <Text style={styles.price}>
                {formatCurrency(machine.pricePerPull)}
              </Text>
              <Text style={styles.name} numberOfLines={1}>
                {machine.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: shape.secondaryCard,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  price: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  name: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});
