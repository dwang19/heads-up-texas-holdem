# Future Enhancements

## Overview

Planned and potential features for the Texas Hold'em poker game, organized by priority. Items near the top are lower effort and higher impact; items near the bottom are larger undertakings.

## Priority 1: Quick Wins

These are small, self-contained improvements that can each be completed in a single session.

| ID | Feature | Description | Effort | PRD Impact |
|----|---------|-------------|--------|------------|
| FE-001 | AI personality selection | Add dropdown or radio buttons on init screen to choose aggressive/balanced/conservative. The AI code already supports all three; only the UI binding is missing. | Low | [AI Opponent](../game-design/ai-opponent.md) AI-003 |
| FE-002 | Betting action history log | Add a structured log of all betting actions (player, action, amount, pot after) for transparency. The game log exists but mixes betting with other events. | Low | [Game Flow](../game-design/game-flow.md) |
| FE-003 | Sound effects | Add audio feedback for card dealing, card flip, chip clink, fold, win, and lose. Use HTML5 `<audio>` or the Web Audio API. | Low-Med | [Animations](../ui-ux/animations.md) |
| FE-004 | Toast notifications instead of alerts | Replace `alert()` for validation errors with a non-blocking toast/snackbar component. | Low | [Layout & Components](../ui-ux/layout-and-components.md) LC-075 |
| FE-005 | Customizable blind amounts | Allow player to set SB/BB amounts on the init screen. Currently hardcoded to $5/$10. | Low | [Core Rules](../game-design/core-rules.md) CR-010, CR-011 |
| FE-006 | Customizable starting chips | Allow player to set starting chip amounts. Currently hardcoded to $100. | Low | [Core Rules](../game-design/core-rules.md) CR-012 |

## Priority 2: Gameplay Improvements

Medium-effort features that meaningfully improve the playing experience.

| ID | Feature | Description | Effort | PRD Impact |
|----|---------|-------------|--------|------------|
| FE-010 | AI bluffing integration | Wire `shouldBluff()` and `isBluffOpportunity()` into the main `decideAction()` flow. The logic exists but is not called. | Med | [AI Opponent](../game-design/ai-opponent.md) AI-050 |
| FE-011 | AI opponent modeling | Track human player's fold/call/raise frequency and adjust AI thresholds. Adds memory across hands. | Med-High | [AI Opponent](../game-design/ai-opponent.md) |
| FE-012 | Statistics dashboard | Track and display win rate, hands played, biggest pot, best hand, etc. across a session. | Med | New PRD |
| FE-013 | Hand history viewer | After each hand, show a detailed replay of all actions and cards. | Med | New PRD |
| FE-014 | Chip transfer animation | Animate chips moving from player to pot and from pot to winner. | Med | [Animations](../ui-ux/animations.md) |
| FE-015 | Direct raise amount input | Allow typing a specific raise amount in addition to $5 increment arrows. | Low | [Layout & Components](../ui-ux/layout-and-components.md) LC-072 |
| FE-016 | Keyboard shortcuts | Hotkeys for fold (F), call (C), raise (R) during player's turn. | Low | [Layout & Components](../ui-ux/layout-and-components.md) |

## Priority 3: Architecture Improvements

Refactoring work that improves maintainability without changing visible behavior.

| ID | Feature | Description | Effort | PRD Impact |
|----|---------|-------------|--------|------------|
| FE-020 | Extract custom hooks from App.tsx | Split the monolithic App.tsx (~2130 lines) into hooks: `useGameState`, `useBetting`, `useDealing`, `useAI`. | Med-High | [Architecture](../technical/architecture.md) |
| FE-021 | Animation library (framer-motion) | Replace setTimeout chains with declarative animation sequencing. | Med | [Animations](../ui-ux/animations.md), [Architecture](../technical/architecture.md) |
| FE-022 | State machine for game flow | Use XState or similar to formalize phase transitions and eliminate ad-hoc state flag management. | High | [Game Flow](../game-design/game-flow.md), [Architecture](../technical/architecture.md) |
| FE-023 | Design token system | Centralize all colors, spacing, and typography into CSS custom properties or a theme object. | Med | [Visual Design](../ui-ux/visual-design.md) |
| FE-024 | Error boundaries | Add React error boundaries to prevent full-app crashes from game logic errors. | Low | [Architecture](../technical/architecture.md) |
| FE-025 | Remove debug console.log statements | Clean up extensive debug logging from App.tsx and ai.ts for production. | Low | [Architecture](../technical/architecture.md) |
| FE-026 | Migrate from CRA to Vite | Faster dev server and build times. CRA is no longer actively maintained. | Med | [Architecture](../technical/architecture.md) |

## Priority 4: Major Features

Large features that would significantly expand the game's scope.

| ID | Feature | Description | Effort | PRD Impact |
|----|---------|-------------|--------|------------|
| FE-030 | Multiplayer support (3-6 players) | Add additional AI opponents, proper turn rotation, and side pot logic. | Very High | All PRDs |
| FE-031 | Side pot system | Required for multiplayer all-in scenarios with different stack sizes. | High | [Core Rules](../game-design/core-rules.md) CR-033 |
| FE-032 | Tournament mode | Multi-table or sit-and-go format with increasing blinds. | Very High | New PRD |
| FE-033 | Online multiplayer | WebSocket-based real-time play against other humans. | Very High | New PRD |
| FE-034 | Replay system | Record and replay full games with scrubbing and analysis. | High | New PRD |
| FE-035 | Mobile-first redesign | Dedicated compact layout for phones rather than collapsing desktop layout. | High | [Visual Design](../ui-ux/visual-design.md), [Layout & Components](../ui-ux/layout-and-components.md) |
| FE-036 | Dark/Light theme toggle | Allow switching between the current blue gradient and a light or true-dark theme. | Med | [Visual Design](../ui-ux/visual-design.md) |

## Deferred / Won't Do (for now)

| Feature | Reason |
|---------|--------|
| Real-money gambling | Legal and ethical complexity far beyond scope |
| 3D card rendering (WebGL/Three.js) | Over-engineered for current needs |
| Voice chat for multiplayer | Only relevant with online multiplayer |
