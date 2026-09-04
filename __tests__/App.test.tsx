import renderer, { act } from "react-test-renderer";

import App from "../App";

it("renders the home screen without crashing", async () => {
  jest.useFakeTimers();

  let tree: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<App />);
  });
  // Deterministically flush the mocked async services (setTimeout-based) so
  // their state updates resolve before the test ends.
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1000);
  });

  expect(tree!.toJSON()).toBeTruthy();

  jest.useRealTimers();
});
