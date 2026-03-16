# Completed Features

## Overview

A retroactive log of all features built to date, organized by phase. This replaces and expands on the legacy `progress.md` file at the project root.

## Phase 1: Core Game Logic

| Feature | Description | PRD Reference |
|---------|-------------|---------------|
| Card and Deck classes | `Card` interface (suit, rank, displayRank), `Deck` class with shuffle, deal, reset | [Data Models](../technical/data-models.md) |
| Poker hand evaluation | All 10 hand types evaluated from 7 cards, waterfall pattern from Royal Flush to High Card | [Core Rules](../game-design/core-rules.md) |
| Hand comparison | `compareHands()` returns 1/-1/0, card-by-card tiebreaking | [Core Rules](../game-design/core-rules.md) |
| Kicker descriptions | `getDescriptionWithKicker()` and `getTieBreakingDescriptions()` for tie-breaking display | [Core Rules](../game-design/core-rules.md) |
| TypeScript interfaces | `Card`, `Player`, `GameState`, `PokerHand`, `GameAction` | [Data Models](../technical/data-models.md) |
| Wheel straight support | A-2-3-4-5 recognized as straight and straight flush | [Core Rules](../game-design/core-rules.md) |
| Unit tests for poker logic | `pokerLogic.test.ts` with hand evaluation tests | [Architecture](../technical/architecture.md) |

## Phase 2: UI Components

| Feature | Description | PRD Reference |
|---------|-------------|---------------|
| Card component | Face-up, face-down, empty, deck, burned, flipping states | [Layout & Components](../ui-ux/layout-and-components.md) |
| Three card sizes | Small (60x84), Medium (80x112), Large (100x140) | [Layout & Components](../ui-ux/layout-and-components.md) |
| Card back design | Dark gradient with crosshatch pattern overlay | [Visual Design](../ui-ux/visual-design.md) |
| PlayerArea component | Name, chips, cards, blind badges, turn indicator, last action | [Layout & Components](../ui-ux/layout-and-components.md) |
| CSS Grid game board | 3-column, 3-row layout with named grid areas | [Layout & Components](../ui-ux/layout-and-components.md) |
| Pot display | Large gold dollar amount in dedicated panel | [Visual Design](../ui-ux/visual-design.md) |
| Community cards display | 5 fixed card slots with placeholder empties | [Layout & Components](../ui-ux/layout-and-components.md) |
| Burn cards display | 3 fixed card slots for discarded cards | [Layout & Components](../ui-ux/layout-and-components.md) |
| Deck visual | Stacked face-down card with depth pseudo-elements | [Layout & Components](../ui-ux/layout-and-components.md) |
| Glassmorphism panels | Semi-transparent blur backgrounds on all sections | [Visual Design](../ui-ux/visual-design.md) |
| Responsive design (mobile) | Single-column stack at 768px breakpoint | [Visual Design](../ui-ux/visual-design.md) |

## Phase 3: Game Flow

| Feature | Description | PRD Reference |
|---------|-------------|---------------|
| Game initialization screen | Name input, blind selection, rules display, start button | [Game Flow](../game-design/game-flow.md) |
| Phase state management | preflop -> flop -> turn -> river -> showdown transitions | [Game Flow](../game-design/game-flow.md) |
| Blind system | $5 SB / $10 BB, posted at round start | [Core Rules](../game-design/core-rules.md) |
| Blind rotation | Positions swap each round | [Game Flow](../game-design/game-flow.md) |
| Dealing order | BB first card, SB second, BB third, SB fourth | [Game Flow](../game-design/game-flow.md) |
| Betting controls | Fold, Call/Check, Raise with $5 increment arrows | [Layout & Components](../ui-ux/layout-and-components.md) |
| Betting validation | Min raise $5, chip sufficiency, opponent ability to call | [Core Rules](../game-design/core-rules.md) |
| Betting order | SB first preflop, BB first postflop | [Game Flow](../game-design/game-flow.md) |
| Betting round completion | All active players acted AND matched current bet | [Game Flow](../game-design/game-flow.md) |
| Burn card mechanics | 1 card burned before each community deal | [Game Flow](../game-design/game-flow.md) |
| Fold win | Pot awarded immediately, no card reveal | [Game Flow](../game-design/game-flow.md) |
| All-in auto-deal | Remaining community cards dealt automatically when all-in | [Game Flow](../game-design/game-flow.md) |
| Showdown | AI cards flip, hands evaluated and compared | [Game Flow](../game-design/game-flow.md) |
| Tie detection and split pot | Both players marked as winners, pot split evenly | [Core Rules](../game-design/core-rules.md) |
| Card highlighting (showdown) | Used cards glow green (human) or blue (AI) | [Animations](../ui-ux/animations.md) |
| Hover highlight (showdown) | Hover over hand to see which community cards are used | [Animations](../ui-ux/animations.md) |
| Card dimming (showdown) | Unused hole cards dim when hovering | [Animations](../ui-ux/animations.md) |
| Round-based play | Multiple hands until one player busts | [Game Flow](../game-design/game-flow.md) |
| Next Round button | Rotates blinds, deals new hand | [Game Flow](../game-design/game-flow.md) |
| Game over detection | Player cannot afford big blind ($10) | [Game Flow](../game-design/game-flow.md) |
| Victory/Defeat screens | Context-sensitive messages with restart/quit | [Game Flow](../game-design/game-flow.md) |
| Game log with timestamps | Scrollable log of all actions and events | [Layout & Components](../ui-ux/layout-and-components.md) |
| Game info box | Round number, phase, current bet display | [Layout & Components](../ui-ux/layout-and-components.md) |
| Chip accounting verification | Debug function asserting total chips always = $200 | [Core Rules](../game-design/core-rules.md) |

