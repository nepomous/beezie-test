import { act, renderRouter, screen } from "expo-router/testing-library";

// expo-router/testing-library's renderRouter wraps the tree in React
// Navigation's container, which currently logs two known-benign warnings
// under React 19.2.3 + fake timers: overlapping act() calls, and an
// "Invalid prop `navigation`" Fragment warning from its internal screen
// wrapper. This is a version-compatibility quirk between expo-router's
// testing-library and React 19.2.3, not a real bug (the app renders
// correctly on iOS/Android/Web), so we filter just these two known
// messages here rather than hiding console.error project-wide.
const KNOWN_BENIGN_CONSOLE_ERRORS = [
  "overlapping act() calls",
  "Invalid prop `navigation` supplied to `React.Fragment`",
];

// React logs some warnings with printf-style `%s` placeholders instead of an
// already-interpolated string, so substitute them before substring-matching.
function formatConsoleArgs(args: unknown[]): string {
  const [first, ...rest] = args;
  if (typeof first !== "string") {
    return args.map(String).join(" ");
  }
  let restIndex = 0;
  return first.replace(/%s/g, () => String(rest[restIndex++]));
}

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  const originalConsoleError = console.error.bind(console);
  consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation((...args) => {
      const message = formatConsoleArgs(args);
      if (
        KNOWN_BENIGN_CONSOLE_ERRORS.some((known) => message.includes(known))
      ) {
        return;
      }
      originalConsoleError(...args);
    });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

it("renders the home screen without crashing", async () => {
  jest.useFakeTimers();

  // IMPORTANT: renderRouter's fixture-path mode resolves relative to
  // process.cwd() (the project root), NOT this test file's directory.
  // "../app" resolves to a nonexistent directory above the repo and
  // silently yields zero matched routes (expo-router's
  // require-context-ponyfill swallows a missing directory instead of
  // throwing) — producing an empty render tree that still passes a bare
  // `toBeTruthy()` assertion. Must be "./app".
  renderRouter("./app", { initialUrl: "/" });

  // Deterministically flush the mocked async services (setTimeout-based) so
  // their state updates resolve before the test ends. Two sequential flush
  // boundaries are needed here (verified experimentally) — it's about the
  // number of act() flush boundaries crossed, not just total simulated time.
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1000);
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1000);
  });

  // Real content assertions, not just toBeTruthy() — a renderRouter path
  // regression (like the one above) or any future change that breaks
  // mounting must fail this test loudly instead of passing on an empty tree.
  expect(screen.getByText("Pokémon Gold Claw")).toBeTruthy();
  expect(screen.getByText("Start Now")).toBeTruthy();

  jest.useRealTimers();
});
