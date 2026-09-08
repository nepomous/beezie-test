import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import summaryImage from "../assets/Solana Claw.webp";
import { useWallet } from "../context/WalletContext";
import { useResponsive } from "../hooks/useResponsive";
import { purchasePull } from "../services/clawService";
import { colors } from "../theme/colors";
import {
  MODAL_BACKDROP_COLOR,
  MODAL_CARD_MAX_WIDTH,
  MODAL_OVERLAY_PADDING,
} from "../theme/modalCard";
import { shape } from "../theme/shape";
import type { PaymentMethod, PullResult } from "../types/claw";
import { formatCurrency } from "../utils/currency";
import { CreditDebitSimulationModal } from "./CreditDebitSimulationModal";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: PullResult) => void;
  machineId: string;
  machineName: string;
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

// Fixed placeholder balance — external wallet linking isn't implemented yet.
const EXTERNAL_WALLET_BALANCE = 0;

/**
 * "Review & pay" modal: lets the user pick a payment method (Beezie wallet,
 * external wallet, or credit/debit) and confirms the purchase. Beezie wallet
 * deducts from the shared wallet balance; external wallet is always empty
 * (disabled); credit/debit opens a simulated gateway modal.
 */
export function PaymentModal({
  visible,
  onClose,
  onConfirm,
  machineId,
  machineName,
  quantity,
  totalPrice,
  pointsPerPull,
  renderAsModal = true,
}: PaymentModalProps) {
  const { isMobile } = useResponsive();
  const { balance, canAfford, deduct } = useWallet();
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("beezie-wallet");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreditDebitOpen, setIsCreditDebitOpen] = useState(false);
  const [creditDebitError, setCreditDebitError] = useState<string | null>(null);

  const totalPoints = pointsPerPull * quantity;
  const isExternalWalletDisabled = EXTERNAL_WALLET_BALANCE < totalPrice;

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

    if (selectedMethod === "external-wallet") {
      // Confirm is disabled in this case, this is just a safety net.
      return;
    }

    if (!canAfford(totalPrice)) {
      setError("Insufficient balance. Please top up your Beezie wallet.");
      return;
    }

    setIsPurchasing(true);
    setError(null);
    try {
      const result = await purchasePull(machineId, quantity, selectedMethod);
      deduct(totalPrice);
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
    (selectedMethod === "external-wallet" && isExternalWalletDisabled);

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
                  setSelectedMethod("beezie-wallet");
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
                  valueLabel={formatCurrency(balance)}
                  selected={selectedMethod === "beezie-wallet"}
                  onPress={() => setSelectedMethod("beezie-wallet")}
                />
                <WalletOptionCard
                  label="External wallet"
                  valueLabel={formatCurrency(EXTERNAL_WALLET_BALANCE)}
                  selected={selectedMethod === "external-wallet"}
                  onPress={() => setSelectedMethod("external-wallet")}
                  muted
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
              label="Beezie wallet"
              valueLabel={formatCurrency(balance)}
              selected={selectedMethod === "beezie-wallet"}
              onPress={() => setSelectedMethod("beezie-wallet")}
            />
            <PaymentOption
              label="External wallet"
              valueLabel={formatCurrency(EXTERNAL_WALLET_BALANCE)}
              selected={selectedMethod === "external-wallet"}
              onPress={() => setSelectedMethod("external-wallet")}
            />
            <PaymentOption
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
              quantity={quantity}
              totalPrice={totalPrice}
              totalPoints={totalPoints}
            />
          </View>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
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
  selected: boolean;
  onPress: () => void;
}

function PaymentOption({
  label,
  valueLabel,
  subLabel,
  selected,
  onPress,
}: PaymentOptionProps) {
  return (
    <Pressable
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        <View>
          <Text style={styles.optionLabel}>{label}</Text>
          {subLabel && <Text style={styles.optionSubLabel}>{subLabel}</Text>}
        </View>
      </View>
      {valueLabel && <Text style={styles.optionValue}>{valueLabel}</Text>}
    </Pressable>
  );
}

interface SummaryCardProps {
  machineName: string;
  quantity: number;
  totalPrice: number;
  totalPoints: number;
  /** Mobile layout: quantity inline under the name, no pill/rows. */
  compact?: boolean;
}

function SummaryCard({
  machineName,
  quantity,
  totalPrice,
  totalPoints,
  compact,
}: SummaryCardProps) {
  if (compact) {
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryItemRow}>
          <Image source={summaryImage} style={styles.summaryImage} />
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
        <Image source={summaryImage} style={styles.summaryImage} />
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
  /** External wallet: always shows a placeholder $0 balance. */
  muted?: boolean;
}

function WalletOptionCard({
  label,
  valueLabel,
  selected,
  onPress,
  muted,
}: WalletOptionCardProps) {
  return (
    <Pressable
      style={[styles.walletCard, selected && styles.walletCardSelected]}
      onPress={onPress}
    >
      <View style={styles.walletCardHeader}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        <Text style={[styles.walletCardLabel, muted && styles.walletCardMuted]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.walletCardValue, muted && styles.walletCardMuted]}>
        {valueLabel}
      </Text>
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
  walletCardMuted: {
    color: colors.textMuted,
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
  summaryCard: {
    borderRadius: 12,
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
    borderRadius: 8,
    backgroundColor: colors.surface,
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
