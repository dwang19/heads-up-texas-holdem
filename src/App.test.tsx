import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// PRD: ui-ux/layout-and-components.md (LC-001). Smoke test.
test('renders app with Heads-Up Texas Hold\'em title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Heads-Up Texas Hold'em/i);
  expect(titleElement).toBeInTheDocument();
});

// PRD: game-design/game-flow.md (GF-001). Init overlay visible by default.
test('shows initialization overlay on load', () => {
  render(<App />);
  expect(screen.getByText(/Welcome to Heads-Up Hold'em/i)).toBeInTheDocument();
});
