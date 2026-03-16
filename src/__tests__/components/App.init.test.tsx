/**
 * PRD: game-design/game-flow.md (GF-001–GF-006), ui-ux/layout-and-components.md (LC-010–LC-016)
 * Init overlay: name input, blind selection, rules, Start button, Enter key
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('App init (GF-001–GF-006, LC-010–LC-016)', () => {
  test('init overlay shows Welcome and form', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to Texas Hold'em/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();
  });

  test('name input accepts text and has placeholder', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Enter your name/i);
    expect(input).toHaveAttribute('maxLength', '20');
    await userEvent.clear(input);
    await userEvent.type(input, 'Alice');
    expect(input).toHaveValue('Alice');
  });

  test('blind position options are present', () => {
    render(<App />);
    expect(screen.getByLabelText(/Big Blind \(\$10\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Small Blind \(\$5\)/i)).toBeInTheDocument();
  });

  test('game rules summary is displayed', () => {
    render(<App />);
    expect(screen.getByText(/Game Rules:/i)).toBeInTheDocument();
    expect(screen.getByText(/Each player starts with \$100/i)).toBeInTheDocument();
  });

  test('Start Game is enabled when name is not empty', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Enter your name/i);
    await userEvent.type(input, 'Bob');
    expect(screen.getByRole('button', { name: /Start Game/i })).not.toBeDisabled();
  });

  test('Enter key triggers game start when name is filled (GF-006, LC-016)', async () => {
    jest.useFakeTimers();
    render(<App />);
    const input = screen.getByPlaceholderText(/Enter your name/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'TestPlayer');
    await userEvent.keyboard('{Enter}');
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await waitFor(() => {
      expect(screen.queryByText(/Welcome to Texas Hold'em/i)).not.toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  test('Enter key does not start game when name is empty (GF-006)', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Enter your name/i);
    await userEvent.clear(input);
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(/Welcome to Texas Hold'em/i)).toBeInTheDocument();
  });
});
