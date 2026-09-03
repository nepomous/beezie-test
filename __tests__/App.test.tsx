import renderer, { act } from 'react-test-renderer';

import App from '../App';

it('renders the home screen without crashing', () => {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<App />);
  });
  expect(tree!.toJSON()).toBeTruthy();
});
