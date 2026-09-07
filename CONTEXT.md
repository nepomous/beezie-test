# Project Context - Beezie Claw (technical challenge)

## Business context (for domain understanding; do not copy Beezie text)

Beezie is a marketplace for physical collectibles (Pokémon and One Piece cards, sneakers,
and memorabilia) that physically custodies the items and enables digital purchase, sale,
and exchange of those assets. The main feature in this challenge is the "Claw" machine:

- The user pays a fixed amount per "pull" (for example, $30 to $500) for a chance to win a
  physical item with a variable value.
- Each machine exposes odds by rarity tier: Ultra-Rare, Rare, Uncommon, Common, and Base,
  with a percentage chance and dollar value range for each tier.
- After the pull, the item is revealed. The user can:
  - **Keep Item**: keep the item in the user's collection or vault.
  - **Swap Now**: exchange the item for credits based on its fair market value within a
    limited time window shown by a countdown.
- When pull quantity (QTY) is greater than 1, the reveal shows all items in a grid. Users
  can select items individually or choose "Select all" to swap them in bulk before the
  timer expires.
- Payment can use the internal "Beezie wallet", an external wallet, or a credit/debit card.

This follows the same "gacha"/loot box pattern used in mobile games: pay -> opening
animation -> reveal -> decision to keep or convert to currency.

## Stack

- React Native + Expo (Expo Router for navigation)
- Must run responsively on iOS, Android, and Web (via react-native-web, already included
  with Expo)
- TypeScript
- State management: [DEFINE - for example, Zustand] for cart/quantity, wallet, and reveal session
- Local mock data (no real backend) simulating an asynchronous API with Promises and an
  artificial delay to simulate network latency
- Claw/box opening videos: `expo-video` (or `expo-av`, depending on the template's Expo
  SDK version), with assets in `/assets/videos/`

## Conventions

- Keep all user-visible text in English.
- Colors/theme: follow the dark theme shown in the reference screenshots (near-black
  background, yellow/gold #F5C518-ish accent, white/gray text).
- Name components by screen: `ClawHeroScreen`, `PaymentModal`, `RevealSingleModal`,
  `RevealMultipleModal`
- Breakpoint responsivo sugerido: `< 768px` = layout mobile (stack vertical),
  `>= 768px` = layout desktop (duas colunas)

## Reference flow (screen order)

1. Hero screen: the top half shows the claw machine visual, prize name, price, quantity
   stepper, and "Start Now" button; the bottom half of the same viewport shows "Top Items"
   and "Recent Pulls" without requiring a scroll.
2. The user adjusts QTY and taps "Start Now" to open the payment modal.
3. In the payment modal, the user chooses a payment method (Beezie wallet, external
   wallet, or card) and confirms. The summary shows the item, unit price, points earned,
   quantity, and total.
4. After payment confirmation, the claw/box opening video plays.
   5a. If QTY = 1: a fullscreen reveal modal shows one item, its image and name, "Swap Value",
   and the "Swap Now" and "Keep Item" buttons.
   5b. If QTY > 1: a fullscreen grid reveal modal shows N items. Each card has an image,
   name, individual "Swap for $X" button, and selection control. A fixed footer shows the
   countdown ("Expires in mm:ss"), "Select all", and a bulk "Swap" button.

## Required mock data

- List of "claw machines" (id, name, image, price, points, rarity odds, average value,
  and possible items in the pool)
- List of "Top Items" (the machine's highest-value items)
- List of "Recent Pulls" (a feed of recent pulls from other users with item, display name,
  and value)
- User wallet balances (Beezie wallet and external wallet)
- A "pull" result (1 or N items drawn according to the odds, with swap values)

## 2. Detailed functional specification (based on the reference screenshots)

| Screen               | Desktop                                                                                                                                                                                                                                                                                                                                           | Mobile                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Hero / Claw Page** | Header navigation (Marketplace, Claw, Leaderboard, Resources, More), balance, and avatar in the top right. Two-column grid: machine on the left and purchase panel on the right (name, description, price + points, stepper, promo code, odds table, "More Claw Machines"). Below, two columns: "Top Items" (3xN grid) and "Recent Pulls" (list). | Stacked vertically: hexagon/logo, machine image, and purchase card (name, price, promo code, odds, stepper + Start Now).            |
| **Payment**          | Centered "Review & pay" modal: left column with payment methods (radio: Beezie wallet balance, External wallet balance, Credit/Debit); right column with item summary, quantity, and total; "Confirm" button.                                                                                                                                     | Bottom-anchored modal: "Wallet" / "Credit/Debit" tabs, item summary, "Choose Wallet" (Beezie/External radio), and "Confirm" button. |
| **Reveal (1 item)**  | Fullscreen modal: large image on the left, item name + "Swap Value" (highlighted) + "Swap Now" (primary) / "Keep Item" (secondary) buttons on the right.                                                                                                                                                                                          | Same content stacked vertically.                                                                                                    |
| **Reveal (N items)** | Fullscreen modal with a card grid (4 desktop columns / 2 mobile columns): image, "+" selection icon, name, and individual "Swap for $X" button. Fixed footer: "Expires in mm:ss", "Select all", and bulk "Swap" button.                                                                                                                           | Same layout with a two-column grid and fixed footer.                                                                                |

Important behavior shown in the reference screenshots:

- The expiration timer ("Expires in 14 min 29 sec") is shared by every item revealed in the same pull, not one timer per item.
- The footer "Swap" button should total the selected items (through the "+"/checkbox or "Select all") and swap them in bulk. Individual "Swap for $X" buttons allow one-off swaps.
- On mobile, keep the explicit total in the payment summary for consistency with the desktop version.

---

## 3. Suggested data models (TypeScript)

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
