/**
 * PRD: game-design/core-rules.md (CR-020–CR-025, CR-046)
 * Betting validation: fold, check, call, raise, chip accounting, betting round completion, player order
 */

import { Player } from './types';
import {
  validateFoldAction,
  validateCallAction,
  validateRaiseAction,
  verifyChipAccounting,
  isBettingRoundComplete,
  getFirstPlayerIndex,
  getNextActivePlayerIndex,
} from './betting';

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'human',
  name: 'Player1',
  cards: [],
  chips: 100,
  isHuman: true,
  isSmallBlind: true,
  isBigBlind: false,
  currentBet: 0,
  hasFolded: false,
  hasActedThisRound: false,
  ...overrides,
});

const createOpponent = (overrides: Partial<Player> = {}): Player => ({
  id: 'ai',
  name: 'AI Player',
  cards: [],
  chips: 100,
  isHuman: false,
  isSmallBlind: false,
  isBigBlind: true,
  currentBet: 0,
  hasFolded: false,
  hasActedThisRound: false,
  ...overrides,
});

describe('validateFoldAction (CR-020)', () => {
  test('valid fold during preflop', () => {
    const result = validateFoldAction(createPlayer(), 'preflop');
    expect(result.valid).toBe(true);
  });

  test('valid fold during any betting phase', () => {
    for (const phase of ['preflop', 'flop', 'turn', 'river']) {
      expect(validateFoldAction(createPlayer(), phase).valid).toBe(true);
    }
  });

  test('invalid fold outside betting rounds', () => {
    const result = validateFoldAction(createPlayer(), 'showdown');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/outside of betting rounds/i);
  });

  test('invalid fold if already folded', () => {
    const result = validateFoldAction(createPlayer({ hasFolded: true }), 'preflop');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/already folded/i);
  });
});

describe('validateCallAction (CR-021, CR-022)', () => {
  test('valid call with sufficient chips', () => {
    const player = createPlayer({ currentBet: 5, chips: 95 });
    const result = validateCallAction(player, 10, 'preflop');
    expect(result.valid).toBe(true);
    expect(result.callAmount).toBe(5);
  });

  test('check when currentBet matches (CR-021)', () => {
    const player = createPlayer({ currentBet: 10, chips: 90 });
    const result = validateCallAction(player, 10, 'flop');
    expect(result.valid).toBe(true);
    expect(result.callAmount).toBe(0);
  });

  test('invalid call with insufficient chips', () => {
    const player = createPlayer({ currentBet: 0, chips: 5 });
    const result = validateCallAction(player, 10, 'preflop');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/insufficient chips/i);
  });

  test('invalid call outside betting rounds', () => {
    const result = validateCallAction(createPlayer(), 10, 'waiting');
    expect(result.valid).toBe(false);
  });

  test('invalid call if already folded', () => {
    const result = validateCallAction(createPlayer({ hasFolded: true }), 10, 'flop');
    expect(result.valid).toBe(false);
  });
});

describe('validateRaiseAction (CR-023, CR-024, CR-025)', () => {
  const players = [
    createPlayer({ currentBet: 10, chips: 90 }),
    createOpponent({ currentBet: 10, chips: 90 }),
  ];

  test('valid raise of $5 (minimum)', () => {
    const result = validateRaiseAction(players[0], 10, '5', 'preflop', players);
    expect(result.valid).toBe(true);
    expect(result.totalRaiseAmount).toBe(5);
    expect(result.minRaise).toBe(5);
  });

  test('raise must be at least $5 (CR-023)', () => {
    const result = validateRaiseAction(players[0], 10, '3', 'preflop', players);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/at least \$5/);
  });

  test('invalid raise with non-numeric input', () => {
    const result = validateRaiseAction(players[0], 10, 'abc', 'preflop', players);
    expect(result.valid).toBe(false);
  });

  test('raise capped by player chips', () => {
    const poorPlayer = createPlayer({ currentBet: 0, chips: 10 });
    const ps = [poorPlayer, createOpponent({ chips: 100 })];
    const result = validateRaiseAction(poorPlayer, 10, '20', 'flop', ps);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/insufficient chips/i);
  });

  test('raise capped by opponent stack (CR-025)', () => {
    const richPlayer = createPlayer({ currentBet: 10, chips: 90 });
    const poorOpponent = createOpponent({ currentBet: 10, chips: 10 });
    const ps = [richPlayer, poorOpponent];
    const result = validateRaiseAction(richPlayer, 10, '20', 'preflop', ps);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/opponent can only afford/i);
  });

  test('invalid raise when folded', () => {
    const folded = createPlayer({ hasFolded: true });
    const result = validateRaiseAction(folded, 10, '5', 'flop', [folded, createOpponent()]);
    expect(result.valid).toBe(false);
  });

  test('invalid raise with zero chips', () => {
    const broke = createPlayer({ chips: 0 });
    const result = validateRaiseAction(broke, 10, '5', 'flop', [broke, createOpponent()]);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/no funds/i);
  });

  test('invalid raise outside betting rounds', () => {
    const result = validateRaiseAction(createPlayer(), 0, '5', 'showdown', [createPlayer(), createOpponent()]);
    expect(result.valid).toBe(false);
  });
});

