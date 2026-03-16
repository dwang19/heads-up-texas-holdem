# Data Models

## Overview

This document defines all TypeScript interfaces, the complete App state shape, and the Deck class API. These models form the backbone of the game's data layer.

## Requirements

### Core Interfaces (src/game/types.ts)

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| DM-001 | `Card` interface with suit, rank, displayRank | Done | Suits: hearts, diamonds, clubs, spades; Ranks: 2-14 (Ace=14) |
| DM-002 | `Player` interface with full game state per player | Done | Tracks identity, cards, chips, blinds, betting state |
| DM-003 | `GameState` interface for overall game | Done | Comprehensive game snapshot |
| DM-004 | `PokerHand` interface for evaluated hands | Done | Type, numeric rank, contributing cards, description |
| DM-005 | `GameAction` interface for player actions | Done | fold, call, raise, check with optional amount |

#### Card

```typescript
interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: number;        // 2-14 (14 = Ace)
  displayRank: string; // '2'...'10', 'J', 'Q', 'K', 'A'
}
```

#### Player

```typescript
interface Player {
  id: string;             // 'human' | 'ai'
  name: string;           // User-entered name or 'AI Player'
  cards: Card[];          // 0-2 hole cards
  chips: number;          // Current chip count
  isHuman: boolean;       // true for human, false for AI
  isSmallBlind: boolean;  // Current round position
  isBigBlind: boolean;    // Current round position
  currentBet: number;     // Chips bet in current betting round (resets each phase)
  hasFolded: boolean;     // true if folded this hand
  hasActedThisRound: boolean; // true if acted in current betting round
}
```

#### GameState

```typescript
interface GameState {
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
```

Note: The `GameState` interface in `types.ts` is defined but not directly used as a single state object. Instead, each field is managed as a separate `useState` hook in `App.tsx`.

#### PokerHand

```typescript
interface PokerHand {
  type: 'high-card' | 'pair' | 'two-pair' | 'three-of-a-kind' |
        'straight' | 'flush' | 'full-house' | 'four-of-a-kind' |
        'straight-flush' | 'royal-flush';
  rank: number;       // 1-10 (higher = better)
  cards: Card[];      // The 5 cards forming this hand
  description: string; // e.g., "Pair of Kings", "Ace High Straight"
}
```

#### GameAction

```typescript
interface GameAction {
  type: 'fold' | 'call' | 'raise' | 'check';
  amount?: number;
  playerId: string;
}
```

### AI-Specific Types (src/game/ai.ts)

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| DM-010 | `AIDecision` type for action outcomes | Done | `'fold' | 'call' | 'raise'` |
| DM-011 | `AIPersonality` type for behavior profiles | Done | `'aggressive' | 'conservative' | 'balanced'` |
| DM-012 | `AIDecisionResult` interface with action + reasoning | Done | Includes optional amount and human-readable reasoning string |

```typescript
type AIDecision = 'fold' | 'call' | 'raise';
type AIPersonality = 'aggressive' | 'conservative' | 'balanced';

interface AIDecisionResult {
  action: AIDecision;
  amount?: number;
  reasoning: string;
}
```

### Deck Class API (src/game/deck.ts)

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| DM-020 | `constructor()` -- initialize standard 52-card deck | Done | 4 suits x 13 ranks |
| DM-021 | `shuffle()` -- Fisher-Yates shuffle in place | Done | Mutates internal card array |
| DM-022 | `dealCard()` -- pop one card from top | Done | Returns `Card | undefined` |
| DM-023 | `dealCards(count)` -- deal multiple cards | Done | Returns `Card[]` |
| DM-024 | `getRemainingCards()` -- cards left in deck | Done | Returns number |
| DM-025 | `reset()` -- reinitialize to full sorted deck | Done | Clears and rebuilds |
| DM-026 | `getCards()` -- return copy of internal array | Done | For debugging/testing |
| DM-027 | `createDeck()` factory -- create and shuffle a new deck | Done | Convenience function |
| DM-028 | `getSuitSymbol()` -- map suit to Unicode symbol | Done | hearts->♥, diamonds->♦, clubs->♣, spades->♠ |
| DM-029 | `getSuitColor()` -- map suit to display color | Done | hearts/diamonds->red, clubs/spades->black |

