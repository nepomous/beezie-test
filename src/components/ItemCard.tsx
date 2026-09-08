import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import mockReward from "../assets/mock_reward.png";
import { colors } from "../theme/colors";
import { shape } from "../theme/shape";
import type { ClawItem } from "../types/claw";
import { formatCurrency } from "../utils/currency";

const PRESSED_OPACITY = 0.85;

interface ItemCardProps {
  item: ClawItem;
  style?: StyleProp<ViewStyle>;
  /** Shows a select/deselect badge over the image when provided. */
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Shows a "Swap for $X" footer button when provided, with a loading state. */
  swapping?: boolean;
  onSwap?: () => void;
  /** When set while `swapping` is true, animates a fill bar across the swap button over this exact duration (ms). Omit to keep the plain spinner-only loading state. */
  swapDurationMs?: number;
  /** Overrides the caption text (defaults to `item.name`). */
  caption?: string;
  /** When true, hides the caption/name text entirely. */
  hideCaption?: boolean;
}

/**
 * Standard item card used across item grids/reveals: item image, an
 * optional select badge overlay, the item name, and an optional swap
 * button. Selecting or swapping animates itself in response to prop
 * changes, so callers only need to manage the underlying state.
 */
export function ItemCard({
  item,
  style,
  selected = false,
  onToggleSelect,
  caption,
  hideCaption = false,
  swapping = false,
  onSwap,
  swapDurationMs,
}: ItemCardProps) {
  const [badgeScale] = useState(() => new Animated.Value(1));
  const [swapOpacity] = useState(() => new Animated.Value(1));
  const [swapProgress] = useState(() => new Animated.Value(0));
  const isFirstSelectRender = useRef(true);
  const isFirstSwapRender = useRef(true);

  useEffect(() => {
    if (isFirstSelectRender.current) {
      isFirstSelectRender.current = false;
      return;
    }
    badgeScale.setValue(1);
    Animated.sequence([
      Animated.spring(badgeScale, {
        toValue: 1.15,
        speed: 40,
        bounciness: 12,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        speed: 40,
        bounciness: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected, badgeScale]);

  useEffect(() => {
    if (isFirstSwapRender.current) {
      isFirstSwapRender.current = false;
      return;
    }
    if (!swapping) return;
    Animated.sequence([
      Animated.timing(swapOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(swapOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [swapping, swapOpacity]);

  // Mirrors `progressAnim` in WhatYouCanPullScreen: fills over the exact
  // caller-provided duration, and resets so the next swap starts from 0.
  useEffect(() => {
    if (!swapping || !swapDurationMs) {
      swapProgress.setValue(0);
      return undefined;
    }
    const animation = Animated.timing(swapProgress, {
      toValue: 1,
      duration: swapDurationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [swapping, swapDurationMs, swapProgress]);

  const swapProgressWidth = swapProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.cardSurface, style]}>
      <View style={styles.imageBox}>
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : mockReward}
          style={styles.cardImage}
          resizeMode="contain"
          testID={`card-image-${item.id}`}
        />
        {onToggleSelect && (
          <Animated.View
            style={[
              styles.selectBadgeWrapper,
              { transform: [{ scale: badgeScale }] },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.selectBadge,
                selected && styles.selectBadgeSelected,
                pressed && styles.pressedOpacity,
              ]}
              onPress={onToggleSelect}
              disabled={swapping}
              hitSlop={8}
              testID={`select-badge-${item.id}`}
              accessibilityRole="button"
              accessibilityLabel={
                selected ? `Deselect ${item.name}` : `Select ${item.name}`
              }
            >
              <Text
                style={[
                  styles.selectBadgeText,
                  selected && styles.selectBadgeTextSelected,
                ]}
              >
                {selected ? "✓" : "+"}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
      {!hideCaption && (
        <View style={styles.cardContent}>
          <Text
            style={styles.cardName}
            numberOfLines={2}
            testID={`item-card-caption-${item.id}`}
          >
            {caption ?? item.name}
          </Text>

          {onSwap && (
            <Pressable
              style={({ pressed }) => [
                styles.swapButton,
                swapping && styles.swapButtonDisabled,
                pressed && styles.pressedOpacity,
              ]}
              onPress={onSwap}
              disabled={swapping}
              testID={`swap-button-${item.id}`}
            >
              {swapping && typeof swapDurationMs === "number" && (
                <Animated.View
                  testID={`swap-progress-${item.id}`}
                  style={[
                    styles.swapProgressFill,
                    { width: swapProgressWidth },
                  ]}
                />
              )}
              <Animated.View style={{ opacity: swapOpacity }}>
                {swapping ? (
                  <View style={styles.swappingRow}>
                    <ActivityIndicator color={colors.background} size="small" />
                    <Text style={styles.swapButtonText}>SWAP in progress</Text>
                  </View>
                ) : (
                  <Text style={styles.swapButtonText}>
                    {`Swap for ${formatCurrency(item.fairMarketValue)}`}
                  </Text>
                )}
              </Animated.View>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardSurface: {
    width: "100%",
    borderRadius: shape.itemCardFrame,
    backgroundColor: colors.cardFrame,
    padding: 4,
  },
  imageBox: {
    position: "relative",
    aspectRatio: 1,
    padding: 30,
    borderRadius: shape.itemCardInner,
    backgroundColor: colors.cardSurface,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  selectBadgeWrapper: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  selectBadge: {
    width: 24,
    height: 24,
    borderRadius: shape.circle,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  selectBadgeSelected: {
    backgroundColor: colors.gold,
  },
  selectBadgeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  selectBadgeTextSelected: {
    color: colors.background,
  },
  cardContent: {
    gap: 8,
    padding: 12,
  },
  cardName: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  swapButton: {
    height: 36,
    borderRadius: shape.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  swapButtonDisabled: {
    backgroundColor: colors.goldMuted,
  },
  swapProgressFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.goldDark,
  },
  swappingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swapButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: "700",
  },
  pressedOpacity: {
    opacity: PRESSED_OPACITY,
  },
});
