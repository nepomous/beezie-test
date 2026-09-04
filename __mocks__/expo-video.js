// Manual Jest mock for expo-video: the real native module can't load under
// jest-expo's test environment, so tests get a minimal stand-in player/view.
const React = require("react");

function createMockPlayer() {
  return {
    loop: false,
    muted: false,
    playing: false,
    status: "idle",
    currentTime: 0,
    volume: 1,
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    replaceAsync: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeListener: jest.fn(),
  };
}

function useVideoPlayer(source, setup) {
  const player = createMockPlayer();
  if (setup) {
    setup(player);
  }
  return player;
}

function createVideoPlayer(source) {
  return createMockPlayer();
}

const VideoView = React.forwardRef((props, ref) => null);

module.exports = {
  useVideoPlayer,
  createVideoPlayer,
  VideoView,
};