describe('verifyChipAccounting (CR-046)', () => {
  test('valid when total is 200', () => {
    const ps = [createPlayer({ chips: 90 }), createOpponent({ chips: 95 })];
    const result = verifyChipAccounting(ps, 15, 'test');
    expect(result.valid).toBe(true);
    expect(result.total).toBe(200);
  });

  test('invalid when total is not 200', () => {
    const ps = [createPlayer({ chips: 100 }), createOpponent({ chips: 100 })];
    const result = verifyChipAccounting(ps, 10, 'test');
    expect(result.valid).toBe(false);
    expect(result.total).toBe(210);
  });

  test('custom expected total', () => {
    const ps = [createPlayer({ chips: 50 }), createOpponent({ chips: 50 })];
    const result = verifyChipAccounting(ps, 0, 'test', 100);
    expect(result.valid).toBe(true);
  });
});

describe('isBettingRoundComplete (GF-033)', () => {
  test('complete when all active players acted and matched bet', () => {
    const ps = [
      createPlayer({ hasActedThisRound: true, currentBet: 10 }),
      createOpponent({ hasActedThisRound: true, currentBet: 10 }),
    ];
    expect(isBettingRoundComplete(ps, 10)).toBe(true);
  });

  test('incomplete when a player has not acted', () => {
    const ps = [
      createPlayer({ hasActedThisRound: true, currentBet: 10 }),
      createOpponent({ hasActedThisRound: false, currentBet: 10 }),
    ];
    expect(isBettingRoundComplete(ps, 10)).toBe(false);
  });

  test('incomplete when bets differ', () => {
    const ps = [
      createPlayer({ hasActedThisRound: true, currentBet: 10 }),
      createOpponent({ hasActedThisRound: true, currentBet: 5 }),
    ];
    expect(isBettingRoundComplete(ps, 10)).toBe(false);
  });

  test('complete when only one active player (opponent folded)', () => {
    const ps = [
      createPlayer({ hasActedThisRound: true, currentBet: 10 }),
      createOpponent({ hasFolded: true }),
    ];
    expect(isBettingRoundComplete(ps, 10)).toBe(true);
  });
});

describe('getFirstPlayerIndex (GF-030, GF-031)', () => {
  const players = [
    createPlayer({ id: 'human', isSmallBlind: true, isBigBlind: false }),
    createOpponent({ id: 'ai', isSmallBlind: false, isBigBlind: true }),
  ];

  test('preflop: SB acts first (GF-030)', () => {
    expect(getFirstPlayerIndex(players, 'preflop')).toBe(0);
  });

  test('postflop: BB acts first (GF-031)', () => {
    expect(getFirstPlayerIndex(players, 'flop')).toBe(1);
    expect(getFirstPlayerIndex(players, 'turn')).toBe(1);
    expect(getFirstPlayerIndex(players, 'river')).toBe(1);
  });

  test('fallback when no SB/BB found', () => {
    const noPositions = [
      createPlayer({ isSmallBlind: false, isBigBlind: false }),
      createOpponent({ isSmallBlind: false, isBigBlind: false }),
    ];
    expect(getFirstPlayerIndex(noPositions, 'preflop')).toBe(0);
  });

  test('returns -1 when no active players', () => {
    const allFolded = [
      createPlayer({ hasFolded: true }),
      createOpponent({ hasFolded: true }),
    ];
    expect(getFirstPlayerIndex(allFolded, 'preflop')).toBe(-1);
  });
});

describe('getNextActivePlayerIndex (GF-032)', () => {
  test('returns next active player index', () => {
    const ps = [createPlayer({ id: 'human' }), createOpponent({ id: 'ai' })];
    expect(getNextActivePlayerIndex(ps, 0)).toBe(1);
    expect(getNextActivePlayerIndex(ps, 1)).toBe(0);
  });

  test('returns -1 when only one active', () => {
    const ps = [createPlayer(), createOpponent({ hasFolded: true })];
    expect(getNextActivePlayerIndex(ps, 0)).toBe(-1);
  });
});
