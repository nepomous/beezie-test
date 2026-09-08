import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppHeader } from "../src/components/AppHeader";
import { WalletProvider } from "../src/context/WalletContext";
import { VaultProvider } from "../src/contexts/VaultContext";
import { colors } from "../src/theme/colors";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <VaultProvider>
          <StatusBar style="light" />
          <View style={styles.app}>
            <AppHeader />
            <Slot />
          </View>
        </VaultProvider>
      </WalletProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
