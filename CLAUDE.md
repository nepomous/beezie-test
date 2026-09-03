@AGENTS.md

# CLAUDE.md

This file provides project-specific rules and context for Claude Code (and
other AI coding assistants). Add new rules below as the project grows.

## Project overview

This is a React Native app built with **Expo** (SDK 57), written in
TypeScript. It targets **Android**, **iOS**, and **Web** from a single
codebase, so every UI change must be verified (or at least reasoned about)
on all three platforms.

## Tech stack

- Expo SDK 57 / React Native 0.86 / React 19
- TypeScript with `strict` mode enabled
- `react-native-web` + `@expo/metro-runtime` for web support
- `jest` + `jest-expo` + `react-test-renderer` for testing
- `eslint` with `eslint-config-expo` for linting

## Commands

- `npm start` — start the Expo dev server (choose a platform interactively)
- `npm run android` / `npm run ios` / `npm run web` — start on a specific platform
- `npm test` — run the Jest test suite
- `npm run lint` — run ESLint
- `npx tsc --noEmit` — type-check the project

## Responsiveness rules

- Never hardcode pixel-perfect layouts for a single device size. Use the
  `useResponsive()` hook (`src/hooks/useResponsive.ts`) and the shared
  `breakpoints` (`src/theme/breakpoints.ts`) to adapt layouts for mobile,
  tablet, and desktop/web widths.
- Prefer flexbox (`flex`, `flexDirection`, `flexWrap`) and percentage/`flex`
  based sizing over fixed widths/heights.
- Wrap top-level screen content in `ResponsiveContainer`
  (`src/components/ResponsiveContainer.tsx`) so it stays readable on wide
  web/tablet viewports instead of stretching edge-to-edge.
- Use `Platform.OS` / `Platform.select()` only when a behavior genuinely
  differs per platform (e.g. native-only APIs); prefer responsive layout
  logic based on viewport size over platform checks when possible.
- Test new screens by resizing the web viewport and by checking both phone
  and tablet dimensions in the simulator/emulator.

## Code conventions

- Place shared UI in `src/components/`, hooks in `src/hooks/`, and design
  tokens (colors, spacing, breakpoints) in `src/theme/`.
- Use function components with hooks; avoid class components.
- Co-locate tests next to the code they test in a `__tests__` folder, or in
  the repository-root `__tests__` folder for top-level app tests.
- Keep `App.tsx` as a thin composition root; put real logic in `src/`.

## Before submitting changes

1. Run `npm run lint` and `npx tsc --noEmit` — both must be clean.
2. Run `npm test` — all tests must pass.
3. Run `npx expo export -p web` to confirm the web build still bundles.
