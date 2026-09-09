import renderer, { act } from "react-test-renderer";

import { QuantityStepper } from "../QuantityStepper";

// Mock the audio API (never test real audio playback), matching the
// __mocks__/expo-audio.js stand-in used everywhere else in the app.
jest.mock("expo-audio");

const { __getLastMockAudioPlayer } = jest.requireMock("expo-audio") as {
  __getLastMockAudioPlayer: () => { play: jest.Mock; seekTo: jest.Mock } | null;
};

describe("QuantityStepper", () => {
  it("plays the click sound when pressing the increase button", () => {
    const onChange = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <QuantityStepper quantity={1} onChange={onChange} />,
      );
    });

    const player = __getLastMockAudioPlayer();
    expect(player).not.toBeNull();

    act(() => {
      tree.root
        .findByProps({ accessibilityLabel: "Increase quantity" })
        .props.onPress();
    });

    expect(player!.seekTo).toHaveBeenCalledWith(0);
    expect(player!.play).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("plays the click sound when pressing the decrease button", () => {
    const onChange = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <QuantityStepper quantity={5} onChange={onChange} />,
      );
    });

    const player = __getLastMockAudioPlayer();
    expect(player).not.toBeNull();

    act(() => {
      tree.root
        .findByProps({ accessibilityLabel: "Decrease quantity" })
        .props.onPress();
    });

    expect(player!.seekTo).toHaveBeenCalledWith(0);
    expect(player!.play).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("does not play the click sound for a disabled button", () => {
    const onChange = jest.fn();
    act(() => {
      renderer.create(
        <QuantityStepper quantity={1} onChange={onChange} min={1} />,
      );
    });

    const player = __getLastMockAudioPlayer();
    expect(player).not.toBeNull();
    expect(player!.play).not.toHaveBeenCalled();
  });

  it("replays (rewinds + plays again) instead of stacking on rapid repeated clicks", () => {
    const onChange = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <QuantityStepper quantity={1} onChange={onChange} max={10} />,
      );
    });

    const player = __getLastMockAudioPlayer();
    const increaseButton = () =>
      tree.root.findByProps({ accessibilityLabel: "Increase quantity" });

    act(() => {
      increaseButton().props.onPress();
      increaseButton().props.onPress();
      increaseButton().props.onPress();
    });

    // Same player instance is reused and re-triggered for every click, no
    // new/overlapping instances created for rapid repeated presses.
    expect(__getLastMockAudioPlayer()).toBe(player);
    expect(player!.seekTo).toHaveBeenCalledTimes(3);
    expect(player!.play).toHaveBeenCalledTimes(3);
  });
});
