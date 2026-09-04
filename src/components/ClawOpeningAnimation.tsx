import { useEffect, useRef } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";

import { colors } from "../theme/colors";

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
 * Fullscreen, muted, non-looping opening animation played after a successful
 * purchase. Always resolves via `onAnimationEnd`, even on load/playback
 * failure, so the reveal flow never gets stuck.
 */
export function ClawOpeningAnimation({
  videoUrl,
  onAnimationEnd,
}: ClawOpeningAnimationProps) {
  const hasEndedRef = useRef(false);
  const hasStartedPlayingRef = useRef(false);

  const player = useVideoPlayer(resolveVideoSource(videoUrl), (instance) => {
    instance.loop = false;
    instance.muted = true;
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
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
});
