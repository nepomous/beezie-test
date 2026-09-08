import renderer, { act } from "react-test-renderer";

import type { ClawItem } from "../../types/claw";
import { WhatYouCanPullScreen } from "../WhatYouCanPullScreen";

const itemPool: ClawItem[] = [
  {
    id: "item-a",
    name: "Item A",
    imageUrl: "https://example.com/a.png",
    fairMarketValue: 372,
    rarity: "common",
  },
  {
    id: "item-b",
    name: "Item B",
    imageUrl: "https://example.com/b.png",
    fairMarketValue: 900,
    rarity: "rare",
  },
];

describe("WhatYouCanPullScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders one item at a time, advancing to the next every 2000ms and looping back to the first", () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <WhatYouCanPullScreen itemPool={itemPool} onContinue={jest.fn()} />,
      );
    });

    expect(
      tree!.root.findByProps({ testID: "pull-item-value-item-a" }).props
        .children,
    ).toBe("Approx market value: $372");
    expect(
      tree!.root.findAllByProps({ testID: "pull-item-value-item-b" }),
    ).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(
      tree!.root.findByProps({ testID: "pull-item-value-item-b" }).props
        .children,
    ).toBe("Approx market value: $900");
    expect(
      tree!.root.findAllByProps({ testID: "pull-item-value-item-a" }),
    ).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(
      tree!.root.findByProps({ testID: "pull-item-value-item-a" }).props
        .children,
    ).toBe("Approx market value: $372");
  });

  it('"Do Not Refresh" is decorative — no onPress handler', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <WhatYouCanPullScreen itemPool={itemPool} onContinue={jest.fn()} />,
      );
    });

    const button = tree!.root.findByProps({
      testID: "do-not-refresh-button",
    });
    expect(button.props.onPress).toBeUndefined();
  });

  it("calls onContinue automatically after the delay, without any user action", async () => {
    const onContinue = jest.fn();
    act(() => {
      renderer.create(
        <WhatYouCanPullScreen itemPool={itemPool} onContinue={onContinue} />,
      );
    });

    expect(onContinue).not.toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
