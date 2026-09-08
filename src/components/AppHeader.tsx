import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import BeezieIcon from "../assets/icons/beezie_icon.svg";
import BeezieLogo from "../assets/Beezie_logo.svg";
import ProfileImage from "../assets/mock_profile_image.svg";
import { useWallet } from "../context/WalletContext";
import { useResponsive } from "../hooks/useResponsive";
import { colors } from "../theme/colors";
import { radius } from "../theme/shape";
import { formatCurrency } from "../utils/currency";

const NAV_ITEMS = [
  { label: "Marketplace", active: false },
  { label: "Claw", active: true },
  { label: "Leaderboard", active: false },
  { label: "Resources", active: false },
  { label: "More", active: false },
] as const;

const DRAWER_WIDTH = 260;

function showComingSoonAlert() {
  Alert.alert("Screen coming soon!");
}

/**
 * Top navigation bar (logo, nav links, wallet balance, profile picture).
 * Desktop/web shows the nav links inline; mobile/responsive collapses them
 * into a hidden side menu opened via the Beezie icon button.
 */
export function AppHeader() {
  const { isMobile } = useResponsive();
  const { balance } = useWallet();
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [translateX] = useState(() => new Animated.Value(-DRAWER_WIDTH));

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isMenuOpen ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isMenuOpen) {
        setIsMenuMounted(false);
      }
    });
  }, [isMenuOpen, translateX]);

  const openMenu = () => {
    setIsMenuMounted(true);
    setIsMenuOpen(true);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleNavItemPress = (item: (typeof NAV_ITEMS)[number]) => {
    if (!item.active) {
      showComingSoonAlert();
    }
    closeMenu();
  };

  const balanceSection = (
    <View style={styles.rightSection}>
      <View style={styles.balancePill}>
        <BeezieIcon width={11} height={16} />
        <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>
      </View>
      <ProfileImage width={isMobile ? 32 : 36} height={isMobile ? 32 : 36} />
    </View>
  );

  if (isMobile) {
    return (
      <>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <Pressable
              onPress={openMenu}
              style={styles.menuButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <BeezieIcon width={16} height={24} />
            </Pressable>
            <BeezieLogo width={64} height={27} />
          </View>
          {balanceSection}
        </View>

        <Modal
          visible={isMenuMounted}
          transparent
          animationType="none"
          onRequestClose={closeMenu}
        >
          <View style={styles.drawerOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeMenu}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            />
            <Animated.View
              style={[styles.drawerPanel, { transform: [{ translateX }] }]}
            >
              <View style={styles.drawerHeader}>
                <BeezieLogo width={78} height={33} />
              </View>
              {NAV_ITEMS.map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.drawerItem}
                  onPress={() => handleNavItemPress(item)}
                >
                  {item.active && <BeezieIcon width={14} height={20} />}
                  <Text
                    style={[
                      styles.navLabel,
                      item.active && styles.navLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <BeezieLogo width={78} height={33} />
      </View>

      <View style={styles.navRow} pointerEvents="box-none">
        {NAV_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            onPress={item.active ? undefined : showComingSoonAlert}
            style={styles.navItem}
          >
            {item.active && <BeezieIcon width={14} height={20} />}
            <Text
              style={[styles.navLabel, item.active && styles.navLabelActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {balanceSection}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    position: "relative",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  navRow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  navLabelActive: {
    color: colors.gold,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  balanceText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  drawerPanel: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: colors.background,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    paddingTop: 56,
    paddingHorizontal: 24,
    gap: 4,
  },
  drawerHeader: {
    marginBottom: 24,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
});
