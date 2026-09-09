import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useWallet } from "../context/WalletContext";
import { useResponsive } from "../hooks/useResponsive";
import { purchasePull } from "../services/clawService";
import { colors } from "../theme/colors";
import {
  MODAL_BACKDROP_COLOR,
  MODAL_CARD_MAX_WIDTH,
  MODAL_OVERLAY_PADDING,
} from "../theme/modalCard";
import { radius, shape } from "../theme/shape";
import type { PaymentMethod, PullResult, SvgIcon } from "../types/claw";
import { formatCurrency } from "../utils/currency";
import { CreditDebitSimulationModal } from "./CreditDebitSimulationModal";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: PullResult) => void;
  machineId: string;
  machineName: string;
  /** Selected claw machine's own icon, shown in the order summary. */
  machineIcon: SvgIcon;
  quantity: number;
  totalPrice: number;
  pointsPerPull: number;
  /**
   * When true (default), wraps the content in its own backdrop + <Modal>,
   * matching the original standalone behavior. When false, returns just the
   * card content (no backdrop, no <Modal>) so it can be embedded in another
   * container, e.g. `PurchaseFlowModal`.
   */
  renderAsModal?: boolean;
}

/** Picks the first payment method with enough balance for `totalPrice`, prioritizing Beezie wallet, then external wallet, falling back to credit/debit. */
function pickDefaultMethod(
  totalPrice: number,
  beezieBalance: number,
  externalBalance: number,
): PaymentMethod {
  if (beezieBalance >= totalPrice) {
    return "beezie-wallet";
  }
  if (externalBalance >= totalPrice) {
    return "external-wallet";
  }
  return "credit-debit";
}

/**
 * "Review & pay" modal: lets the user pick a payment method (Beezie wallet,
 * external wallet, or credit/debit) and confirms the purchase. Beezie wallet
 * deducts from the shared wallet balance; external wallet has its own
 * (currently static) balance; either is disabled with an "Insufficient
 * funds" message when it can't cover the total; credit/debit opens a
 * simulated gateway modal. The default selection is whichever wallet can
 * afford the total first (Beezie, then external), recalculated whenever the
 * total or either balance changes.
 */
