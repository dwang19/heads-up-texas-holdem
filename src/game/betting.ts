import { Player } from './types';

const BETTING_PHASES = ['preflop', 'flop', 'turn', 'river'];
const TOTAL_STARTING_CHIPS = 200; // 2 players x $100

export const validateFoldAction = (
  player: Player,
  gamePhase: string
): { valid: boolean; reason?: string } => {
  if (!BETTING_PHASES.includes(gamePhase)) {
    return { valid: false, reason: 'Cannot fold outside of betting rounds' };
  }
  if (player.hasFolded) {
    return { valid: false, reason: 'Player has already folded' };
  }
  return { valid: true };
};

export const validateCallAction = (
  player: Player,
  currentBet: number,
  gamePhase: string
): { valid: boolean; reason?: string; callAmount?: number } => {
  if (!BETTING_PHASES.includes(gamePhase)) {
    return { valid: false, reason: 'Cannot call outside of betting rounds' };
  }
  if (player.hasFolded) {
    return { valid: false, reason: 'Player has already folded' };
  }
  const callAmount = Math.max(0, currentBet - player.currentBet);
  if (callAmount > player.chips) {
    return { valid: false, reason: `Insufficient chips. Need $${callAmount} to call, but only have $${player.chips}` };
  }
  return { valid: true, callAmount };
};

export const validateRaiseAction = (
  player: Player,
  currentBet: number,
  raiseAmountStr: string,
  gamePhase: string,
  players: Player[]
): { valid: boolean; reason?: string; totalRaiseAmount?: number; minRaise?: number } => {
  if (!BETTING_PHASES.includes(gamePhase)) {
    return { valid: false, reason: 'Cannot raise outside of betting rounds' };
  }
  if (player.hasFolded) {
    return { valid: false, reason: 'Player has already folded' };
  }
  if (player.chips === 0) {
    return { valid: false, reason: 'No funds remaining' };
  }

  const raiseAmount = parseInt(raiseAmountStr);
  if (isNaN(raiseAmount) || raiseAmount < 5) {
    return { valid: false, reason: 'Raise amount must be at least $5' };
  }

  const callAmount = Math.max(0, currentBet - player.currentBet);
  const minRaise = callAmount + raiseAmount;

  if (minRaise > player.chips) {
    return { valid: false, reason: `Insufficient chips. Need at least $${minRaise} to raise, but only have $${player.chips}` };
  }

  const opponent = players.find(p => !p.hasFolded && p.id !== player.id);
  if (opponent) {
    const opponentCallAmount = (currentBet - opponent.currentBet) + raiseAmount;
    if (opponentCallAmount > opponent.chips) {
      return {
        valid: false,
        reason: `Raise too large. Opponent can only afford to call $${opponent.chips - (currentBet - opponent.currentBet)}. Maximum raise: $${opponent.chips - (currentBet - opponent.currentBet)}`
      };
    }
  }

  return { valid: true, totalRaiseAmount: minRaise, minRaise: raiseAmount };
};

export const verifyChipAccounting = (
  playersToCheck: Player[],
  potToCheck: number,
  context: string,
  expectedTotal: number = TOTAL_STARTING_CHIPS
): { valid: boolean; total: number; expected: number } => {
  const totalChips = playersToCheck.reduce((sum, p) => sum + p.chips, 0);
  const total = totalChips + potToCheck;
  return { valid: total === expectedTotal, total, expected: expectedTotal };
};

export const isBettingRoundComplete = (players: Player[], currentBet: number): boolean => {
  const activePlayers = players.filter(p => !p.hasFolded);
  if (activePlayers.length <= 1) return true;
  return activePlayers.every(player =>
    player.hasActedThisRound && player.currentBet === currentBet
  );
};

export const getFirstPlayerIndex = (
  players: Player[],
  phase: 'preflop' | 'flop' | 'turn' | 'river'
): number => {
  const activePlayers = players.filter(p => !p.hasFolded);
  if (activePlayers.length === 0) return -1;

  if (phase === 'preflop') {
    const smallBlindPlayer = activePlayers.find(p => p.isSmallBlind);
    if (smallBlindPlayer) {
      return players.findIndex(p => p.id === smallBlindPlayer.id);
    }
  } else {
    const bigBlindPlayer = activePlayers.find(p => p.isBigBlind);
    if (bigBlindPlayer) {
      return players.findIndex(p => p.id === bigBlindPlayer.id);
    }
  }

  return players.findIndex(p => !p.hasFolded);
};

export const getNextActivePlayerIndex = (players: Player[], currentIndex: number): number => {
  const activePlayers = players.filter(p => !p.hasFolded);
  if (activePlayers.length <= 1) return -1;

  const currentPlayer = players[currentIndex];
  const currentActiveIndex = activePlayers.findIndex(p => p.id === currentPlayer.id);
  const nextActiveIndex = (currentActiveIndex + 1) % activePlayers.length;
  const nextPlayerId = activePlayers[nextActiveIndex].id;
  return players.findIndex(p => p.id === nextPlayerId);
};
