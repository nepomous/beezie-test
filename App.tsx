import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveContainer } from './src/components/ResponsiveContainer';
import { useResponsive } from './src/hooks/useResponsive';

export default function App() {
  const { breakpoint, width, height } = useResponsive();

  return (
    <View style={styles.safeArea}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ResponsiveContainer>
          <Text style={styles.title}>Welcome to your Expo app</Text>
          <Text style={styles.subtitle}>
            This screen adapts to Android, iOS, and Web.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Platform</Text>
            <Text style={styles.cardValue}>{Platform.OS}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Breakpoint</Text>
            <Text style={styles.cardValue}>{breakpoint}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Window size</Text>
            <Text style={styles.cardValue}>
              {Math.round(width)} x {Math.round(height)}
            </Text>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#888',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});