export function PaymentModal({
  visible,
  onClose,
  onConfirm,
  machineId,
  machineName,
  machineIcon,
  quantity,
  totalPrice,
  pointsPerPull,
  renderAsModal = true,
}: PaymentModalProps) {
  const { isMobile } = useResponsive();
  const { beezieBalance, externalBalance, canAfford, deduct } = useWallet();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(() =>
    pickDefaultMethod(totalPrice, beezieBalance, externalBalance),
  );
  // Tracks the inputs the current `selectedMethod` was auto-picked from, so
  // we can recompute it (adjust state during render) if the total or either
  // balance changes, without re-running on every unrelated render.
  const [autoSelectInputs, setAutoSelectInputs] = useState({
    totalPrice,
    beezieBalance,
    externalBalance,
  });
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreditDebitOpen, setIsCreditDebitOpen] = useState(false);
  const [creditDebitError, setCreditDebitError] = useState<string | null>(null);

  if (
    autoSelectInputs.totalPrice !== totalPrice ||
    autoSelectInputs.beezieBalance !== beezieBalance ||
    autoSelectInputs.externalBalance !== externalBalance
  ) {
    setAutoSelectInputs({ totalPrice, beezieBalance, externalBalance });
    setSelectedMethod(
      pickDefaultMethod(totalPrice, beezieBalance, externalBalance),
    );
  }

  const totalPoints = pointsPerPull * quantity;
  const isBeezieWalletDisabled = beezieBalance < totalPrice;
  const isExternalWalletDisabled = externalBalance < totalPrice;

  const resetAndClose = () => {
    setError(null);
    setCreditDebitError(null);
    setIsCreditDebitOpen(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (selectedMethod === "credit-debit") {
      setIsCreditDebitOpen(true);
      return;
    }

    if (selectedMethod === "beezie-wallet" && !canAfford(totalPrice)) {
      setError("Insufficient balance. Please top up your Beezie wallet.");
      return;
    }

    if (selectedMethod === "external-wallet" && isExternalWalletDisabled) {
      // Confirm is disabled in this case, this is just a safety net.
      return;
    }

    setIsPurchasing(true);
    setError(null);
    try {
      const result = await purchasePull(machineId, quantity, selectedMethod);
      if (selectedMethod === "beezie-wallet") {
        deduct(totalPrice);
      }
      onConfirm(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the payment. Please try again.",
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSimulateCardSuccess = async () => {
    setIsPurchasing(true);
    setCreditDebitError(null);
    try {
      const result = await purchasePull(machineId, quantity, "credit-debit");
      setIsCreditDebitOpen(false);
      onConfirm(result);
    } catch (err) {
      setCreditDebitError(
        err instanceof Error
          ? err.message
          : "Unable to complete the payment. Please try again.",
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSimulateCardError = () => {
    setCreditDebitError(
      "Your card was declined. Please try again or use another payment method.",
    );
  };

  const isConfirmDisabled =
    isPurchasing ||
    (selectedMethod === "external-wallet" && isExternalWalletDisabled) ||
    (selectedMethod === "beezie-wallet" && isBeezieWalletDisabled);

  const cardContent = (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Review & pay</Text>
        <Pressable
          style={styles.closeIconButton}
          onPress={resetAndClose}
          disabled={isPurchasing}
        >
          <Text style={styles.closeIconText}>✕</Text>
        </Pressable>
      </View>

      {isMobile ? (
        <>
          <View style={styles.tabsRow}>
            <Pressable
              style={[
                styles.tabButton,
                selectedMethod !== "credit-debit" && styles.tabButtonSelected,
              ]}
              onPress={() => {
                if (selectedMethod === "credit-debit") {
                  setSelectedMethod(
                    pickDefaultMethod(
                      totalPrice,
                      beezieBalance,
                      externalBalance,
                    ),
                  );
                }
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedMethod !== "credit-debit" &&
                    styles.tabButtonTextSelected,
                ]}
              >
                Wallet
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabButton,
                selectedMethod === "credit-debit" && styles.tabButtonSelected,
              ]}
              onPress={() => setSelectedMethod("credit-debit")}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedMethod === "credit-debit" &&
                    styles.tabButtonTextSelected,
                ]}
              >
                Credit / Debit
              </Text>
            </Pressable>
          </View>

          <View>
            <Text style={styles.sectionLabel}>Summary</Text>
            <SummaryCard
              machineName={machineName}
              machineIcon={machineIcon}
              quantity={quantity}
              totalPrice={totalPrice}
              totalPoints={totalPoints}
              compact
            />
          </View>

          {selectedMethod === "credit-debit" ? (
            <View style={styles.coinflowPlaceholder}>
              <Text style={styles.coinflowPlaceholderText}>
                Coinflow widget
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionLabel}>Choose Wallet</Text>
              <View style={styles.walletCardsRow}>
                <WalletOptionCard
                  label="Beezie wallet"
                  valueLabel={formatCurrency(beezieBalance)}
                  selected={selectedMethod === "beezie-wallet"}
                  onPress={() => setSelectedMethod("beezie-wallet")}
                  disabled={isBeezieWalletDisabled}
                  insufficientFunds={isBeezieWalletDisabled}
                />
                <WalletOptionCard
                  label="External wallet"
                  valueLabel={formatCurrency(externalBalance)}
                  selected={selectedMethod === "external-wallet"}
                  onPress={() => setSelectedMethod("external-wallet")}
                  disabled={isExternalWalletDisabled}
                  insufficientFunds={isExternalWalletDisabled}
                />
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Pay with</Text>

            <PaymentOption
              testID="payment-option-beezie-wallet"
              label="Beezie wallet"
              valueLabel={
                isBeezieWalletDisabled
                  ? undefined
                  : formatCurrency(beezieBalance)
              }
              subLabel={
                isBeezieWalletDisabled ? "Insufficient funds" : undefined
              }
              subLabelVariant="danger"
              selected={selectedMethod === "beezie-wallet"}
              onPress={() => setSelectedMethod("beezie-wallet")}
              disabled={isBeezieWalletDisabled}
            />
            <PaymentOption
              testID="payment-option-external-wallet"
              label="External wallet"
              valueLabel={
                isExternalWalletDisabled
                  ? undefined
                  : formatCurrency(externalBalance)
              }
              subLabel={
                isExternalWalletDisabled ? "Insufficient funds" : undefined
              }
              subLabelVariant="danger"
              selected={selectedMethod === "external-wallet"}
              onPress={() => setSelectedMethod("external-wallet")}
              disabled={isExternalWalletDisabled}
            />
            <PaymentOption
              testID="payment-option-credit-debit"
              label="Credit / Debit"
              subLabel="Processing fees may apply"
              selected={selectedMethod === "credit-debit"}
              onPress={() => setSelectedMethod("credit-debit")}
            />
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Summary</Text>
            <SummaryCard
              machineName={machineName}
              machineIcon={machineIcon}
              quantity={quantity}
              totalPrice={totalPrice}
              totalPoints={totalPoints}
            />
          </View>
        </View>
      )}

      {error && (
        <Text testID="payment-error" style={styles.errorText}>
          {error}
        </Text>
      )}

      <Pressable
        testID="confirm-button"
        style={[
          styles.confirmButton,
          isConfirmDisabled && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={isConfirmDisabled}
      >
        {isPurchasing ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.confirmButtonText}>Confirm</Text>
        )}
      </Pressable>
    </View>
  );

  const creditDebitModal = (
    <CreditDebitSimulationModal
      visible={isCreditDebitOpen}
      onClose={() => {
        setCreditDebitError(null);
        setIsCreditDebitOpen(false);
      }}
      onSimulateSuccess={handleSimulateCardSuccess}
      onSimulateError={handleSimulateCardError}
      isProcessing={isPurchasing}
      errorMessage={creditDebitError}
    />
  );

  if (!renderAsModal) {
    return (
      <>
        {cardContent}
        {creditDebitModal}
      </>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>{cardContent}</View>
      {creditDebitModal}
    </Modal>
  );
}

interface PaymentOptionProps {
  label: string;
  valueLabel?: string;
  subLabel?: string;
  /** "danger" renders `subLabel` (e.g. "Insufficient funds") in the warning color instead of the default muted one. */
  subLabelVariant?: "muted" | "danger";
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

function PaymentOption({
  label,
  valueLabel,
  subLabel,
  subLabelVariant = "muted",
  selected,
  onPress,
  disabled,
  testID,
}: PaymentOptionProps) {
  return (
    <Pressable
      testID={testID}
      style={[
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        <View>
          <Text style={styles.optionLabel}>{label}</Text>
          {subLabel && (
            <Text
              style={[
                styles.optionSubLabel,
                subLabelVariant === "danger" && styles.optionSubLabelDanger,
              ]}
            >
              {subLabel}
            </Text>
          )}
        </View>
      </View>
      {valueLabel && <Text style={styles.optionValue}>{valueLabel}</Text>}
    </Pressable>
  );
}

interface SummaryCardProps {
  machineName: string;
  machineIcon: SvgIcon;
  quantity: number;
  totalPrice: number;
  totalPoints: number;
  /** Mobile layout: quantity inline under the name, no pill/rows. */
  compact?: boolean;
}

function SummaryCard({
  machineName,
  machineIcon: MachineIcon,
  quantity,
  totalPrice,
  totalPoints,
  compact,
}: SummaryCardProps) {
  if (compact) {
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryItemRow}>
          <View style={styles.summaryImage}>
            <MachineIcon width={32} height={32} />
          </View>
          <View style={styles.summaryItemInfo}>
            <Text style={styles.summaryItemName}>{machineName}</Text>
            <Text style={styles.summaryQuantityText}>Quantity: {quantity}</Text>
          </View>
          <View style={styles.summaryPriceColumn}>
            <Text style={styles.summaryPriceValue}>
              {formatCurrency(totalPrice)}
            </Text>
            <Text style={styles.summaryPointsPlain}>
              +{totalPoints.toLocaleString("en-US")} pts
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryItemRow}>
        <View style={styles.summaryImage}>
          <MachineIcon width={32} height={32} />
        </View>
        <View style={styles.summaryItemInfo}>
          <Text style={styles.summaryItemName}>{machineName}</Text>
          <Text style={styles.summaryItemPrice}>
            {formatCurrency(totalPrice / quantity)}
          </Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>
            +{totalPoints.toLocaleString("en-US")} pts
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Quantity</Text>
        <Text style={styles.summaryValue}>{quantity}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
      </View>
    </View>
  );
}

interface WalletOptionCardProps {
  label: string;
  valueLabel: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Shows "Insufficient funds" in place of `valueLabel` when true. */
  insufficientFunds?: boolean;
}

function WalletOptionCard({
  label,
  valueLabel,
  selected,
  onPress,
  disabled,
  insufficientFunds,
}: WalletOptionCardProps) {
  return (
    <Pressable
      style={[
        styles.walletCard,
        selected && styles.walletCardSelected,
        disabled && styles.optionDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <View style={styles.walletCardHeader}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        <Text style={styles.walletCardLabel}>{label}</Text>
      </View>
      {insufficientFunds ? (
        <Text style={styles.walletCardInsufficientText}>
          Insufficient funds
        </Text>
      ) : (
        <Text style={styles.walletCardValue}>{valueLabel}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: MODAL_BACKDROP_COLOR,
    alignItems: "center",
    justifyContent: "center",
    padding: MODAL_OVERLAY_PADDING,
  },
  card: {
    width: "100%",
    maxWidth: MODAL_CARD_MAX_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: shape.modalCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  closeIconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIconText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  contentRow: {
    flexDirection: "row",
    gap: 32,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: shape.secondaryControl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  tabButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  tabButtonTextSelected: {
    color: colors.background,
  },
  walletCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  walletCard: {
    flex: 1,
    borderRadius: shape.secondaryCard,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: 14,
    gap: 6,
  },
  walletCardSelected: {
    borderColor: colors.gold,
  },
  walletCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletCardLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  walletCardValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  walletCardInsufficientText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  coinflowPlaceholder: {
    minHeight: 120,
    borderRadius: shape.secondaryCard,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  coinflowPlaceholderText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: shape.secondaryCard,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  optionSelected: {
    borderColor: colors.gold,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: shape.circle,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.gold,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: shape.circle,
    backgroundColor: colors.gold,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  optionSubLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  optionValue: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionSubLabelDanger: {
    color: colors.danger,
  },
  summaryCard: {
    borderRadius: shape.secondaryCard,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: 16,
    gap: 12,
  },
  summaryItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryImage: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryItemInfo: {
    flex: 1,
    gap: 2,
  },
  summaryItemName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryItemPrice: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryQuantityText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  summaryPriceColumn: {
    alignItems: "flex-end",
    gap: 4,
  },
  summaryPriceValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryPointsPlain: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  pointsBadge: {
    backgroundColor: "rgba(245, 197, 24, 0.12)",
    borderRadius: shape.circle,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pointsBadgeText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
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
  confirmButton: {
    height: 48,
    borderRadius: shape.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 15,
  },
});
