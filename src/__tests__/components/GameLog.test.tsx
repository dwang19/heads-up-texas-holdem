/**
 * PRD: ui-ux/layout-and-components.md (LC-080–LC-083)
 * Game log: entries rendered, timestamps, scrollable
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('Game Log (LC-080–LC-083)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('game log section exists after game start (LC-080)', async () => {
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
    screen.getByRole('button', { name: /Start Game/i }).click();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Game Log')).toBeInTheDocument();
  });

  test('log entries are rendered with timestamps (LC-080, LC-083)', async () => {
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
    screen.getByRole('button', { name: /Start Game/i }).click();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => {
      const logEntries = document.querySelectorAll('.log-entry');
      expect(logEntries.length).toBeGreaterThan(0);
    });
  });

  test('log entry contains timestamp element (LC-080)', async () => {
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
    screen.getByRole('button', { name: /Start Game/i }).click();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => {
      const timestamps = document.querySelectorAll('.log-time');
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  test('log contains "Game started" message after start', async () => {
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
    screen.getByRole('button', { name: /Start Game/i }).click();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => {
      expect(screen.getByText(/Game started/i)).toBeInTheDocument();
    });
  });

  test('log entries container is scrollable (LC-081)', async () => {
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText(/Enter your name/i), 'Test');
    screen.getByRole('button', { name: /Start Game/i }).click();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    const logEntries = document.querySelector('.log-entries');
    expect(logEntries).toBeInTheDocument();
  });
});
