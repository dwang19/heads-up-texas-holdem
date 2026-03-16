# Test Cases and PRD Mapping

All tests live under `src/` so CRA's Jest discovers them automatically. This README documents how tests map to each [PRD](../PRDs/) document.

## Folder layout

| Location | Purpose |
|----------|---------|
| `src/game/pokerLogic.test.ts` | Hand evaluation, rankings, compareHands, kicker tie-breaking |
| `src/game/deck.test.ts` | Deck class API (create, shuffle, deal, reset, suit helpers) |
| `src/game/ai.test.ts` | AI decision-making, hand strength, draws, pot odds, personalities |
| `src/game/betting.test.ts` | Betting validation (fold/call/raise), chip accounting, betting round logic, player order |
| `src/__tests__/integration/gameFlow.test.tsx` | App-level game flow (init, phases, dealing, fold win, Enter key) |
| `src/__tests__/integration/betting.test.tsx` | App-level betting controls (presence, disabled state, raise input) |
| `src/__tests__/components/Card.test.tsx` | Card states (face-up, hidden, empty, deck, burned, flipping, dealing, highlighted, dimmed) |
| `src/__tests__/components/PlayerArea.test.tsx` | Player area (name, chips, bet, badges, turn, folded, cards, showdown hover, highlighting) |
| `src/__tests__/components/App.init.test.tsx` | Init overlay (name, blinds, rules, Start button, Enter key) |
| `src/__tests__/components/StatusContainer.test.tsx` | Status container (AI thinking, game over, hidden state) |
| `src/__tests__/components/GameLog.test.tsx` | Game log (entries, timestamps, scrollable container) |
| `src/App.test.tsx` | App smoke tests (title, init overlay) |

## PRD to test file mapping

| PRD document | Requirement IDs | Test file(s) |
|--------------|-----------------|--------------|
| [game-design/core-rules.md](../PRDs/game-design/core-rules.md) | CR-001--CR-005 (deck, hand eval) | `pokerLogic.test.ts`, `deck.test.ts` |
| | CR-010--CR-014 (blinds, chips) | `betting.test.ts` (getFirstPlayerIndex), `gameFlow.test.tsx` |
| | CR-020--CR-025 (fold/call/raise) | `betting.test.ts` (validateFold/Call/RaiseAction) |
| | CR-030--CR-032 (all-in) | `gameFlow.test.tsx` (structural) |
| | CR-040--CR-046 (showdown, pot, accounting) | `pokerLogic.test.ts`, `betting.test.ts` (verifyChipAccounting) |
| | CR-044 (kicker tie-breaking) | `pokerLogic.test.ts` (kicker tests) |
| | CR-050--CR-054 (game over, restart) | `gameFlow.test.tsx` (structural) |
| [game-design/game-flow.md](../PRDs/game-design/game-flow.md) | GF-001--GF-006 (init, Enter key) | `App.init.test.tsx`, `gameFlow.test.tsx` |
| | GF-010--GF-013 (round lifecycle) | `gameFlow.test.tsx` |
| | GF-020--GF-027 (dealing, community, burn slots) | `gameFlow.test.tsx` |
| | GF-030--GF-034 (betting order) | `betting.test.ts` (getFirstPlayerIndex, isBettingRoundComplete) |
| | GF-040--GF-045 (phase transitions) | `gameFlow.test.tsx` |
| | GF-050--GF-052 (fold win) | `gameFlow.test.tsx` |
| | GF-060--GF-064 (all-in runout) | `gameFlow.test.tsx` (structural) |
| | GF-070--GF-073 (game over) | `gameFlow.test.tsx`, `StatusContainer.test.tsx` |
| [game-design/ai-opponent.md](../PRDs/game-design/ai-opponent.md) | AI-001--AI-004 (personalities) | `ai.test.ts` |
| | AI-010--AI-014 (hand strength) | `ai.test.ts` (indirect via getAIDecision) |
| | AI-020--AI-024 (draw detection) | `ai.test.ts` (flush/straight draw scenarios) |
| | AI-030--AI-031 (pot odds) | `ai.test.ts` |
| | AI-040--AI-046 (decisions, raise) | `ai.test.ts` |
| | AI-050--AI-053 (bluff) | Private methods -- tested indirectly |
| | AI-060--AI-062 (thinking display) | `StatusContainer.test.tsx` |
| [technical/data-models.md](../PRDs/technical/data-models.md) | DM-001--DM-005 (interfaces) | Exercised by all game logic tests |
| | DM-020--DM-029 (Deck API) | `deck.test.ts` |
| [ui-ux/layout-and-components.md](../PRDs/ui-ux/layout-and-components.md) | LC-001--LC-003 (App shell) | `App.test.tsx` |
| | LC-010--LC-016 (init overlay) | `App.init.test.tsx` |
| | LC-040--LC-048 (PlayerArea) | `PlayerArea.test.tsx` |
| | LC-050--LC-060 (Card) | `Card.test.tsx` |
| | LC-070--LC-075 (betting controls) | `betting.test.tsx` (integration) |
| | LC-080--LC-083 (game log) | `GameLog.test.tsx` |
| | LC-090--LC-097 (status container) | `StatusContainer.test.tsx` |
| [ui-ux/visual-design.md](../PRDs/ui-ux/visual-design.md) | VD-* | CSS class assertions in `Card.test.tsx` (highlight colors); visual review for rest |
| [ui-ux/animations.md](../PRDs/ui-ux/animations.md) | AN-* | CSS class assertions in `Card.test.tsx` (dealing, flipping, burn-animating); visual review for rest |

## Running tests

```bash
npm test                                      # watch mode
npm test -- --watchAll=false                  # single run
npm test -- --testPathPattern="pokerLogic"    # subset by file
npm test -- --testPathPattern="betting"       # betting tests (unit + integration)
npm test -- --testPathPattern="components"    # component tests
npm test -- --testPathPattern="integration"   # integration tests
```

## Traceability

Each test file includes a comment at the top referencing the PRD path and requirement ID range. Use `describe` block names to find specific requirement coverage.
