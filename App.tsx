import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { AppHeader } from "./src/components/AppHeader";
import { WalletProvider } from "./src/context/WalletContext";
import { VaultProvider } from "./src/contexts/VaultContext";
import { ClawHeroScreen } from "./src/screens/ClawHeroScreen";
import { colors } from "./src/theme/colors";

export default function App() {
  return (
    <WalletProvider>
      <VaultProvider>
        <StatusBar style="light" />
        <View style={styles.app}>
          <AppHeader />
          <ClawHeroScreen />
        </View>
      </VaultProvider>
    </WalletProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
