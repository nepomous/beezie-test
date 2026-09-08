/**
 * Centralized border-radius tokens for the app's dark theme.
 *
 * Values marked "confirmed" were cross-checked against the reveal/swap
 * Figma screenshots attached to the visual-polish task (item cards, primary
 * swap buttons, selection badge, swap-success modal, points pills). Values
 * without a matching screenshot reference keep the number already used in
 * the codebase before this pass — see the `TODO` below.
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  // TODO: confirm exact radius from Figma — no attached screenshot covers
  // PaymentModal's secondary controls (payment method tabs).
  control: 10,
  md: 12,
  lg: 16,
  xl: 20,
  // RN clamps this to a perfect circle/stadium regardless of box size, so
  // it's safe for any element where width === height, or for pill shapes.
  full: 999,
} as const;

/** Semantic aliases mapping the raw scale above to specific UI roles. */
export const shape = {
  /** Item card images: reveal grid, single reveal, "what you can pull" carousel. */
  itemCard: radius.lg,
  /** Primary action buttons: swap (single + bulk), confirm, continue, keep. */
  button: radius.sm,
  /** Modal/card containers: payment modal, swap success modal, credit/debit sim. */
  modalCard: radius.lg,
  /** Any circular or pill-shaped element: selection badge, dots, radios, points pills, icon close buttons. */
  circle: radius.full,
  /** Secondary rectangular controls without a Figma reference (see TODO above). */
  secondaryControl: radius.control,
  /** Secondary card-like containers (wallet option cards, payment options). */
  secondaryCard: radius.md,
  /** Outer dark frame of nested reveal-grid item cards (confirmed via Figma dev-mode inspect: 10px). */
  itemCardFrame: radius.control,
  /** White inner image box nested inside `itemCardFrame` (confirmed via Figma dev-mode inspect: 8px). */
  itemCardInner: radius.sm,
} as const;