## Phase 4: Computer AI

| Feature | Description | PRD Reference |
|---------|-------------|---------------|
| PokerAI class | Encapsulates decision logic with personality parameter | [AI Opponent](../game-design/ai-opponent.md) |
| Hand strength evaluation (0-1) | Current equity + improvement potential | [AI Opponent](../game-design/ai-opponent.md) |
| Pot odds calculation | callAmount / (pot + callAmount) | [AI Opponent](../game-design/ai-opponent.md) |
| Personality thresholds | Aggressive/balanced/conservative decision thresholds | [AI Opponent](../game-design/ai-opponent.md) |
| Flush draw detection | 9 outs for 4-flush, 11 for suited preflop | [AI Opponent](../game-design/ai-opponent.md) |
| Straight draw detection | Open-ended (8 outs) and gutshot (4 outs) | [AI Opponent](../game-design/ai-opponent.md) |
| Preflop strategy | Almost always sees the flop unless call is very expensive | [AI Opponent](../game-design/ai-opponent.md) |
| Postflop strategy | Strength-based fold/call/raise with pot odds | [AI Opponent](../game-design/ai-opponent.md) |
| Raise amount calculation | Scaled by hand strength and personality, rounded to $5 | [AI Opponent](../game-design/ai-opponent.md) |
| AI thinking animation | "AI is thinking..." with animated dots, 1.5s delay | [Animations](../ui-ux/animations.md) |
| AI action display | Shows action and amount in status container | [Layout & Components](../ui-ux/layout-and-components.md) |
| Auto-triggered AI turns | useEffect fires when currentPlayerIndex changes to AI | [Architecture](../technical/architecture.md) |
| Debug logging | Console output showing hand strength, pot odds, reasoning | [AI Opponent](../game-design/ai-opponent.md) |

## Phase 5: Polish & Animations

| Feature | Description | PRD Reference |
|---------|-------------|---------------|
| Card dealing animation | Fly-in with rotation and scale spring | [Animations](../ui-ux/animations.md) |
| Staggered flop dealing | 900ms between each of 3 flop cards | [Animations](../ui-ux/animations.md) |
| Hole card stagger | 300ms between each of 4 hole cards | [Animations](../ui-ux/animations.md) |
| Card flip animation | 3D rotateY for AI card reveal | [Animations](../ui-ux/animations.md) |
| Burn card animation | Slide, rotate, fade with sepia filter | [Animations](../ui-ux/animations.md) |
| Turn indicator bounce | Orange badge with arrow, bounces above current player | [Animations](../ui-ux/animations.md) |
| Current player glow | Orange box-shadow pulse on active player area | [Animations](../ui-ux/animations.md) |
| Showdown dim overlay | 35% black overlay behind game board | [Visual Design](../ui-ux/visual-design.md) |
| Phase transition animation | Scale + opacity on phase indicator | [Animations](../ui-ux/animations.md) |
| Button hover/active effects | Lift on hover, snap back on press | [Visual Design](../ui-ux/visual-design.md) |
| Game over gold glow | Status container with pulsing gold border | [Animations](../ui-ux/animations.md) |
| Winner crown bounce | Emoji bounces in showdown result | [Animations](../ui-ux/animations.md) |

## Not Yet Implemented

| Feature | Phase | PRD Reference |
|---------|-------|---------------|
| Betting action history/log (detailed) | Phase 3 | [Future Enhancements](future-enhancements.md) |
| Sound effects | Phase 5 | [Future Enhancements](future-enhancements.md) |
| AI personality selection UI | Phase 4 | [Future Enhancements](future-enhancements.md) |
| Statistics tracking | Phase 5 | [Future Enhancements](future-enhancements.md) |

See [Future Enhancements](future-enhancements.md) for the full backlog.
