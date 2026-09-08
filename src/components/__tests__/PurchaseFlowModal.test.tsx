import renderer, { act } from "react-test-renderer";
import { Text } from "react-native";

import { WalletProvider } from "../../context/WalletContext";
import type { ClawItem } from "../../types/claw";
import {
  PurchaseFlowModal,
  type PurchaseFlowStage,
} from "../PurchaseFlowModal";

const itemPool: ClawItem[] = [
  {
    id: "item-a",
    name: "Item A",
    imageUrl: "https://example.com/a.png",
    fairMarketValue: 372,
    rarity: "common",
  },
];

// Fade-out (150ms) + resize (280ms) + fade-in (150ms), with margin.
const TRANSITION_MS = 700;

function renderFlow(stage: PurchaseFlowStage) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <WalletProvider>
        <PurchaseFlowModal
          stage={stage}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          machineId="pokemon-gold-claw"
          machineName="Pokémon Gold Claw"
          quantity={1}
          totalPrice={10}
          pointsPerPull={100}
          itemPool={itemPool}
          onContinue={jest.fn()}
        />
      </WalletProvider>,
    );
  });
  return tree!;
}

function findAllText(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(Text)
    .map((node) => node.props.children)
    .flat()
    .filter((value): value is string => typeof value === "string");
}

describe("PurchaseFlowModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the payment stage content when stage is 'payment'", () => {
    const tree = renderFlow("payment");

    expect(findAllText(tree)).toContain("Review & pay");
  });

  it("renders nothing meaningful (closed modal) when stage is null", () => {
    const tree = renderFlow(null);

    expect(findAllText(tree)).not.toContain("Review & pay");
    expect(findAllText(tree)).not.toContain("What you can pull");
  });

  it("cross-fades from the payment stage to the whatYouCanPull stage", () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <WalletProvider>
          <PurchaseFlowModal
            stage="payment"
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            machineId="pokemon-gold-claw"
            machineName="Pokémon Gold Claw"
            quantity={1}
            totalPrice={10}
            pointsPerPull={100}
            itemPool={itemPool}
            onContinue={jest.fn()}
          />
        </WalletProvider>,
      );
    });

    expect(findAllText(tree!)).toContain("Review & pay");

    act(() => {
      tree!.update(
        <WalletProvider>
          <PurchaseFlowModal
            stage="whatYouCanPull"
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            machineId="pokemon-gold-claw"
            machineName="Pokémon Gold Claw"
            quantity={1}
            totalPrice={10}
            pointsPerPull={100}
            itemPool={itemPool}
            onContinue={jest.fn()}
          />
        </WalletProvider>,
      );
    });

    // Mid-transition: old content is still fading out / container still
    // resizing, so it hasn't swapped to the new stage's content yet.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(findAllText(tree!)).not.toContain("What you can pull");

    // Let the resize + fade-in finish.
    act(() => {
      jest.advanceTimersByTime(TRANSITION_MS);
    });

    expect(findAllText(tree!)).toContain("What you can pull");
    expect(findAllText(tree!)).not.toContain("Review & pay");
  });
});
