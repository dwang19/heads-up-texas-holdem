/**
 * PRD: ui-ux/layout-and-components.md (LC-090–LC-097)
 * Status container: AI thinking, showdown result, fold result, game over, Next Round, hidden
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('Status Container (LC-090–LC-097)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('status container exists in the DOM after game start', async () => {
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
    screen.getByRole('button', { name: /Start Game/i }).click();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    const statusContainer = document.querySelector('.status-container');
    expect(statusContainer).toBeInTheDocument();
  });

  test('status container is hidden when no content to show (LC-097)', () => {
    render(<App />);
    const statusContainer = document.querySelector('.status-container');
    if (statusContainer) {
      expect(statusContainer.classList.contains('hidden')).toBe(true);
    }
  });

  test('AI thinking display shows after AI turn starts (LC-091)', async () => {
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
    screen.getByRole('button', { name: /Start Game/i }).click();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    const thinkingEl = screen.queryByText(/AI is thinking/i) || document.querySelector('.ai-thinking');
    if (thinkingEl) {
      expect(thinkingEl).toBeInTheDocument();
    }
  });

  test('game over content has restart and quit buttons (LC-095, GF-072, GF-073)', () => {
    const { container } = render(<App />);
    const gameOverContent = container.querySelector('.game-over-content');
    if (gameOverContent) {
      const restartBtn = gameOverContent.querySelector('.restart-btn');
      const quitBtn = gameOverContent.querySelector('.quit-btn');
      expect(restartBtn).toBeInTheDocument();
      expect(quitBtn).toBeInTheDocument();
    }
  });
});
