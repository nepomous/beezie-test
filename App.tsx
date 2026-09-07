import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { AppHeader } from "./src/components/AppHeader";
import { WalletProvider } from "./src/context/WalletContext";
import { ClawHeroScreen } from "./src/screens/ClawHeroScreen";
import { colors } from "./src/theme/colors";

export default function App() {
  return (
    <WalletProvider>
      <StatusBar style="light" />
      <View style={styles.app}>
        <AppHeader />
        <ClawHeroScreen />
      </View>
    </WalletProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
