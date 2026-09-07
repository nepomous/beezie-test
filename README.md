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
4. Play the fullscreen claw opening animation.
5. Reveal the pulled item(s), then keep or swap each item.

The home screen includes the machine image, price, reward points, rarity odds,
Top Items, and Recent Pulls. The layout stacks on narrow screens and switches
to a two-column presentation on wider tablet and Web viewports.

## Implementation status

- Payment is represented by `PaymentModalPlaceholder` and always uses the
  mocked Beezie wallet. Wallet selection, card payments, and promo codes are
  not connected to real services.
- Pull results are generated locally by `src/services/clawService.ts` using the
  machine's rarity weights and item pool.
- A pull has a shared 15-minute reveal window in the service model.
- Multiple-item pulls are currently revealed one item at a time. The grid,
  select-all control, countdown UI, and bulk swap flow described in `SPEC.md`
  are still pending.

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

For deterministic Jest runs, the mocked service delays are flushed with fake
timers in `__tests__/App.test.tsx`. `__mocks__/expo-video.js` provides the
`expo-video` mock used by Jest.

## Project structure

```text
App.tsx                         # App entry point
src/screens/ClawHeroScreen.tsx  # Main screen and flow orchestration
src/components/                 # Odds, quantity, payment, video, and reveal UI
src/services/clawService.ts     # Mock machine, wallet, and pull operations
src/mocks/                       # Machine and recent-pull data
src/types/                       # Domain models and payment types
src/hooks/                       # Shared responsive hooks
src/theme/                       # Colors and breakpoints
src/assets/videos/               # Bundled opening-animation videos
__tests__/                       # App and component tests
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

See [SPEC.md](SPEC.md) for the full product flow and target behavior, and
[CLAUDE.md](CLAUDE.md) for project conventions and required validation steps.
