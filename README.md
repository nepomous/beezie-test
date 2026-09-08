# beezie-test

Beezie Claw is a React Native + Expo challenge app for purchasing pulls from
a collectible claw machine. It targets **Android**, **iOS**, and **Web** from a
single TypeScript codebase.

The app currently uses local mock data and simulates asynchronous API calls. It
does not connect to a real wallet, payment provider, or backend.

## Getting started

Requirements: Node.js and npm, plus the tooling needed for the target platform
(Android Studio for Android, Xcode for iOS, or a browser for Web).

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

## Current flow

1. Load the Pokémon Gold Claw machine and its recent pulls.
2. Choose a quantity from 1 to 10 and press **Start Now**.
3. Review the mocked payment summary and confirm with the Beezie wallet.
4. See the "What you can pull" preview screen while the pull result loads.
5. Play the fullscreen claw opening animation.
6. Reveal the pulled item(s), then keep or swap each item.

## Implementation status

- Payment is represented by `PaymentModal`, supporting the Beezie wallet
  (real balance/deduction), a placeholder external wallet (always $0, so
  it's disabled), and a simulated credit/debit flow via
  `CreditDebitSimulationModal`. Promo codes are not connected to real
  services.
- After confirming payment, `WhatYouCanPullScreen` previews the machine's
  item pool (crossfading one item at a time) while the pull result loads,
  right before the claw opening animation plays.
- Pull results are generated locally by `src/services/clawService.ts`
  using the machine's rarity weights and item pool.
- A pull has a shared 15-minute reveal window in the service model.
- Multi-item pulls (QTY > 1) are revealed with `RevealMultipleModal`: a
  responsive grid of all pulled items, a "Select all" / "Clear" control,
  a shared countdown that auto-expires the pull, and both per-item and
  bulk swap actions, each going through an async loading state before
  crediting the wallet.
- Single-item pulls (QTY = 1) use `RevealSingleModal`, with the same
  functional parity as the multi-item flow: real swap/keep actions, an
  async loading state, and the `SwapSuccessModal` confirmation.
- Kept (non-swapped) items are tracked in `VaultContext`, alongside the
  wallet balance/points tracked in `WalletContext`.

## Scope decisions

A few product surfaces referenced in the mock data or UI are intentionally
left as visual placeholders rather than fully implemented, since they'd
each represent a separate feature area beyond what this challenge covers:

- **External wallet linking**: the payment modal shows an "External
  wallet" option with a real UI affordance, but it's hard-coded to a $0
  balance and disabled. Wiring this up would require an actual external
  wallet integration (OAuth-style linking flow, balance sync), which has
  no meaningful mock equivalent without inventing a fictional provider.
- **Promo codes**: "Apply promo code" is currently a static label with no
  input, validation, or discount logic. A real implementation would need
  a promo code service (validation rules, expiry, stacking rules with
  existing pricing) that felt out of scope for a pull/reveal-focused
  technical exercise.
- **"More Claw Machines" navigation**: tapping a machine card in this
  section shows a "coming soon" alert instead of navigating to a machine
  detail/switch flow. The app only ships one machine's worth of mock data
  (`pokemonGoldClaw`); building out multi-machine navigation would mean
  duplicating the entire purchase/reveal flow's data model for machines
  that don't have distinct content yet.

If any of these turn out to be worth prioritizing, happy to discuss scope
and time trade-offs.

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
app/index.tsx                    # Expo Router entry route, renders ClawHeroScreen
src/screens/ClawHeroScreen.tsx   # Main screen and flow orchestration
src/components/                  # Odds, quantity, payment, video, and reveal UI
  ItemCard.tsx                    #   Shared item image/name/rarity card
  PurchaseFlowModal.tsx           #   Payment -> "What you can pull" stage container
  WhatYouCanPullScreen.tsx        #   Item-pool preview shown before the opening animation
  RevealMultipleModal.tsx         #   Grid reveal + bulk/individual swap for QTY > 1
  RevealSingleModal.tsx           #   Single-item reveal + swap for QTY = 1
  SwapSuccessModal.tsx            #   Swap confirmation (amount/points credited)
src/services/clawService.ts      # Mock machine, wallet, and pull operations
src/context/WalletContext.tsx    # Wallet balance/points state
src/contexts/VaultContext.tsx    # Kept (non-swapped) items state
src/config/points.ts             # Swap point calculation
src/mocks/                       # Machine and recent-pull data
src/types/                       # Domain models and payment types
src/hooks/                       # Shared responsive hooks
src/theme/                       # Colors, breakpoints, shape, and modal-card tokens
src/utils/                       # Currency formatting and simulated async delays
src/assets/videos/               # Bundled opening-animation videos
__tests__/                       # App-level tests (rendered via Expo Router)
```

## Video assets

The opening animation uses [`expo-video`](https://docs.expo.dev/versions/v57.0.0/sdk/video/).
Remote URLs are supported by the component, while the current mock machine
falls back to bundled files:

- `src/assets/videos/Reveal web.mp4` for Web
- `src/assets/videos/BlueReveal_Mobile.mp4` for Android and iOS

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

- File-based routing via Expo Router (`app/_layout.tsx`, `app/index.tsx`).
- Static HTML generation for the app shell (`web.output: "static"`),
  verified with `npx expo export -p web`.
- The investigation above, so the limitation is documented rather than
  silently absent.

See [SPEC.md](SPEC.md) for the full product flow and target behavior, and
[CLAUDE.md](CLAUDE.md) for project conventions and required validation steps.
