import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import {
  MODAL_BACKDROP_COLOR,
  MODAL_CARD_MAX_WIDTH,
  MODAL_OVERLAY_PADDING,
} from "../theme/modalCard";
import { shape } from "../theme/shape";
import type { ClawItem } from "../types/claw";
import { formatCurrency } from "../utils/currency";
import { ItemCard } from "./ItemCard";

interface WhatYouCanPullScreenProps {
  itemPool: ClawItem[];
  onContinue: () => void;
  /**
   * When true (default), wraps the content in its own backdrop + <Modal>,
   * matching `PaymentModal`'s standalone behavior. When false, returns just
   * the card content (no backdrop, no <Modal>) so it can be embedded in
   * another container, e.g. `PurchaseFlowModal`.
   */
  renderAsModal?: boolean;
}

// How long each item stays on screen before advancing to the next one.
const CAROUSEL_ADVANCE_INTERVAL_MS = 2000;
const CROSSFADE_DURATION_MS = 300;
const MIN_DELAY_MS = 8000;
const MAX_DELAY_MS = 10000;
// One full rotation of the "Do Not Refresh" loading icon.
const ROTATION_DURATION_MS = 900;

/**
 * Pre-animation screen shown right after payment confirmation and before the
 * claw/box opening video plays. Previews the machine's item pool one item at
 * a time, crossfading to the next every second (looping back to the first
 * after the last), while a randomized 8-10s delay runs independently, then
 * calls `onContinue()` automatically — "Do Not Refresh" is purely decorative
 * here, it isn't pressable.
 */
export function WhatYouCanPullScreen({
  itemPool,
  onContinue,
  renderAsModal = true,
}: WhatYouCanPullScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemOpacity] = useState(() => new Animated.Value(1));
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [rotateAnim] = useState(() => new Animated.Value(0));
  // Computed once (lazily) so the progress bar and the auto-continue timer
  // animate over the exact same randomized duration instead of drifting apart.
  const [delayMs] = useState(
    () => MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS),
  );

  useEffect(() => {
    if (itemPool.length === 0) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % itemPool.length);
    }, CAROUSEL_ADVANCE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [itemPool.length]);

  useEffect(() => {
    itemOpacity.setValue(0);
    Animated.timing(itemOpacity, {
      toValue: 1,
      duration: CROSSFADE_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, itemOpacity]);

  // Read via a ref (not the `onContinue` prop directly) so a parent re-render
  // passing a new function identity doesn't restart the delay.
  const onContinueRef = useRef(onContinue);
  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  // Fills the progress bar over the same delay used to trigger onContinue.
  useEffect(() => {
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: delayMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progressAnim, delayMs]);

  // Spins the loading icon while the delay is active, then fires
  // onContinue — the rotation is explicitly stopped (not just hidden) both
  // when the delay elapses and on unmount, so no animation loop leaks.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: ROTATION_DURATION_MS,
        easing: Easing.linear,
        // useNativeDriver: true breaks Animated.loop on web — react-native-web
        // has no real native driver, so Animated.loop's "is this using the
        // native driver?" check (based on the raw config flag, not whether
        // native driver actually engaged) takes the native single-shot path
        // instead of its JS-thread restart loop, spinning once then freezing.
        useNativeDriver: false,
      }),
    );
    loop.start();

    const timer = setTimeout(() => {
      loop.stop();
      onContinueRef.current();
    }, delayMs);

    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [rotateAnim, delayMs]);

  const currentItem = itemPool[currentIndex];

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const spinnerRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const content = (
    <View style={styles.modalCard}>
      <Text style={styles.title}>What you can pull</Text>

      {currentItem && (
        <Animated.View
          key={`${currentItem.id}-${currentIndex}`}
          style={[styles.card, { opacity: itemOpacity }]}
        >
          <ItemCard item={currentItem} hideCaption={true} />

          <View style={styles.dotsRow} testID="pull-carousel-dots">
            {itemPool.map((poolItem, index) => (
              <View
                key={poolItem.id}
                style={[styles.dot, index === currentIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Text
            style={styles.cardValue}
            testID={`pull-item-value-${currentItem.id}`}
          >
            {`Approx market value: ${formatCurrency(currentItem.fairMarketValue)}`}
          </Text>
        </Animated.View>
      )}

      <View
        style={[styles.continueButton, styles.continueButtonDisabled]}
        testID="do-not-refresh-button"
      >
        <Animated.View
          style={[styles.continueButtonProgress, { width: progressWidth }]}
        />
        <View style={styles.continueButtonContent}>
          <Animated.View
            style={[
              styles.spinner,
              { transform: [{ rotate: spinnerRotation }] },
            ]}
          />
          <Text style={styles.continueButtonText}>Do Not Refresh</Text>
        </View>
      </View>
    </View>
  );

  if (!renderAsModal) {
    return content;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>{content}</View>
    </Modal>
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
  modalCard: {
    width: "100%",
    maxWidth: MODAL_CARD_MAX_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: shape.modalCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    gap: 24,
    alignItems: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    width: "100%",
    // TODO: fine-tune against Figma once rendered — ItemCard's own frame
    // padding means this maxWidth may need adjusting.
    maxWidth: 280,
    alignItems: "center",
    gap: 12,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: shape.circle,
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.textPrimary,
  },
  cardValue: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  continueButton: {
    width: "100%",
    maxWidth: 420,
    height: 48,
    borderRadius: shape.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonProgress: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.goldDark,
  },
  continueButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: shape.circle,
    borderWidth: 2,
    borderColor: "rgba(13, 13, 13, 0.35)",
    borderTopColor: colors.background,
  },
  continueButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
});
