## 1. Detailed functional specification (based on the reference screenshots)

The app ships 4 claw machines (Pokémon Gold Claw, TCG Platinum, TCG Silver,
Wildcard), each reachable at its own `/claw/[slug]` route (`pokemon-gold`,
`tcg-platinum`, `tcg-silver`, `wildcard`). The root route (`/`) redirects to
`/claw/pokemon-gold`. "More Claw Machines" cards on the hero screen link to
the other 3 machines via real navigation, not a placeholder.

| Screen | Desktop | Mobile |
| -------------------- | | |
| **Hero / Claw Page** (`/claw/[slug]`) | Header navigation (Marketplace, Claw, Leaderboard, Resources, More), balance, and avatar in the top right. Two-column grid: machine on the left and purchase panel on the right (name, description, price + points, stepper, promo code, odds table, "More Claw Machines"). Below, two columns: "Top Items" (3xN grid) and "Recent Pulls" (list). | Stacked vertically: hexagon/logo, machine image, and purchase card (name, price, promo code, odds, stepper + Start Now). Header collapses nav links into a hamburger-triggered dropdown menu (see below). |
| **Payment** | Centered "Review & pay" modal: left column with payment methods (radio: Beezie wallet balance, External wallet balance, Credit/Debit); right column with item summary (selected machine's own icon), quantity, and total; "Confirm" button. | Bottom-anchored modal: "Wallet" / "Credit/Debit" tabs, item summary, "Choose Wallet" (Beezie/External radio), and "Confirm" button. |
| **Reveal (1 item)** | Fullscreen modal: large image on the left, item name + "Swap Value" (highlighted) + "Swap Now" (primary) / "Keep Item" (secondary) buttons on the right. | Same content stacked vertically. |
| **Reveal (N items)** | Fullscreen modal with a card grid (4 desktop columns / 2 mobile columns): image, "+"/"✓" selection icon, name, and individual "Swap for $X" button. Fixed footer: "Expires in mm min ss sec", "Select all", and bulk "Swap" button. | Same layout with a two-column grid and fixed footer. |

Important behavior:

- **Multiple machines, one item pool**: `TCG Platinum`, `TCG Silver`, and
  `Wildcard` currently reuse the same `itemPool` and opening video as
  `Pokémon Gold Claw` (see README's "Scope decisions"). Each machine has
  its own price, points, and odds table, though — see below.
- **Shared, price-scaled odds table**: all 4 machines share the same
  rarity chance percentages; only the dollar value ranges scale linearly
  with `pricePerPull`, derived from a single table anchored to a $100
  pull (TCG Silver's price).
- **Out of stock**: `Wildcard` (`inStock: false`) shows a disabled "Start
  Now" button, relabeled "Restocking Soon".
- **Promo code field**: a real text input + "Apply" button exist, but
  every submitted code (including an empty one) is rejected with "That
  code is not valid or has expired." — no code is ever valid.
- **Dual wallet**: the Beezie wallet balance is real (deducted on
  purchase, credited on swap); the external wallet has a fixed $25,000
  balance used only for payment-method eligibility, never deducted.
- **Payment method auto-selection**: the payment modal auto-selects
  whichever method can afford the total first — Beezie wallet, then
  external wallet, then credit/debit — recalculated live if the total or
  either balance changes while the modal is open.
- The expiration timer ("Expires in 4 min 29 sec") is shared by every
  item revealed in the same pull (a 5-minute window), not one timer per
  item.
- The footer "Swap" button totals the selected items (via the "+"/"✓"
  toggle or "Select all") and swaps them in bulk. Individual "Swap for
  $X" buttons allow one-off swaps. All items start **deselected**.
- Items that have been swapped **stay visible** in the grid, rendered in
  a disabled "Swapped" state, instead of disappearing.
- If the countdown reaches zero before the user finishes, any items not
  yet swapped are **automatically credited** to the vault and the modal
  locks into a read-only "Expired" state, without closing.
- On mobile, keep the explicit total in the payment summary for
  consistency with the desktop version.
- **Mobile header menu**: the hamburger button morphs into an "X" when
  the menu opens. The menu is a top-down dropdown rendered inside a React
  Native `Modal` (not a side panel) — since a `Modal`'s content always
  renders above everything outside of it, the logo, balance, and close
  ("X") button are duplicated inside the modal so the header still looks
  complete while the dropdown is open.
- **Odds cards**: each rarity tier card in the odds table renders a
  subtle left-to-right gradient (rarity color → transparent) behind its
  content.
- **Reveal video audio**: the claw opening animation plays with its
  embedded audio audible by default, falling back to muted playback if
  autoplay-with-audio is blocked by the platform, plus a skip button to
  bypass the video entirely.

---

## 2. Data models (TypeScript)

These mirror the actual types in `src/types/claw.ts` and
`src/mocks/clawMachines.ts`.

```ts
export type Rarity = "ultra-rare" | "rare" | "uncommon" | "common" | "base";

export interface OddsTier {
  rarity: Rarity;
  label: string; // "Ultra-Rare"
  chancePercent: number; // 0.72
  valueRangeMin: number;
  valueRangeMax: number | null; // null = "8001+"
}

export interface ClawItem {
  id: string;
  name: string;
  imageUrl: string;
  fairMarketValue: number; // used as "Swap Value"
  rarity: Rarity;
}

export interface ClawMachine {
  id: string;
  slug: string; // used in the machine detail URL, e.g. "pokemon-gold" — distinct from `id`
  name: string; // "Pokémon Gold Claw"
  description: string;
  heroImageUrl: string;
  iconAsset: SvgIcon; // machine's own icon, e.g. src/assets/icons/500_box_icon.svg
  videoOpeningUrl: string; // local or remote asset
  pricePerPull: number;
  pointsPerPull: number;
  averageValue: number;
  inStock: boolean;
  odds: OddsTier[];
  itemPool: ClawItem[]; // used for draws and for "Top Items"
}

export interface RecentPull {
  id: string;
  item: ClawItem;
  userDisplayName: string;
  paidValue: number; // "$100" shown in the list
  timestamp: string;
}

export interface Wallet {
  beezieBalance: number;
  externalBalance: number;
}

export interface PullResult {
  pullId: string;
  items: ClawItem[]; // 1 or N
  expiresAt: number; // epoch ms - used for the countdown (5-minute window)
}

export type PaymentMethod =
  | "beezie-wallet"
  | "external-wallet"
  | "credit-debit";
```

Machine data (`src/mocks/clawMachines.ts`) currently defines:

| Machine           | Slug           | Price/pull | Points/pull | In stock               |
| ----------------- | -------------- | ---------- | ----------- | ---------------------- |
| Pokémon Gold Claw | `pokemon-gold` | $500       | 500         | Yes                    |
| TCG Platinum      | `tcg-platinum` | $500       | 500         | Yes                    |
| TCG Silver        | `tcg-silver`   | $100       | 100         | Yes                    |
| Wildcard          | `wildcard`     | $30        | 30          | No ("Restocking Soon") |

`getClawMachineBySlug(slug)` resolves the machine for a given route;
`getMoreClawMachines(excludeId)` returns the lightweight
`ClawMachineSummary[]` used by the "More Claw Machines" cards, which
navigate via `router.push(`/claw/${machine.slug}`)`.
