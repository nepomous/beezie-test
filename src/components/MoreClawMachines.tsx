import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Box500Icon from "../assets/icons/500_box_icon.svg";
import Box30Icon from "../assets/icons/30_box_icon.svg";
import type { ClawMachineSummary } from "../mocks/clawMachines";
import { colors } from "../theme/colors";
import { radius, shape } from "../theme/shape";
import { formatCurrency } from "../utils/currency";

interface MoreClawMachinesProps {
  machines: ClawMachineSummary[];
}

// react-native-web's Alert.alert() is a no-op, so fall back to window.alert on web.
function showComingSoonAlert() {
  if (Platform.OS === "web") {
    window.alert("Claw machine coming soon");
  } else {
    Alert.alert("Claw machine coming soon");
  }
}

/** Preview row for other claw machines; tapping one is a placeholder action. */
export function MoreClawMachines({ machines }: MoreClawMachinesProps) {
  if (machines.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>More Claw Machines</Text>
      <View style={styles.row}>
        {machines.map((machine) => {
          const isBox500 = machine.pricePerPull >= 500;
          const Icon = isBox500 ? Box500Icon : Box30Icon;

          return (
            <Pressable
              key={machine.id}
              accessibilityRole="button"
              accessibilityLabel={`${machine.name}, ${formatCurrency(machine.pricePerPull)}`}
              style={styles.card}
              onPress={showComingSoonAlert}
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
