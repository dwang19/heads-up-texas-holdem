# AI Opponent

## Overview

The AI opponent uses a hand-strength-plus-pot-odds model to make betting decisions. It supports three personality types (aggressive, conservative, balanced) though only "balanced" is currently active. The system evaluates current hand equity, improvement potential (draws), and pot odds to choose between fold, call, and raise.

## Requirements

### Personality System

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AI-001 | Three personality types: aggressive, conservative, balanced | Done | `AIPersonality` type in `ai.ts` |
| AI-002 | Each personality has distinct decision thresholds | Done | `getPersonalityThresholds()` returns raise/call/fold thresholds |
| AI-003 | Personality selection UI for the player | Planned | Currently hardcoded to `'balanced'` in `App.tsx` |
| AI-004 | Balanced personality used by default | Done | Default parameter in `PokerAI` constructor |

**Personality Thresholds:**

| Personality | Raise Threshold | Call Threshold | Fold Threshold |
|-------------|----------------|----------------|----------------|
| Aggressive | 0.6 | 0.3 | 0.1 |
| Balanced | 0.7 | 0.4 | 0.15 |
| Conservative | 0.8 | 0.5 | 0.2 |

### Hand Strength Evaluation

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AI-010 | Evaluate hand strength on 0-1 scale | Done | `evaluateHandStrength()` returns float |
| AI-011 | Current hand equity from rank mapping | Done | `calculateCurrentEquity()` maps hand rank (1-10) to equity (0.35-1.0) |
| AI-012 | Phase multiplier reduces certainty in early streets | Done | Preflop: 0.6, Flop: 0.8, Turn: 0.9, River: 1.0 |
| AI-013 | Improvement equity from draws and outs | Done | `calculateImprovementEquity()` adds flush, straight, overcard, pair potential |
| AI-014 | Combine current + improvement equity weighted by cards remaining | Done | `combineEquity()` weights shift as more cards are dealt |

**Hand Rank to Equity Mapping:**

| Hand | Rank | Base Equity |
|------|------|-------------|
| Royal Flush | 10 | 1.00 |
| Straight Flush | 9 | 0.98 |
| Four of a Kind | 8 | 0.95 |
| Full House | 7 | 0.90 |
| Flush | 6 | 0.85 |
| Straight | 5 | 0.75 |
| Three of a Kind | 4 | 0.65 |
| Two Pair | 3 | 0.55 |
| Pair | 2 | 0.45 |
| High Card | 1 | 0.35 |

### Draw Detection

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AI-020 | Flush draw detection (4 cards of same suit) | Done | `calculateFlushOuts()` -- 9 outs for 4-flush, 11 for suited preflop |
| AI-021 | Open-ended straight draw detection | Done | `calculateStraightOuts()` -- 8 outs |
| AI-022 | Gutshot straight draw detection | Done | Same function -- 4 outs |
| AI-023 | Overcard equity (preflop only) | Done | `calculateOvercardEquity()` -- higher cards = more equity |
| AI-024 | Pair improvement outs (flop/turn) | Done | `calculatePairOuts()` -- remaining cards matching hole card ranks |

### Pot Odds Calculation

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AI-030 | Calculate pot odds as `callAmount / (pot + callAmount)` | Done | `calculatePotOdds()` |
| AI-031 | Pot odds = 0 when no bet to call | Done | Returns 0, allowing free check |

### Decision Logic

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AI-040 | Always check when no bet to call (free card) | Done | `callAmount === 0` branch in `decideAction()` |
| AI-041 | Raise when hand strength exceeds raise threshold and no bet to call | Done | Builds pot with strong hands |
| AI-042 | Preflop: almost always see the flop | Done | Only folds preflop if call > 30% of chips AND hand strength < 0.15 |
| AI-043 | Postflop: fold only when hand is very weak AND pot odds are poor | Done | Folds when `potOdds > 0.4` fails AND `handStrength > 0.1` fails |
| AI-044 | Raise amount scaled by hand strength and personality | Done | `calculateRaiseAmount()` with personality multiplier |
| AI-045 | Raise amounts rounded to $5 increments | Done | `Math.ceil(finalRaise / 5) * 5` |
| AI-046 | Fallback to call if insufficient chips for computed raise | Done | Catch block in raise handling |

### Bluffing

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AI-050 | Bluff opportunity detection | Partial | `isBluffOpportunity()` exists but is not called in main decision path |
| AI-051 | Bluff only with very weak hands (< 0.2 strength) | Done | `shouldBluff()` logic |
| AI-052 | Bluff only in turn/river, heads-up, reasonable pot odds | Done | Multiple guard conditions |
| AI-053 | Aggressive personality bluffs more (20% vs 5%) | Done | Personality-based bluff chance |

### AI Action Display

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AI-060 | Show "AI is thinking..." with animated dots | Done | 1500ms delay before decision shown |
| AI-061 | Display AI action (folds/checks/calls/raises + amount) | Done | `aiActionDisplay` state |
| AI-062 | Clear AI action display after 2500ms | Done | `setTimeout` in `triggerAiActionIfNeeded()` |

## Current Implementation

- **File:** `src/game/ai.ts`
- **Class:** `PokerAI` -- instantiated per decision via `getAIDecision()` factory function
- **Integration:** Called from `triggerAiActionIfNeeded()` in `App.tsx`, which is triggered by a `useEffect` watching for AI's turn
- **Debug logging:** Extensive `console.log` output showing hand strength, pot odds, and reasoning for every decision

## Design Decisions

- **Instantiate per decision:** A new `PokerAI` instance is created for each decision rather than persisting one. This is stateless by design -- the AI has no memory of previous hands.
- **No opponent modeling:** The AI evaluates only its own hand strength and pot odds. It does not track the human's betting patterns or adapt over time.
- **Preflop bias toward calling:** The AI almost never folds preflop. This makes the game more engaging (more showdowns) at the cost of optimal play.
- **Bluffing is mostly inactive:** The `shouldBluff()` and `isBluffOpportunity()` methods exist but are not integrated into the main `decideAction()` flow, so bluffing rarely occurs in practice.

## Open Questions / Known Issues

- The AI creates a new instance per decision, meaning `calculatePreflopPotential()` and `calculatePostflopPotential()` are defined but only used internally by the equity pipeline -- they could be simplified.
- Bluffing logic is defined but not wired into the main decision path. Integrating it would make the AI more unpredictable.
- The AI has no memory between hands. Adding opponent modeling (tracking fold frequency, raise frequency) would significantly improve play quality.
- AI personality is hardcoded to `'balanced'`. Exposing this as a user setting is a straightforward enhancement.
