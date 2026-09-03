import { useWindowDimensions } from 'react-native';

import { breakpoints, getBreakpoint, type BreakpointName } from '../theme/breakpoints';

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: BreakpointName;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Hook that exposes the current window size plus derived breakpoint flags,
 * re-rendering automatically when the viewport is resized or the device is
 * rotated. Works across Android, iOS, and Web.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);

  return {
    width,
    height,
    breakpoint,
    isMobile: width < breakpoints.tablet,
    isTablet: width >= breakpoints.tablet && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop,
  };
}
