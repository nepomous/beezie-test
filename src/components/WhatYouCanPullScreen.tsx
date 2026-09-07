import { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";

import mockReward from "../assets/mock_reward.png";
import { colors } from "../theme/colors";
import type { ClawItem } from "../types/claw";
import { formatCurrency } from "../utils/currency";

interface WhatYouCanPullScreenProps {
  itemPool: ClawItem[];
  onContinue: () => void;
}

const CARD_WIDTH = 240;
const CARD_GAP = 16;

/**
 * Pre-animation screen shown right after payment confirmation and before the
 * claw/box opening video plays. Previews the machine's item pool in a
 * horizontal carousel alongside a "Do Not Refresh" warning.
 *
 * This screen only advances on tap (`onContinue`) — it does not auto-advance
 * after a timeout. TODO: revisit if product wants a timed auto-advance here.
 */
export function WhatYouCanPullScreen({
  itemPool,
  onContinue,
}: WhatYouCanPullScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP),
    );
    setActiveIndex(index);
  };

  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.screen}>
        <Text style={styles.title}>What you can pull</Text>

        <FlatList
          data={itemPool}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={mockReward}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <Text
                style={styles.cardValue}
                testID={`pull-item-value-${item.id}`}
              >
                {`Approx market value: ${formatCurrency(item.fairMarketValue)}`}
              </Text>
            </View>
          )}
        />

        <View style={styles.dotsRow}>
          {itemPool.map((item, index) => (
            <View
              key={item.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable
          style={styles.continueButton}
          onPress={onContinue}
          testID="do-not-refresh-button"
        >
          <Text style={styles.continueButtonText}>Do Not Refresh</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
  },
  carouselContent: {
    alignItems: "center",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: "center",
    gap: 12,
  },
  cardImage: {
    width: CARD_WIDTH,
    aspectRatio: 0.8,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  cardValue: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.gold,
  },
  continueButton: {
    marginTop: "auto",
    width: "100%",
    maxWidth: 420,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
});
