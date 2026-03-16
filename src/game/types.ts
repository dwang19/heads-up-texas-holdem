export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: number; // 2-14 (14 = Ace)
  displayRank: string; // '2', '3', ..., '10', 'J', 'Q', 'K', 'A'
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  chips: number;
  isHuman: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  currentBet: number;
  hasFolded: boolean;
  hasActedThisRound: boolean; // Track if player has acted in current betting round
}

export interface GameState {
  players: Player[];
  communityCards: Card[];
  deck: Card[];
  currentPlayer: number;
  pot: number;
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  currentBet: number;
  gameStarted: boolean;
  winner: Player | null;
  handComplete: boolean;
  roundNumber: number;
  gameOver: boolean;
  overallWinner: Player | null;
  humanPlayerName: string;
  humanIsBigBlindFirst: boolean;
}

export interface PokerHand {
  type: 'high-card' | 'pair' | 'two-pair' | 'three-of-a-kind' | 'straight' | 'flush' | 'full-house' | 'four-of-a-kind' | 'straight-flush' | 'royal-flush';
  rank: number;
  cards: Card[];
  description: string;
}

export interface GameAction {
  type: 'fold' | 'call' | 'raise' | 'check';
  amount?: number;
  playerId: string;
}