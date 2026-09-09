import { useEffect, useState } from "react";
import {
  Animated,
  type LayoutChangeEvent,
  Modal,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { PaymentModal } from "./PaymentModal";
import { WhatYouCanPullScreen } from "./WhatYouCanPullScreen";
import { colors } from "../theme/colors";
import {
  MODAL_BACKDROP_COLOR,
  MODAL_CARD_MAX_WIDTH,
  MODAL_OVERLAY_PADDING,
} from "../theme/modalCard";
import { shape } from "../theme/shape";
import type { ClawItem, ClawMachine, PullResult } from "../types/claw";

export type PurchaseFlowStage = "payment" | "whatYouCanPull" | null;

interface PurchaseFlowModalProps {
  stage: PurchaseFlowStage;
  // PaymentModal ("Review & pay") props.
  onClose: () => void;
  onConfirm: (result: PullResult) => void;
  /**
   * The full claw machine being purchased, not just its id/name — needed so
   * `PaymentModal`'s order summary can show the machine's own `iconAsset`.
   */
  machine: ClawMachine;
  quantity: number;
  totalPrice: number;
  pointsPerPull: number;
  // WhatYouCanPullScreen ("What you can pull") props.
  itemPool: ClawItem[];
  onContinue: () => void;
}

const FADE_DURATION = 150;
const RESIZE_DURATION = 280;

interface StageSize {
  width: number;
  height: number;
}

// Both stages share the same centered-card shell as `PaymentModal`/
// `WhatYouCanPullScreen` standalone — only the measured content height
// (real, via onLayout) differs per stage.
function getCenteredCardSize(
  windowWidth: number,
  windowHeight: number,
  measuredHeight: number | null,
): StageSize {
  const width = Math.min(
    windowWidth - MODAL_OVERLAY_PADDING * 2,
    MODAL_CARD_MAX_WIDTH,
  );
  const maxHeight = windowHeight - MODAL_OVERLAY_PADDING * 2;
  // Falls back to the width until the real content height is measured via
  // onLayout, then stays in sync with it, capped so the box never grows
  // past the viewport.
  return { width, height: Math.min(measuredHeight ?? width, maxHeight) };
}

/**
 * Single persistent modal that hosts the "Review & pay" and "What you can
 * pull" screens as two stages of one purchase flow, cross-fading the content
 * and resizing the container between each stage's real dimensions instead of
 * mounting/unmounting two separate modals.
 *
 * Uses explicit `Animated.Value` width/height interpolation with
 * `useNativeDriver: false` (required for layout properties) instead of
 * `LayoutAnimation`, which isn't reliable on react-native-web.
 */
export function PurchaseFlowModal({
  stage,
  onClose,
  onConfirm,
  machine,
  quantity,
  totalPrice,
  pointsPerPull,
  itemPool,
  onContinue,
}: PurchaseFlowModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [renderedStage, setRenderedStage] = useState<PurchaseFlowStage>(stage);
  const [paymentContentHeight, setPaymentContentHeight] = useState<
    number | null
  >(null);
  const [whatYouCanPullContentHeight, setWhatYouCanPullContentHeight] =
    useState<number | null>(null);

  // Lazily sized from the initial `stage` so the box isn't 0x0 if this
  // component ever mounts already open (the app always mounts it closed).
  const initialSize =
    stage !== null
      ? getCenteredCardSize(windowWidth, windowHeight, null)
      : { width: 0, height: 0 };
  const [animatedWidth] = useState(() => new Animated.Value(initialSize.width));
  const [animatedHeight] = useState(
    () => new Animated.Value(initialSize.height),
  );
  const [contentOpacity] = useState(() => new Animated.Value(1));

  const paymentSize = getCenteredCardSize(
    windowWidth,
    windowHeight,
    paymentContentHeight,
  );
  const whatYouCanPullSize = getCenteredCardSize(
    windowWidth,
    windowHeight,
    whatYouCanPullContentHeight,
  );

  const getPresetForStage = (
    target: Exclude<PurchaseFlowStage, null>,
  ): StageSize => (target === "payment" ? paymentSize : whatYouCanPullSize);

  // Opening from fully closed: snap directly to the target stage's preset
  // (adjust state during render, per React's "reset state on prop change"
  // pattern) instead of cross-fading — the Modal's own fade-in animation
  // handles the entrance, there's no previous content to transition from.
  if (renderedStage === null && stage !== null) {
    const preset = getPresetForStage(stage);
    animatedWidth.setValue(preset.width);
    animatedHeight.setValue(preset.height);
    contentOpacity.setValue(1);
    setRenderedStage(stage);
  }

  useEffect(() => {
    if (stage === renderedStage || renderedStage === null) {
      return;
    }

    if (stage === null) {
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: false,
      }).start(() => {
        setRenderedStage(null);
      });
      return;
    }

    const nextPreset = getPresetForStage(stage);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(animatedWidth, {
        toValue: nextPreset.width,
        duration: RESIZE_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(animatedHeight, {
        toValue: nextPreset.height,
        duration: RESIZE_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setRenderedStage(stage);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: false,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- presets are re-derived from current window size on every run, only `stage` should retrigger the transition
  }, [stage]);

  // Keep the current stage's box in sync with viewport resizes (e.g. web)
  // or content height changes, without re-running the fade/resize transition.
  useEffect(() => {
    if (renderedStage === null) {
      return;
    }
    const preset = getPresetForStage(renderedStage);
    animatedWidth.setValue(preset.width);
    animatedHeight.setValue(preset.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to viewport/measurement changes for the already-settled stage
  }, [
    windowWidth,
    windowHeight,
    paymentContentHeight,
    whatYouCanPullContentHeight,
    renderedStage,
  ]);

  useEffect(() => {
    return () => {
      animatedWidth.stopAnimation();
      animatedHeight.stopAnimation();
      contentOpacity.stopAnimation();
    };
  }, [animatedWidth, animatedHeight, contentOpacity]);

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (renderedStage === "payment") {
      setPaymentContentHeight(height);
    } else if (renderedStage === "whatYouCanPull") {
      setWhatYouCanPullContentHeight(height);
    }
  };

  return (
    <Modal
      visible={stage !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.box,
            {
              width: animatedWidth,
              height: animatedHeight,
              maxHeight: windowHeight - MODAL_OVERLAY_PADDING * 2,
            },
          ]}
        >
          <Animated.View
            style={{ opacity: contentOpacity }}
            onLayout={handleContentLayout}
          >
            {renderedStage === "payment" && (
              <PaymentModal
                renderAsModal={false}
                visible
                onClose={onClose}
                onConfirm={onConfirm}
                machineId={machine.id}
                machineName={machine.name}
                machineIcon={machine.iconAsset}
                quantity={quantity}
                totalPrice={totalPrice}
                pointsPerPull={pointsPerPull}
              />
            )}
            {renderedStage === "whatYouCanPull" && (
              <WhatYouCanPullScreen
                renderAsModal={false}
                itemPool={itemPool}
                onContinue={onContinue}
              />
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: MODAL_BACKDROP_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    // Own solid background so the box stays opaque while contentOpacity
    // fades to 0 during stage transitions, instead of revealing the backdrop.
    backgroundColor: colors.surface,
    overflow: "hidden",
    borderRadius: shape.modalCard,
  },
});
