# beezie-test

Beezie challenge — a React Native app built with [Expo](https://expo.dev),
targeting **Android**, **iOS**, and **Web** from a single TypeScript
codebase.

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server and choose a platform:

```bash
npm start
```

Or start directly on a specific platform:

```bash
npm run android
npm run ios
npm run web
```

## Scripts

| Script            | Description                              |
| ----------------- | ----------------------------------------- |
| `npm start`       | Start the Expo dev server                  |
| `npm run android` | Start on Android (emulator/device)         |
| `npm run ios`     | Start on iOS (simulator, macOS only)       |
| `npm run web`     | Start in the browser                       |
| `npm test`        | Run the Jest test suite                    |
| `npm run lint`    | Run ESLint                                 |

## Project structure

```
App.tsx                 # App entry / composition root
src/
  components/            # Shared, reusable UI components
  hooks/                  # Shared hooks (e.g. useResponsive)
  theme/                  # Design tokens (e.g. breakpoints)
__tests__/               # Top-level tests
```

## Responsiveness

This app is designed to adapt across phone, tablet, and desktop/web
viewport sizes using the `useResponsive()` hook and shared `breakpoints`
(see `src/hooks/useResponsive.ts` and `src/theme/breakpoints.ts`). See
`CLAUDE.md` for the full set of responsiveness conventions used in this
project.

## AI assistant configuration

- `CLAUDE.md` — project rules and conventions for Claude Code (and other AI
  assistants). Add new rules here as the project evolves.
- `.claude/agents/` — Claude Code subagents specialized for this Expo app
  (`expo-developer`, `expo-reviewer`).
