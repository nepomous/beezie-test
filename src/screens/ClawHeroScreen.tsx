import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ClawOpeningAnimation } from "../components/ClawOpeningAnimation";
import { OddsTable } from "../components/OddsTable";
import { PaymentModalPlaceholder } from "../components/PaymentModalPlaceholder";
import { QuantityStepper } from "../components/QuantityStepper";
import { ResponsiveContainer } from "../components/ResponsiveContainer";
import { RevealSingleModal } from "../components/RevealSingleModal";
import { useResponsive } from "../hooks/useResponsive";
import { getClawMachine, getRecentPulls } from "../services/clawService";
import { colors } from "../theme/colors";
import type { ClawMachine, PullResult, RecentPull } from "../types/claw";
import { formatCurrency } from "../utils/currency";

const DEFAULT_MACHINE_ID = "pokemon-gold-claw";
const TOP_ITEMS_COUNT = 6;
const MAX_QUANTITY = 10;

export function ClawHeroScreen() {
  const { isMobile } = useResponsive();
  const [machine, setMachine] = useState<ClawMachine | null>(null);
  const [recentPulls, setRecentPulls] = useState<RecentPull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [activePullResult, setActivePullResult] = useState<PullResult | null>(
    null,
  );
  const [revealResult, setRevealResult] = useState<PullResult | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getClawMachine(DEFAULT_MACHINE_ID),
      getRecentPulls(DEFAULT_MACHINE_ID),
    ])
      .then(([machineData, pullsData]) => {
        if (!isMounted) return;
        setMachine(machineData);
        setRecentPulls(pullsData);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a máquina de garra.",
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  if (loadError) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorTitle}>Algo deu errado</Text>
        <Text style={styles.errorMessage}>{loadError}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoadError(null);
            setIsLoading(true);
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading || !machine) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const topItems = [...machine.itemPool]
    .sort((a, b) => b.fairMarketValue - a.fairMarketValue)
    .slice(0, TOP_ITEMS_COUNT);

  const totalPrice = machine.pricePerPull * quantity;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ResponsiveContainer
          style={!isMobile ? styles.wideContainer : undefined}
        >
          <View style={[styles.topRow, !isMobile && styles.topRowDesktop]}>
            <View
              style={[
                styles.machineColumn,
                !isMobile && styles.machineColumnDesktop,
              ]}
            >
              <Image
                source={{ uri: machine.heroImageUrl }}
                style={styles.machineImage}
                resizeMode="cover"
              />
            </View>

            <View
              style={[
                styles.purchaseColumn,
                !isMobile && styles.purchaseColumnDesktop,
              ]}
            >
              <Text style={styles.machineName}>{machine.name}</Text>
              <Text style={styles.machineDescription}>
                {machine.description}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  {formatCurrency(machine.pricePerPull)}
                </Text>
                <Text style={styles.points}>
                  +{machine.pointsPerPull.toLocaleString("en-US")} points
                </Text>
              </View>

              <Text style={styles.promoLabel}>Apply promo code</Text>

              <OddsTable
                odds={machine.odds}
                averageValue={machine.averageValue}
              />

              <View style={styles.startRow}>
                <QuantityStepper
                  quantity={quantity}
                  onChange={setQuantity}
                  max={MAX_QUANTITY}
                />
                <Pressable
                  style={styles.startButton}
                  onPress={() => setIsPaymentOpen(true)}
                >
                  <Text style={styles.startButtonText}>Start Now</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View
            style={[styles.bottomRow, !isMobile && styles.bottomRowDesktop]}
          >
            <View style={[styles.section, !isMobile && styles.sectionDesktop]}>
              <Text style={styles.sectionTitle}>Top Items</Text>
              <View style={styles.topItemsGrid}>
                {topItems.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.topItemCard,
                      { width: isMobile ? "48%" : "31%" },
                    ]}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.topItemImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.topItemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.topItemValue}>
                      FMV {formatCurrency(item.fairMarketValue)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.section, !isMobile && styles.sectionDesktop]}>
              <Text style={styles.sectionTitle}>Recent Pulls</Text>
              <View style={styles.recentPullsList}>
                {recentPulls.map((pull) => (
                  <View key={pull.id} style={styles.recentPullRow}>
                    <Image
                      source={{ uri: pull.item.imageUrl }}
                      style={styles.recentPullImage}
                      resizeMode="cover"
                    />
                    <View style={styles.recentPullInfo}>
                      <Text style={styles.recentPullName} numberOfLines={1}>
                        {pull.item.name}
                      </Text>
                      <Text style={styles.recentPullUser}>
                        {pull.userDisplayName}
                      </Text>
                    </View>
                    <Text style={styles.recentPullValue}>
                      {formatCurrency(pull.paidValue)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      <PaymentModalPlaceholder
        visible={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onConfirm={(result) => {
          setIsPaymentOpen(false);
          setActivePullResult(result);
        }}
        machineId={machine.id}
        machineName={machine.name}
        quantity={quantity}
        totalPrice={totalPrice}
      />

      {activePullResult && (
        <ClawOpeningAnimation
          videoUrl={machine.videoOpeningUrl}
          onAnimationEnd={() => {
            setRevealResult(activePullResult);
            setRevealIndex(0);
            setActivePullResult(null);
          }}
        />
      )}

      <RevealSingleModal
        visible={!!revealResult}
        item={revealResult?.items[revealIndex] ?? null}
        itemIndex={revealIndex}
        itemCount={revealResult?.items.length}
        onClose={() => {
          // TODO: replace this one-at-a-time loop with a real grid
          // RevealMultipleModal (select-all + batch swap) per SPEC.md.
          if (revealResult && revealIndex < revealResult.items.length - 1) {
            setRevealIndex((current) => current + 1);
          } else {
            setRevealResult(null);
            setRevealIndex(0);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  wideContainer: {
    maxWidth: 1200,
  },
  topRow: {
    gap: 16,
  },
  topRowDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  machineColumn: {
    marginBottom: 16,
  },
  machineColumnDesktop: {
    flex: 1,
    marginBottom: 0,
  },
  machineImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  purchaseColumn: {
    gap: 4,
  },
  purchaseColumnDesktop: {
    flex: 1,
  },
  machineName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  machineDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  points: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  promoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  startRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  startButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  bottomRow: {
    marginTop: 32,
    gap: 24,
  },
  bottomRowDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  section: {
    marginBottom: 8,
  },
  sectionDesktop: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  topItemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  topItemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 8,
    gap: 4,
  },
  topItemImage: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  topItemName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
  topItemValue: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "700",
  },
  recentPullsList: {
    gap: 8,
  },
  recentPullRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 8,
  },
  recentPullImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  recentPullInfo: {
    flex: 1,
    gap: 2,
  },
  recentPullName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  recentPullUser: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  recentPullValue: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "700",
  },
});
