// Manual Jest mock for expo-audio: the real native module can't load under
// jest-expo's test environment, so tests get a minimal stand-in player.
// Jest auto-picks this up for any expo-audio import (matches __mocks__/expo-video.js).
let lastMockPlayer = null;

function createMockPlayer() {
  lastMockPlayer = {
    playing: false,
    muted: false,
    volume: 1,
    isLoaded: true,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    replace: jest.fn(),
    remove: jest.fn(),
  };
  return lastMockPlayer;
}

function useAudioPlayer(source, options) {
  return createMockPlayer();
}

function createAudioPlayer(source, options) {
  return createMockPlayer();
}

module.exports = {
  useAudioPlayer,
  createAudioPlayer,
  // Test-only helper: returns the most recently created mock player instance
  // so a test can assert on its play()/seekTo() jest.fn() calls.
  __getLastMockAudioPlayer: () => lastMockPlayer,
};
