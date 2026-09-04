import { StyleSheet, Text, View } from "react-native";

import { colors, rarityColors } from "../theme/colors";
import type { OddsTier } from "../types/claw";
import { formatCurrency } from "../utils/currency";

interface OddsTableProps {
  odds: OddsTier[];
  averageValue: number;
}

function formatValueRange(tier: OddsTier): string {
  if (tier.valueRangeMax === null) {
    return `${formatCurrency(tier.valueRangeMin)}+`;
  }
  return `${formatCurrency(tier.valueRangeMin)}-${formatCurrency(tier.valueRangeMax)}`;
}

/** Renders one accent-colored card per rarity tier from `machine.odds`, 3 per row. */
export function OddsTable({ odds, averageValue }: OddsTableProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Odds</Text>
          <Text style={styles.subtitle}>Updates every few seconds</Text>
        </View>
        <View style={styles.averageValueBox}>
          <Text style={styles.subtitle}>Average Value:</Text>
          <Text style={styles.averageValue}>
            {formatCurrency(averageValue)}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {odds.map((tier) => {
          const tierColors = rarityColors[tier.rarity];
          return (
            <View
              key={tier.rarity}
              style={[
                styles.tierCard,
                {
                  backgroundColor: tierColors.background,
                  borderColor: tierColors.border,
                },
              ]}
            >
              <Text style={[styles.tierLabel, { color: tierColors.text }]}>
                {tier.label}
              </Text>
              <Text style={styles.tierChance}>{tier.chancePercent}%</Text>
              <Text style={styles.tierRange}>{formatValueRange(tier)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  averageValueBox: {
    alignItems: "flex-end",
  },
  averageValue: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tierCard: {
    width: "31%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  tierChance: {
    color: colors.textPrimary,
    fontSize: 11,
  },
  tierRange: {
    color: colors.textSecondary,
    fontSize: 10,
  },
});
