/**
 * Mobile-only UI elements: info bar, pot indicator, log toggle
 * These elements are always rendered in the DOM but hidden on desktop via CSS.
 * Tests verify they exist in the rendered output with correct content.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('Mobile-only elements', () => {
  test('mobile info bar renders with round, phase, and bet', async () => {
    jest.useFakeTimers();
    render(<App />);

    const startButton = screen.getByRole('button', { name: /Start Game/i });
    await userEvent.click(startButton);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Mobile info bar should contain round, phase, and bet via CSS class selectors
    const infoBar = document.querySelector('.mobile-info-bar');
    expect(infoBar).toBeInTheDocument();

    await waitFor(() => {
      expect(infoBar).toHaveTextContent('R1');
    });
    expect(infoBar).toHaveTextContent('Preflop');
    expect(infoBar).toHaveTextContent(/Bet: \$/);

    jest.useRealTimers();
  });

  test('mobile pot indicator renders pot amount', async () => {
    jest.useFakeTimers();
    render(<App />);

    const startButton = screen.getByRole('button', { name: /Start Game/i });
    await userEvent.click(startButton);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const potIndicator = document.querySelector('.mobile-pot-indicator');
    expect(potIndicator).toBeInTheDocument();

    await waitFor(() => {
      expect(potIndicator).toHaveTextContent(/Pot: \$/);
    });

    jest.useRealTimers();
  });

  test('mobile log toggle button renders and toggles game log visibility', async () => {
    jest.useFakeTimers();
    render(<App />);

    const startButton = screen.getByRole('button', { name: /Start Game/i });
    await userEvent.click(startButton);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Log toggle button should be present (use CSS class to avoid matching "Game Log" heading)
    const toggleButton = document.querySelector('.mobile-log-toggle') as HTMLElement;
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent(/Log/);

    // Game log box should not have mobile-visible class initially
    const gameLogBox = document.querySelector('.game-log-box.top-row-log');
    expect(gameLogBox).not.toHaveClass('mobile-visible');

    // Click the toggle — should add mobile-visible class
    await userEvent.click(toggleButton);
    expect(gameLogBox).toHaveClass('mobile-visible');

    // Click again — should remove mobile-visible class
    const closeButton = document.querySelector('.mobile-log-toggle') as HTMLElement;
    await userEvent.click(closeButton);
    expect(gameLogBox).not.toHaveClass('mobile-visible');

    jest.useRealTimers();
  });

  test('phaseDisplayName shows Preflop when gamePhase is waiting', () => {
    render(<App />);

    // Before game starts, the mobile info bar renders with Preflop
    // (gamePhase is 'waiting', which maps to 'Preflop')
    const mobilePhaseElement = document.querySelector('.mobile-phase');
    expect(mobilePhaseElement).toBeInTheDocument();
    expect(mobilePhaseElement).toHaveTextContent('Preflop');
  });
});