### App.tsx State Shape

The following `useState` hooks collectively represent the runtime game state:

**Game Initialization:**

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `gameStarted` | `boolean` | `false` | Whether init overlay is dismissed |
| `humanPlayerName` | `string` | `'Player1'` | Player's chosen name |
| `humanIsBigBlindFirst` | `boolean` | `true` | Starting blind position |

**Round Management:**

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `roundNumber` | `number` | `1` | Current round counter |
| `gameOver` | `boolean` | `false` | Whether a player has busted |
| `overallWinner` | `Player | null` | `null` | Winner of the overall game |

**Core Game State:**

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `players` | `Player[]` | 2 players | Human + AI player objects |
| `deck` | `Deck` | new shuffled deck | Current deck instance |
| `communityCards` | `CardType[]` | `[]` | 0-5 dealt community cards |
| `burnedCards` | `CardType[]` | `[]` | 0-3 burned cards |
| `pot` | `number` | `0` | Current pot amount |
| `currentBet` | `number` | `0` | Bet amount to match in current round |
| `currentPlayerIndex` | `number` | `-1` | Index into `players` array; -1 = no active turn |
| `gamePhase` | `string` | `'waiting'` | Current phase of play |
| `raiseAmount` | `string` | `''` | Human's raise input value |
| `aiPersonality` | `AIPersonality` | `'balanced'` | AI behavior profile (hardcoded) |
| `winner` | `Player | null` | `null` | Winner of current hand |
| `handComplete` | `boolean` | `false` | Whether current hand has concluded |

**Showdown Data:**

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `showdownData` | `object | null` | `null` | Hands, community cards used, pot amount, tie flag |
| `lastPotWon` | `number` | `0` | Pot amount from last completed hand (for display) |

**UI Animation State:**

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `isDealing` | `boolean` | `false` | Community card dealing in progress |
| `animatingCardIndices` | `number[]` | `[]` | Which community card slots are animating |
| `burnAnimatingIndex` | `number | null` | `null` | Which burn slot is animating |
| `holeCardAnimating` | `boolean` | `false` | Hole card dealing in progress |
| `aiCardsFlipping` | `boolean` | `false` | AI card flip animation in progress |
| `hoveredPlayerHand` | `'human' | 'ai' | null` | `null` | Which player's hand is being hovered |

**Action Display:**

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `aiActionDisplay` | `object | null` | `null` | AI action text and thinking state |
| `phaseAnnouncement` | `string | null` | `null` | Phase transition announcement text |
| `playerLastActions` | `Record<string, string>` | `{}` | Last action text per player ID |
| `gameLog` | `Array<{timestamp, message}>` | initial entry | Timestamped game event log |

## Design Decisions

- **Separate useState hooks vs single state object:** Each piece of state is an independent `useState` call rather than a single `GameState` object. This provides granular re-renders but makes it harder to reason about state consistency. The `GameState` interface in `types.ts` is essentially documentation, not used at runtime.
- **Player IDs as strings:** Using `'human'` and `'ai'` as IDs works for 2-player. Multi-player would need UUID-style IDs.
- **Mutable Deck class:** The `Deck` class uses internal mutation (`pop`, splice) rather than returning new arrays. This is fine since only one deck exists per hand, but it means `setTimeout` chains must pre-deal cards to avoid timing issues (which `dealRemainingCommunityCards` does).
- **`currentBet` on Player vs on game:** `player.currentBet` tracks what the player has bet in the *current betting round* (resets each phase). The game-level `currentBet` is the amount all players must match. This distinction is critical for correct call/raise calculations.
