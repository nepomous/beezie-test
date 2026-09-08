import renderer, { act } from "react-test-renderer";

import type { ClawItem } from "../../types/claw";
import { ItemCard } from "../ItemCard";

const item: ClawItem = {
  id: "item-a",
  name: "Item A",
  imageUrl: "https://example.com/a.png",
  fairMarketValue: 372,
  rarity: "common",
};

describe("ItemCard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders item.name when caption is omitted", () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ItemCard item={item} />);
    });

    expect(
      tree!.root.findByProps({ testID: "item-card-caption-item-a" }).props
        .children,
    ).toBe("Item A");
  });

  it("renders caption instead of item.name when provided", () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ItemCard item={item} caption="Approx market value: $372" />,
      );
    });

    expect(
      tree!.root.findByProps({ testID: "item-card-caption-item-a" }).props
        .children,
    ).toBe("Approx market value: $372");
  });

  it("hides the caption/name text when hideCaption is true", () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ItemCard item={item} hideCaption />);
    });

    expect(
      tree!.root.findAllByProps({ testID: "item-card-caption-item-a" }),
    ).toHaveLength(0);
  });

  it("renders the progress bar when swapping with swapDurationMs provided", () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ItemCard
          item={item}
          swapping
          swapDurationMs={3000}
          onSwap={jest.fn()}
        />,
      );
    });

    expect(
      tree!.root.findAllByProps({ testID: "swap-progress-item-a" }).length,
    ).toBeGreaterThan(0);

    // Stops the in-flight Animated.timing so it doesn't keep firing on real
    // timers after this test (and the file) finish.
    act(() => {
      tree!.unmount();
    });
  });

  it("does not render a progress bar when swapDurationMs is omitted", () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ItemCard item={item} swapping onSwap={jest.fn()} />,
      );
    });

    expect(
      tree!.root.findAllByProps({ testID: "swap-progress-item-a" }),
    ).toHaveLength(0);
  });
});
