import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveContainerProps extends PropsWithChildren {
  style?: ViewStyle;
}

/**
 * Centers and constrains content on larger viewports (tablet/desktop/web)
 * while letting it fill the available width on phones, so the same layout
 * works well on Android, iOS, and Web.
 */
export function ResponsiveContainer({ children, style }: ResponsiveContainerProps) {
  const { isMobile } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        !isMobile && styles.constrained,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
  },
  constrained: {
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
});
