## 1. Detailed functional specification (based on the reference screenshots)

| Screen | Desktop | Mobile |
| -------------------- | | |
| **Hero / Claw Page** | Header navigation (Marketplace, Claw, Leaderboard, Resources, More), balance, and avatar in the top right. Two-column grid: machine on the left and purchase panel on the right (name, description, price + points, stepper, promo code, odds table, "More Claw Machines"). Below, two columns: "Top Items" (3xN grid) and "Recent Pulls" (list). | Stacked vertically: hexagon/logo, machine image, and purchase card (name, price, promo code, odds, stepper + Start Now). |
| **Payment** | Centered "Review & pay" modal: left column with payment methods (radio: Beezie wallet balance, External wallet balance, Credit/Debit); right column with item summary, quantity, and total; "Confirm" button. | Bottom-anchored modal: "Wallet" / "Credit/Debit" tabs, item summary, "Choose Wallet" (Beezie/External radio), and "Confirm" button. |
| **Reveal (1 item)** | Fullscreen modal: large image on the left, item name + "Swap Value" (highlighted) + "Swap Now" (primary) / "Keep Item" (secondary) buttons on the right. | Same content stacked vertically. |
| **Reveal (N items)** | Fullscreen modal with a card grid (4 desktop columns / 2 mobile columns): image, "+" selection icon, name, and individual "Swap for $X" button. Fixed footer: "Expires in mm:ss", "Select all", and bulk "Swap" button. | Same layout with a two-column grid and fixed footer. |

Important behavior shown in the reference screenshots:

- The expiration timer ("Expires in 14 min 29 sec") is shared by every item revealed in the same pull, not one timer per item.
- The footer "Swap" button should total the selected items (through the "+"/checkbox or "Select all") and swap them in bulk. Individual "Swap for $X" buttons allow one-off swaps.
- On mobile, keep the explicit total in the payment summary for consistency with the desktop version.

---

## 2. Suggested data models (TypeScript)

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
  name: string; // "Pokémon Gold Claw"
  description: string;
  heroImageUrl: string;
  videoOpeningUrl: string; // local or remote asset
  pricePerPull: number;
  pointsPerPull: number;
  averageValue: number;
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
  expiresAt: number; // epoch ms - used for the countdown
}
```
