/**
 * Shared responsive breakpoints used across the app.
 *
 * These widths are used to decide when the UI should switch between a
 * mobile, tablet, or desktop/web layout. Values are in density-independent
 * pixels and mirror common responsive design conventions.
 */
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type BreakpointName = keyof typeof breakpoints;

/**
 * Returns the name of the largest breakpoint that `width` satisfies.
 */
export function getBreakpoint(width: number): BreakpointName {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}
