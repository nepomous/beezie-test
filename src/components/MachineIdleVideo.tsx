import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";

interface MachineIdleVideoProps {
  style?: StyleProp<ViewStyle>;
}

const idleClawVideo = require("../assets/videos/Idle-claw.mp4");

/** Muted, looping idle animation shown behind the machine's purchase panel. */
export function MachineIdleVideo({ style }: MachineIdleVideoProps) {
  const player = useVideoPlayer(idleClawVideo, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  // `loop` isn't always honored on web, so manually restart on end/ready as a fallback.
  useEventListener(player, "playToEnd", () => {
    player.replay();
  });

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay" && !player.playing) {
      player.play();
    }
  });

  return (
    <VideoView
      style={[styles.video, style]}
      player={player}
      nativeControls={false}
      contentFit="cover"
      allowsPictureInPicture={false}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: "100%",
    aspectRatio: 1,
  },
});
