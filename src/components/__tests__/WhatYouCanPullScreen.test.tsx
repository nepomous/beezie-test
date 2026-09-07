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
  it("renders every item from the pool with its approx market value", () => {
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
      tree!.root.findByProps({ testID: "pull-item-value-item-b" }).props
        .children,
    ).toBe("Approx market value: $900");
  });

  it('calls onContinue when "Do Not Refresh" is pressed', () => {
    const onContinue = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <WhatYouCanPullScreen itemPool={itemPool} onContinue={onContinue} />,
      );
    });

    act(() => {
      tree!.root
        .findByProps({ testID: "do-not-refresh-button" })
        .props.onPress();
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
