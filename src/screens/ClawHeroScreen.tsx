import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ClawOpeningAnimation } from "../components/ClawOpeningAnimation";
import mockPackageLarge from "../assets/mock_package_large.png";
import mockPackageSmall from "../assets/mock_package_small.png";
import { MachineIdleVideo } from "../components/MachineIdleVideo";
import { MoreClawMachines } from "../components/MoreClawMachines";
import { OddsTable } from "../components/OddsTable";
import { PurchaseFlowModal } from "../components/PurchaseFlowModal";
import { QuantityStepper } from "../components/QuantityStepper";
import { RevealMultipleModal } from "../components/RevealMultipleModal";
import { ResponsiveContainer } from "../components/ResponsiveContainer";
import { RevealSingleModal } from "../components/RevealSingleModal";
import { useResponsive } from "../hooks/useResponsive";
import type { ClawMachineSummary } from "../mocks/clawMachines";
import {
  getClawMachine,
  getMoreClawMachines,
  getRecentPulls,
} from "../services/clawService";
import { colors } from "../theme/colors";
import { radius, shape } from "../theme/shape";
import type { ClawMachine, PullResult, RecentPull } from "../types/claw";
import { formatCurrency } from "../utils/currency";

const TOP_ITEMS_COUNT = 6;
const MAX_QUANTITY = 10;

export function ClawHeroScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isMobile } = useResponsive();
  const [machine, setMachine] = useState<ClawMachine | null>(null);
  const [recentPulls, setRecentPulls] = useState<RecentPull[]>([]);
  const [moreClawMachines, setMoreClawMachines] = useState<
    ClawMachineSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [pendingPullResult, setPendingPullResult] = useState<PullResult | null>(
    null,
  );
  const [activePullResult, setActivePullResult] = useState<PullResult | null>(
    null,
  );
  const [revealResult, setRevealResult] = useState<PullResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // The machine itself is looked up by `slug` (the URL segment), but
    // recent pulls / other machines are keyed by the machine's internal
    // `id` — so those two calls must wait until the machine resolves.
    getClawMachine(slug)
      .then((machineData) =>
        Promise.all([
          machineData,
          getRecentPulls(machineData.id),
          getMoreClawMachines(machineData.id),
        ]),
      )
      .then(([machineData, pullsData, moreMachinesData]) => {
        if (!isMounted) return;
        setMachine(machineData);
        setRecentPulls(pullsData);
        setMoreClawMachines(moreMachinesData);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load the claw machine.",
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [loadAttempt, slug]);

  if (loadError) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{loadError}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoadError(null);
            setIsLoading(true);
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
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
  const isInStock = machine.inStock;

  const handleApplyPromoCode = () => {
    // No promo code is valid — this is intentional, see README "Scope decisions".
    setPromoError("That code is not valid or has expired.");
  };

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
              <MachineIdleVideo style={styles.machineImage} />
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

              <View style={styles.promoRow}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Enter Code"
                  placeholderTextColor={colors.textMuted}
                  value={promoCode}
                  onChangeText={(text) => {
                    setPromoCode(text);
                    setPromoError(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <Pressable
                  style={styles.promoApplyButton}
                  onPress={handleApplyPromoCode}
                >
                  <Text style={styles.promoApplyButtonText}>Apply</Text>
                </Pressable>
              </View>
              {promoError && (
                <Text style={styles.promoError}>{promoError}</Text>
              )}

              <OddsTable
                odds={machine.odds}
                averageValue={machine.averageValue}
              />

              <View style={styles.startRow}>
                <QuantityStepper
                  quantity={quantity}
                  onChange={setQuantity}
                  max={MAX_QUANTITY}
                  disabled={!isInStock}
                />
                <Pressable
                  style={[
                    styles.startButton,
                    !isInStock && styles.startButtonDisabled,
                  ]}
                  onPress={() => setIsPaymentOpen(true)}
                  disabled={!isInStock}
                >
                  <Text style={styles.startButtonText}>
                    {isInStock ? "Start Now" : "Restocking Soon"}
                  </Text>
                </Pressable>
              </View>
              {!isInStock && (
                <Text style={styles.restockingMessage}>
                  This machine is out of inventory and is being restocked. Try
                  another machine below.
                </Text>
              )}

              <MoreClawMachines machines={moreClawMachines} />
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
                      source={
                        item.imageUrl
                          ? { uri: item.imageUrl }
                          : mockPackageLarge
                      }
                      style={styles.topItemImage}
                      resizeMode="contain"
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
                      source={
                        pull.item.imageUrl
                          ? { uri: pull.item.imageUrl }
                          : mockPackageSmall
                      }
                      style={styles.recentPullImage}
                      resizeMode="contain"
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

      <PurchaseFlowModal
        stage={
          isPaymentOpen
            ? "payment"
            : pendingPullResult
              ? "whatYouCanPull"
              : null
        }
        onClose={() => setIsPaymentOpen(false)}
        onConfirm={(result) => {
          setIsPaymentOpen(false);
          setPendingPullResult(result);
        }}
        machine={machine}
        quantity={quantity}
        totalPrice={totalPrice}
        pointsPerPull={machine.pointsPerPull}
        itemPool={machine.itemPool}
        onContinue={() => {
          setActivePullResult(pendingPullResult);
          setPendingPullResult(null);
        }}
      />

      {activePullResult && (
        <ClawOpeningAnimation
          videoUrl={machine.videoOpeningUrl}
          onAnimationEnd={() => {
            setRevealResult(activePullResult);
            setActivePullResult(null);
          }}
        />
      )}

      {revealResult && revealResult.items.length > 1 ? (
        <RevealMultipleModal
          visible
          items={revealResult.items}
          expiresAt={revealResult.expiresAt}
          onClose={() => {
            setRevealResult(null);
          }}
        />
      ) : (
        <RevealSingleModal
          visible={!!revealResult}
          item={revealResult?.items[0] ?? null}
          onClose={() => {
            setRevealResult(null);
          }}
        />
      )}
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
    borderRadius: shape.button,
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
    borderRadius: radius.lg,
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
  promoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  promoInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    fontSize: 14,
  },
  promoApplyButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: shape.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  promoApplyButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "700",
  },
  promoError: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
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
    borderRadius: shape.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonDisabled: {
    backgroundColor: colors.goldMuted,
  },
  restockingMessage: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
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
    borderRadius: shape.secondaryCard,
    padding: 8,
    gap: 4,
  },
  topItemImage: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: radius.sm,
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
    borderRadius: shape.secondaryCard,
    padding: 8,
  },
  recentPullImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
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
