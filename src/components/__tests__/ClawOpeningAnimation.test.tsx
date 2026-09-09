import renderer, { act } from "react-test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ClawOpeningAnimation } from "../ClawOpeningAnimation";

// Mirrors the component's own internal constants so the test can advance
// fake timers well past both without hardcoding unrelated magic numbers.
const SAFETY_TIMEOUT_MS = 4000;
const MAX_PLAYBACK_WATCHDOG_MS = 20000;

function renderAnimation(onAnimationEnd: () => void) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 0, height: 0 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ClawOpeningAnimation
          videoUrl="https://example.com/reveal.mp4"
          onAnimationEnd={onAnimationEnd}
        />
      </SafeAreaProvider>,
    );
  });
  return tree!;
}

describe("ClawOpeningAnimation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls onAnimationEnd exactly once when the skip button is pressed", () => {
    const onAnimationEnd = jest.fn();
    const tree = renderAnimation(onAnimationEnd);

    act(() => {
      tree.root.findByProps({ testID: "skip-button" }).props.onPress();
    });

    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it("does not fire onAnimationEnd again from the safety timeouts/watchdog after skip", async () => {
    const onAnimationEnd = jest.fn();
    const tree = renderAnimation(onAnimationEnd);

    act(() => {
      tree.root.findByProps({ testID: "skip-button" }).props.onPress();
    });

    expect(onAnimationEnd).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(
        SAFETY_TIMEOUT_MS + MAX_PLAYBACK_WATCHDOG_MS + 1000,
      );
    });

    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });
});
