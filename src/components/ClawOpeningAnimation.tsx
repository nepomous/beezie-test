import { useEffect, useRef } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";

import { colors } from "../theme/colors";
import { shape } from "../theme/shape";

interface ClawOpeningAnimationProps {
  /** machine.videoOpeningUrl — remote URL when available, otherwise a bundled fallback is used. */
  videoUrl: string;
  onAnimationEnd: () => void;
}

const SAFETY_TIMEOUT_MS = 4000;
// Defense-in-depth: if playback genuinely starts (per `playingChange`) but
// `playToEnd` never fires for some reason (e.g. a stalled/aborted network
// fetch that the player doesn't surface as an "error" status — observed on
// web), this guarantees the modal still resolves instead of staying stuck.
const MAX_PLAYBACK_WATCHDOG_MS = 20000;
// Browsers can silently block autoplay-with-audio (the underlying play()
// promise rejects) without ever emitting an "error" status or a
// `playingChange` event — the only symptom is that playback just never
// starts. expo-video's web player doesn't surface that rejected promise to
// us, so we detect it heuristically: if playback hasn't started shortly
// after the player reports "readyToPlay", assume audio autoplay was
// blocked and retry muted instead of leaving the screen stuck.
const AUDIO_AUTOPLAY_FALLBACK_MS = 500;

// Bundled fallbacks for when videoUrl isn't a resolvable remote asset (e.g. mock data).
function resolveVideoSource(videoUrl: string): VideoSource {
  if (/^https?:\/\//i.test(videoUrl)) {
    return { uri: videoUrl };
  }

  return Platform.OS === "web"
    ? require("../assets/videos/Reveal web.mp4")
    : require("../assets/videos/BlueReveal_Mobile.mp4");
}

/**
 * Fullscreen, non-looping opening animation played after a successful
 * purchase, with its embedded audio audible. Always resolves via
 * `onAnimationEnd`, even on load/playback failure, so the reveal flow never
 * gets stuck. A skip button lets the user jump straight to
 * `onAnimationEnd()` without waiting for the video.
 */
export function ClawOpeningAnimation({
  videoUrl,
  onAnimationEnd,
}: ClawOpeningAnimationProps) {
  const insets = useSafeAreaInsets();
  const hasEndedRef = useRef(false);
  const hasStartedPlayingRef = useRef(false);
  const hasAppliedMutedFallbackRef = useRef(false);
  const audioFallbackTimeoutIdRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const player = useVideoPlayer(resolveVideoSource(videoUrl), (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.play();
  });

  const finish = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    onAnimationEnd();
  };

  useEventListener(player, "playToEnd", finish);

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay") {
      // Some platforms (observed on web) can report the source as ready
      // without ever actually starting playback if the initial autoplay
      // call raced with source resolution, so retry it defensively here —
      // it's a no-op if playback already started.
      player.play();

      if (audioFallbackTimeoutIdRef.current) {
        clearTimeout(audioFallbackTimeoutIdRef.current);
      }
      audioFallbackTimeoutIdRef.current = setTimeout(() => {
        if (
          !hasStartedPlayingRef.current &&
          !hasAppliedMutedFallbackRef.current
        ) {
          hasAppliedMutedFallbackRef.current = true;
          player.muted = true;
          player.play();
        }
      }, AUDIO_AUTOPLAY_FALLBACK_MS);
    } else if (status === "error") {
      finish();
    }
  });

  useEventListener(player, "playingChange", ({ isPlaying }) => {
    if (isPlaying) {
      hasStartedPlayingRef.current = true;
    }
  });

  useEffect(() => {
    // Loading/error safety net: if playback never actually starts, don't
    // leave the user stuck on a black screen.
    const loadTimeoutId = setTimeout(() => {
      if (!hasStartedPlayingRef.current) {
        finish();
      }
    }, SAFETY_TIMEOUT_MS);

    // Playback watchdog: if it starts but `playToEnd` never fires (e.g. a
    // stalled fetch that isn't surfaced as a player error), resolve anyway.
    const watchdogId = setTimeout(finish, MAX_PLAYBACK_WATCHDOG_MS);

    return () => {
      clearTimeout(loadTimeoutId);
      clearTimeout(watchdogId);
      if (audioFallbackTimeoutIdRef.current) {
        clearTimeout(audioFallbackTimeoutIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
      onRequestClose={finish}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.container}>
        <VideoView
          style={styles.video}
          player={player}
          nativeControls={false}
          contentFit="cover"
          allowsPictureInPicture={false}
        />

        <Pressable
          style={({ pressed }) => [
            styles.skipButton,
            { top: insets.top + 16, right: insets.right + 16 },
            pressed && styles.skipButtonPressed,
          ]}
          onPress={finish}
          hitSlop={12}
          testID="skip-button"
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skipButtonText}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  video: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: shape.circle,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonPressed: {
    opacity: 0.85,
  },
  skipButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
