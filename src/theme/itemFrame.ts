import { StyleSheet } from "react-native";

import { colors } from "./colors";
import { shape } from "./shape";

/**
 * Shared two-level "white frame" styles for item images: a dark outer
 * frame (`itemFrameOuter`) nesting a white inner box (`itemFrameInner`),
 * used by `ItemCard` and `RevealSingleModal`.
 */
export const itemFrame = StyleSheet.create({
  itemFrameOuter: {
    width: "100%",
    borderRadius: shape.itemCardFrame,
    backgroundColor: colors.cardFrame,
    padding: 4,
  },
  itemFrameInner: {
    position: "relative",
    aspectRatio: 1,
    padding: 30,
    borderRadius: shape.itemCardInner,
    backgroundColor: colors.cardSurface,
  },
});
