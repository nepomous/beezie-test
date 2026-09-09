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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BeezieIcon from "../assets/icons/beezie_icon.svg";
import BeezieLogo from "../assets/Beezie_logo.svg";
import ProfileImage from "../assets/mock_profile_image.svg";
import { useWallet } from "../context/WalletContext";
import { useResponsive } from "../hooks/useResponsive";
import { colors } from "../theme/colors";
import { radius, shape } from "../theme/shape";
import { formatCurrency } from "../utils/currency";

const NAV_ITEMS = [
  { label: "Marketplace", active: false },
  { label: "Claw", active: true },
  { label: "Leaderboard", active: false },
  { label: "Resources", active: false },
  { label: "More", active: false },
] as const;

const DRAWER_HEIGHT = 360;

function showComingSoonAlert() {
  Alert.alert("Screen coming soon!");
}

/**
 * Top navigation bar (logo, nav links, wallet balance, profile picture).
 * Desktop/web shows the nav links inline; mobile/responsive collapses them
 * into a hidden side menu opened via the hamburger button.
 */
export function AppHeader() {
  const { isMobile } = useResponsive();
  const { balance } = useWallet();
  const insets = useSafeAreaInsets();
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: isMenuOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isMenuOpen) {
        setIsMenuMounted(false);
      }
    });
  }, [isMenuOpen, menuAnim]);

  const openMenu = () => {
    setIsMenuMounted(true);
    setIsMenuOpen(true);
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Drawer slides down from above the header; hamburger bars morph into an X, both driven by menuAnim.
  const drawerTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_HEIGHT, 0],
  });
  const hamburgerTopBarStyle = {
    transform: [
      {
        translateY: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 7],
        }),
      },
      {
        rotate: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "45deg"],
        }),
      },
    ],
  };
  const hamburgerMiddleBarStyle = {
    opacity: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
  };
  const hamburgerBottomBarStyle = {
    transform: [
      {
        translateY: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -7],
        }),
      },
      {
        rotate: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "-45deg"],
        }),
      },
    ],
  };

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
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.leftSection}>
            <BeezieLogo width={64} height={27} />
          </View>
          <View style={styles.mobileRightSection}>
            {balanceSection}
            <Pressable
              onPress={openMenu}
              style={styles.menuButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <Animated.View
                style={[styles.hamburgerBar, hamburgerTopBarStyle]}
              />
              <Animated.View
                style={[styles.hamburgerBar, hamburgerMiddleBarStyle]}
              />
              <Animated.View
                style={[styles.hamburgerBar, hamburgerBottomBarStyle]}
              />
            </Pressable>
          </View>
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
              style={[
                styles.drawerPanel,
                {
                  paddingTop: insets.top + 16,
                  transform: [{ translateY: drawerTranslateY }],
                },
              ]}
            >
              <View style={styles.drawerHeader}>
                <BeezieLogo width={64} height={27} />
                <View style={styles.drawerHeaderRight}>
                  {balanceSection}
                  <Pressable
                    onPress={closeMenu}
                    style={styles.closeButton}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Close menu"
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </Pressable>
                </View>
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
    <View style={[styles.header, { paddingTop: insets.top }]}>
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
    minHeight: 64,
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
    gap: 5,
  },
  hamburgerBar: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textPrimary,
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
  mobileRightSection: {
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
    width: "100%",
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 4,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  drawerHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: shape.circle,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
});
