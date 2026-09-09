# beezie-test

Beezie Claw is a React Native + Expo challenge app for purchasing pulls from
a collectible claw machine. It targets **Android**, **iOS**, and **Web** from a
single TypeScript codebase.

The app currently uses local mock data and simulates asynchronous API calls. It
does not connect to a real wallet, payment provider, or backend.

## Getting started

Requirements:

- Node.js 20+ (developed and tested with v24.13.1) and npm
- Plus the tooling needed for the target platform (Android Studio for
  Android, Xcode for iOS, or a browser for Web)

```bash
npm install
npm start
```

Use the Expo CLI to choose a platform, or start one directly:

```bash
npm run android
npm run ios
npm run web
```

> **Note on the app icon in Expo Go:** the flow above runs the app through
> [Expo Go](https://expo.dev/go), which is the default/expected way to run
> this project. Expo Go always shows its own icon on the device/simulator
> home screen — the custom app icons (`assets/icon.png`,
> `assets/android-icon-*.png`) only appear when the app is built natively,
> e.g. via `npx expo prebuild` + `npx expo run:ios` / `npx expo run:android`,
> or through an EAS Build. Seeing the Expo Go icon instead of the project's
> icon while following the steps above is expected, not a bug.

## Current flow

1. Land on `/`, which redirects to `/claw/pokemon-gold` — the default claw
   machine.
2. Browse one of the 4 claw machines, each at its own `/claw/[slug]` route
   (`pokemon-gold`, `tcg-platinum`, `tcg-silver`, `wildcard`), with its own
   name, description, price, points, odds table, and "Top Items"/"Recent
   Pulls" sections. "More Claw Machines" cards link to the other 3 machines
   via real navigation (`router.push`, not a placeholder).
3. Choose a quantity from 1 to 10 and press **Start Now** (disabled and
   replaced with "Restocking Soon" for the out-of-stock Wildcard machine).
4. Review the mocked payment summary and confirm with the auto-selected
   payment method (Beezie wallet, external wallet, or simulated
   credit/debit).
5. See the "What you can pull" preview screen while the pull result loads.
6. Play the fullscreen claw opening animation, with audio and a skip
   button.
7. Reveal the pulled item(s) within a 5-minute window, then keep or swap
   each item before it expires.

## Implementation status

- **4 claw machines, one route each**: `Pokémon Gold Claw` ($500/pull),
  `TCG Platinum` ($500/pull), `TCG Silver` ($100/pull), and `Wildcard`
  ($30/pull, out of stock) are defined in `src/mocks/clawMachines.ts` and
  each rendered at its own `/claw/[slug]` route via
  `getClawMachineBySlug()`. All 4 currently reuse the same `itemPool` and
  opening video as `Pokémon Gold Claw` (see "Scope decisions" below).
- **Shared, price-scaled odds table**: every machine's `OddsTier[]` is
  derived by `deriveOddsTable()` in `src/mocks/clawMachines.ts` from a
  single base table anchored to a $100 pull (TCG Silver's price). The
  rarity chance percentages are identical across machines; only the
  dollar value ranges scale linearly with `pricePerPull`.
- **Out-of-stock machine**: `Wildcard` has `inStock: false`. Its "Start
  Now" button is disabled and reads "Restocking Soon" instead.
- **Promo codes**: a real `TextInput` + "Apply" button exist, but every
  code is rejected with "That code is not valid or has expired." (see
  "Scope decisions" below).
- **Dual wallet**: `WalletContext` tracks a real Beezie wallet balance
  (deducted on purchase, credited on swap) and a fixed $25,000 external
  wallet balance that's used for payment-method eligibility but never
  deducted (see "Scope decisions" below).
- Payment is represented by `PaymentModal`, supporting the Beezie wallet,
  the external wallet, and a simulated credit/debit flow via
  `CreditDebitSimulationModal`. The default selected method is
  auto-picked by whichever can afford the total (Beezie, then external,
  then credit/debit), recalculated whenever the total or either balance
  changes. The order summary shows the selected machine's own icon
  (`machine.iconAsset`) instead of a fixed image.
- After confirming payment, `WhatYouCanPullScreen` previews the machine's
  item pool (crossfading one item at a time) while the pull result loads,
  right before the claw opening animation plays.
- Pull results are generated locally by `src/services/clawService.ts`
  using the machine's rarity weights and item pool.
- A pull has a shared **5-minute** reveal window (`REVEAL_WINDOW_MS` in
  `clawService.ts`).
- Multi-item pulls (QTY > 1) are revealed with `RevealMultipleModal`: a
  responsive grid of all pulled items, all **deselected by default**, a
  "Select all" / "Clear" control, a shared countdown that pulses once
  under a minute remains, and both per-item and bulk swap actions, each
  going through an async loading state before crediting the wallet.
  Swapped items **stay visible** in the grid in a disabled "Swapped"
  state instead of disappearing. If the countdown reaches zero before
  the user acts, any items not yet swapped are automatically credited to
  the vault and the grid locks into a read-only "Expired" state —
  **without closing the modal**.
- Single-item pulls (QTY = 1) use `RevealSingleModal`, with the same
  functional parity as the multi-item flow: real swap/keep actions, an
  async loading state, and the `SwapSuccessModal` confirmation.
- The claw opening animation (`ClawOpeningAnimation`) plays with its
  embedded audio audible by default. If autoplay-with-audio is blocked by
  the platform (detected heuristically — see the component's comments),
  it retries muted instead of leaving the screen stuck. A skip button
  lets the user jump straight to the reveal without waiting for the
  video.
- The quantity stepper (`QuantityStepper`) plays a short synthesized
  "menu tick" click sound on every "+"/"-" press (see "Scope decisions"
  below).
- The mobile header (`AppHeader`) collapses nav links into a dropdown
  menu opened via a hamburger button that morphs into an X. The menu
  slides down from the top (not a side panel) inside a React Native
  `Modal`, which duplicates the logo, balance, and close ("X") controls
  inside the modal itself, since a `Modal` always renders above any
  content outside of it.
- Odds tier cards (`OddsTable`) render a subtle rarity-colored gradient
  background (`LinearGradient`, left-to-right, color → transparent).
- Kept (non-swapped) items are tracked in `VaultContext`, alongside the
  wallet balance/points tracked in `WalletContext`.

## Scope decisions

A few product surfaces referenced in the mock data or UI are intentionally
left as visual placeholders rather than fully implemented, since they'd
each represent a separate feature area beyond what this challenge covers:

- **External wallet linking**: the payment modal shows a real "External
  wallet" option with its own balance (see below), but there's no actual
  external wallet integration behind it (OAuth-style linking flow,
  balance sync with a real provider) — the balance is just a fixed number
  seeded in `WalletContext`, which has no meaningful mock equivalent
  without inventing a fictional provider.
- **External wallet balance is fixed, not spent**: the external wallet
  now has a real balance ($25,000, set in `WalletContext`) that's used to
  decide eligibility and the auto-selected payment method, exactly like
  the Beezie wallet. Unlike the Beezie wallet, though, that balance is
  **not** deducted after a purchase confirmed with it. Implementing real
  deduction would require deciding on and mocking an external "source of
  truth" for that balance that doesn't exist yet — the wallet never had a
  real withdrawal/linking flow proposed, so there's nothing to deduct
  against or reconcile with.
- **Promo codes**: "Apply promo code" now has a real `TextInput` + "Apply"
  button, but no code is actually valid — pressing Apply always shows
  "That code is not valid or has expired.", regardless of input (including
  empty input). A real implementation would need a promo code service
  (validation rules, expiry, stacking rules with existing pricing) that
  felt out of scope for a pull/reveal-focused technical exercise.
- **Item pool reuse across machines**: `TCG Platinum`, `TCG Silver`, and
  `Wildcard` all reuse the same `itemPool` (and opening video) as
  `Pokémon Gold Claw` rather than each having a bespoke catalog. That
  pool's `fairMarketValue`s were calibrated for Pokémon Gold's $500/pull
  odds ranges and don't automatically rescale for the cheaper machines —
  e.g. the pool's cheapest item ($10) falls below Wildcard's own "Base"
  value range ($15–$30). This is acceptable because item draws are
  weighted by rarity, not by matching an exact value range, but it's
  worth calling out explicitly rather than leaving it implicit.
- **Quantity stepper click sound**: pressing "+"/"-" on the pull quantity
  stepper plays a short 8-bit-style "menu tick" blip. This is a fully
  synthesized, generic UI click sound (`src/assets/sounds/menu-tick.wav`)
  built from scratch for this project — it is **not** an audio clip
  extracted from any real Pokémon game. Using actual Pokémon SFX would
  raise copyright concerns (they're Nintendo/Game Freak property), so a
  royalty-free, similarly-styled sound was used instead.

If any of these turn out to be worth prioritizing, happy to discuss scope
and time trade-offs.

## Note on card artwork

The item images shown throughout the app (reveal grids, item cards, Top
Items, Recent Pulls) are **not** exported from the Figma file. The Figma
export for individual cards couldn't be isolated without a baked-in white
background/selection artifact around each card, which broke the
responsive image containers used across the grid and card components.

Instead, real trading-card images were sourced from the public
[pokemontcg.io](https://pokemontcg.io) API, matched by name/rarity to the
item pool already defined in the mock data (`src/mocks/clawMachines.ts`).
This keeps the "real image, not a placeholder" goal intact while avoiding
the Figma export issue — if this is worth revisiting with corrected Figma
exports, happy to swap the image sources back in.

## Scripts

| Command                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `npm start`              | Start the Expo development server                |
| `npm run android`        | Start on an Android emulator or device           |
| `npm run ios`            | Start on an iOS simulator or device (macOS only) |
| `npm run web`            | Start the Web version in a browser               |
| `npm test`               | Run Jest with the `jest-expo` preset             |
| `npm run lint`           | Run ESLint through Expo                          |
| `npx tsc --noEmit`       | Type-check without emitting files                |
| `npx expo export -p web` | Verify that the Web bundle exports successfully  |

`__tests__/App.test.tsx` renders the app through
`expo-router/testing-library`'s `renderRouter` and flushes the mocked
service delays with fake timers. `__mocks__/expo-video.js` provides the
`expo-video` mock used by Jest.

## Project structure

```text
app/_layout.tsx                  # Expo Router root layout
app/index.tsx                    # Redirects "/" to "/claw/pokemon-gold"
app/claw/[slug].tsx              # Machine detail route, renders ClawHeroScreen
src/screens/ClawHeroScreen.tsx   # Main screen and flow orchestration (looks up machine by slug)
src/components/                  # Odds, quantity, payment, video, and reveal UI
  AppHeader.tsx                  #   Top nav; mobile collapses into a top-down dropdown Modal
  ItemCard.tsx                    #   Shared item image/name/rarity card (incl. "Swapped" state)
  MoreClawMachines.tsx           #   "More Claw Machines" cards, navigates via router.push
  OddsTable.tsx                  #   Gradient-backed rarity odds cards
  QuantityStepper.tsx            #   +/- pull quantity control, plays a synthesized click SFX
  PaymentModal.tsx               #   "Review & pay", auto-selects payment method by balance
  PurchaseFlowModal.tsx           #   Payment -> "What you can pull" stage container
  WhatYouCanPullScreen.tsx        #   Item-pool preview shown before the opening animation
  ClawOpeningAnimation.tsx       #   Fullscreen opening video with audio + skip button
  RevealMultipleModal.tsx         #   Grid reveal + bulk/individual swap for QTY > 1, 5-min timer
  RevealSingleModal.tsx           #   Single-item reveal + swap for QTY = 1
  SwapSuccessModal.tsx            #   Swap confirmation (amount/points credited)
src/services/clawService.ts      # Mock machine, wallet, and pull operations
src/context/WalletContext.tsx    # Beezie + external wallet balance/points state
src/contexts/VaultContext.tsx    # Kept (non-swapped) items state
src/config/points.ts             # Swap point calculation
src/mocks/clawMachines.ts        # 4 machines, shared item pool, and derived odds tables
src/types/claw.ts                # Domain models (ClawMachine, PullResult, PaymentMethod, ...)
src/hooks/                       # Shared responsive hooks
src/theme/                       # Colors, breakpoints, shape, and modal-card tokens
src/utils/                       # Currency formatting and simulated async delays
src/assets/videos/               # Bundled opening-animation videos
src/assets/sounds/                # Synthesized SFX (menu-tick.wav for the quantity stepper)
__tests__/                       # App-level tests (rendered via Expo Router)
```

## Video assets

The opening animation uses [`expo-video`](https://docs.expo.dev/versions/v57.0.0/sdk/video/),
playing with its embedded audio audible by default. Remote URLs are
supported by the component, while every mock machine currently falls back
to the same bundled files:

- `src/assets/videos/Reveal web.mp4` for Web
- `src/assets/videos/BlueReveal_Mobile.mp4` for Android and iOS

If autoplay-with-audio is blocked by the platform (detected heuristically,
since browsers don't always surface this as an error — see
`ClawOpeningAnimation.tsx`), playback retries muted instead of leaving the
screen stuck. A skip button lets the user bypass the video entirely and
jump straight to the reveal.

## Responsive behavior

Responsive layout decisions use `useResponsive()` and the shared breakpoints
in `src/theme/breakpoints.ts`. New screen-level content should be wrapped in
`ResponsiveContainer` so it remains readable on tablet and desktop widths.

## SSR / Server Rendering

This project uses [Expo Router](https://docs.expo.dev/router/introduction/)
with `web.output: "static"`, which pre-renders the app's shell to HTML at
build time (SSG). We evaluated going further — full request-time SSR with
resolved async data in the initial HTML response — before settling on this.

### What we tried

Expo Router (SDK 57) supports an experimental server-rendering mode via the
`unstable_useServerRendering` plugin option, which enables API routes and
server-side component rendering. We built an isolated test route using
React 19's `use()` hook with `<Suspense>` around an async data fetch, then
inspected the raw HTML returned by the production server (`curl` against
`npx expo export -p web` + `npx expo serve`, not the browser DevTools DOM,
which shows post-hydration state and would have hidden the issue).

**Result:** the server returned the `<Suspense>` fallback content
(`<!--$!-->...<!--/$-->`, React's streaming-SSR pending markers) with no
trace of the resolved data anywhere in the response. The async fetch never
blocked the initial HTML — in practice, this is client-side fetching
dressed as SSR, not genuine data-aware server rendering.

### Why we stopped here

The `unstable_` prefix on the relevant plugin option reflects reality: as
of SDK 57, Expo Router's server rendering produces the route shell on the
server but doesn't yet support resolving Suspense-bound async data before
sending the response (unlike, e.g., Next.js Server Components). Achieving
that would require a custom low-level server entry that pre-fetches data
and injects it before the render call — bypassing Suspense entirely, with
no official guidance for this SDK version. Given the scope of this
challenge, we chose not to pursue that path.

### What's left in place

- File-based routing via Expo Router (`app/_layout.tsx`, `app/index.tsx`,
  `app/claw/[slug].tsx`).
- Static HTML generation for the app shell (`web.output: "static"`),
  verified with `npx expo export -p web`.
- The investigation above, so the limitation is documented rather than
  silently absent.

See [SPEC.md](SPEC.md) for the full product flow and target behavior, and
[CLAUDE.md](CLAUDE.md) for project conventions and required validation steps.
