# Core Rules

## Overview

This document defines the Texas Hold'em poker rules as implemented in the game. The game is a heads-up (1v1) variant where a human player competes against an AI opponent.

## Requirements

### Game Format

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| CR-001 | Heads-up (2-player) format | Done | Human vs AI only |
| CR-002 | Standard 52-card deck | Done | 4 suits x 13 ranks, Fisher-Yates shuffle in `Deck` class |
| CR-003 | Each player receives 2 hole cards | Done | Dealt face-down; AI cards hidden until showdown |
| CR-004 | 5 community cards dealt across 3 rounds | Done | Flop (3), Turn (1), River (1), each preceded by a burn card |
| CR-005 | Best 5-card hand from 7 available cards | Done | Evaluated in `pokerLogic.ts` |

### Hand Rankings

| Rank | Hand | Status | Notes |
|------|------|--------|-------|
| 10 | Royal Flush (A K Q J 10, same suit) | Done | `isRoyalFlush()` |
| 9 | Straight Flush (5 consecutive, same suit) | Done | `isStraightFlush()`, includes wheel (A-2-3-4-5) |
| 8 | Four of a Kind | Done | `isFourOfAKind()` |
| 7 | Full House (3 of a kind + pair) | Done | `isFullHouse()` |
| 6 | Flush (5 same suit) | Done | `isFlush()` |
| 5 | Straight (5 consecutive) | Done | `isStraight()`, includes wheel |
| 4 | Three of a Kind | Done | `isThreeOfAKind()` |
| 3 | Two Pair | Done | `isTwoPair()` |
| 2 | One Pair | Done | `isOnePair()` |
| 1 | High Card | Done | `getHighCard()` |

### Blind Structure

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| CR-010 | Small Blind = $5 | Done | Hardcoded constant |
| CR-011 | Big Blind = $10 | Done | Hardcoded constant |
| CR-012 | Starting chips = $100 per player | Done | Set in `getInitialPlayers()` |
| CR-013 | Blind positions rotate each round | Done | `isSmallBlind`/`isBigBlind` flags swap in `startNextRound()` |
| CR-014 | Player chooses starting blind position | Done | Radio buttons on init screen (Big Blind or Small Blind) |

### Betting Rules

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| CR-020 | Fold -- forfeit hand, lose any chips already bet | Done | Sets `hasFolded = true` |
| CR-021 | Check -- pass action when no bet to match | Done | Treated as Call with $0 amount |
| CR-022 | Call -- match the current bet | Done | `callAmount = currentBet - player.currentBet` |
| CR-023 | Raise -- increase the bet by at least $5 | Done | Min raise $5, increments of $5; opponent's ability to call is validated |
| CR-024 | Raise resets `hasActedThisRound` for other players | Done | Forces another action from opponent |
| CR-025 | Raise capped by opponent's chip stack | Done | Cannot raise more than opponent can call |

### All-In Handling

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| CR-030 | Detect when a player has 0 chips after betting | Done | `player.chips === 0` check |
| CR-031 | Auto-deal remaining community cards when all-in | Done | `dealRemainingCommunityCards()` with staggered animation |
| CR-032 | Proceed directly to showdown after all-in runout | Done | AI cards flip, then `determineWinner()` called |
| CR-033 | Side pots for multi-player all-in scenarios | Planned | Not needed for 2-player, but required if multiplayer added |

### Showdown and Pot

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| CR-040 | Evaluate both hands using `evaluateHand()` | Done | Compares best 5-card hand from 7 |
| CR-041 | Compare hands using `compareHands()` | Done | Returns 1, -1, or 0 (tie) |
| CR-042 | Award pot to winner | Done | Winner's chip count increased by pot amount |
| CR-043 | Split pot on tie | Done | `Math.floor(potAmount / 2)` to each player |
| CR-044 | Kicker tie-breaking with descriptive output | Done | `getTieBreakingDescriptions()` shows which kicker won |
| CR-045 | Fold win -- award pot without revealing AI cards | Done | `handleFoldWinWithPot()`, no showdown phase |
| CR-046 | Chip accounting verification | Done | `verifyChipAccounting()` asserts total always equals $200 |

### Win/Loss Conditions

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| CR-050 | Game over when a player cannot afford the big blind ($10) | Done | `chips < 10` check after pot award |
| CR-051 | Victory screen for human win | Done | Shows congratulations message |
| CR-052 | Defeat screen for AI win | Done | Shows "better luck" message |
| CR-053 | Restart option returns to round 1, same settings | Done | `restartGame()` |
| CR-054 | Quit option returns to initialization screen | Done | `handleQuitGame()` calls `resetGame()` |

## Current Implementation

- Hand evaluation: `src/game/pokerLogic.ts` -- waterfall pattern checking highest rank first
- Hand comparison: `compareHands()` compares rank, then card-by-card for same-rank hands
- Deck management: `src/game/deck.ts` -- `Deck` class with Fisher-Yates shuffle
- Betting logic: `src/App.tsx` -- `handleBettingAction()` for human, `triggerAiActionIfNeeded()` for AI

## Design Decisions

- **No side pots:** In a 2-player game, side pots are unnecessary. If multiplayer is added, this must be revisited.
- **Minimum raise = $5:** Chosen for simplicity. Standard poker uses "at least the size of the previous raise" which is more complex.
- **Raise capped by opponent:** Prevents raises the opponent literally cannot call, keeping the game fair.
- **Chip accounting verification:** A debug-only function that asserts the total chip economy always sums to $200. Catches bugs early.

## Open Questions / Known Issues

- Odd-chip split on ties: `Math.floor(potAmount / 2)` means $1 can be lost when pot is odd. Negligible for $5 increments.
- Blind amounts are hardcoded. A future enhancement could allow customizable blinds.
