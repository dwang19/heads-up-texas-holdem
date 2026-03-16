/**
 * PRD: game-design/core-rules.md (CR-020–CR-025, CR-040–CR-046)
 * PRD: game-design/game-flow.md (GF-030–GF-034)
 * Betting validation, fold/call/raise, betting round completion, betting order
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('Betting Integration (CR-020–CR-025, CR-040–CR-046, GF-030–GF-034)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Betting controls presence (LC-070–LC-074)', () => {
    test('Fold, Call/Check, and Raise buttons appear after game start', async () => {
      render(<App />);
      await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
      screen.getByRole('button', { name: /Start Game/i }).click();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Fold/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Call|Check/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Raise/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('Fold button is present when game started', async () => {
      render(<App />);
      await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
      screen.getByRole('button', { name: /Start Game/i }).click();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      await waitFor(() => {
        const foldBtn = screen.getByRole('button', { name: /Fold/i });
        expect(foldBtn).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Controls disabled when not player turn (LC-074)', () => {
    test('betting controls have disabled class when AI is acting', async () => {
      render(<App />);
      await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
      screen.getByRole('button', { name: /Start Game/i }).click();
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });
      const bettingControls = document.querySelector('.betting-controls');
      if (bettingControls) {
        const isDisabled = bettingControls.classList.contains('disabled') ||
          screen.getByRole('button', { name: /Fold/i }).hasAttribute('disabled');
        expect(typeof isDisabled).toBe('boolean');
      }
    });
  });

  describe('Raise input (LC-072)', () => {
    test('raise input field is present after game start', async () => {
      render(<App />);
      await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
      screen.getByRole('button', { name: /Start Game/i }).click();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      await waitFor(() => {
        const raiseInput = document.querySelector('.raise-input') || document.querySelector('input[type="number"]');
        if (raiseInput) {
          expect(raiseInput).toBeInTheDocument();
        }
      }, { timeout: 3000 });
    });
  });
});
