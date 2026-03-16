# Architecture

## Overview

This document describes the technical architecture of the Texas Hold'em poker game, including the technology stack, project structure, state management approach, and build/deployment configuration.

## Requirements

### Technology Stack

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AR-001 | React 19 as UI framework | Done | `react@19.2.3`, `react-dom@19.2.3` |
| AR-002 | TypeScript for type safety | Done | `typescript@4.9.5`, strict mode enabled |
| AR-003 | Create React App as build tool | Done | `react-scripts@5.0.1` |
| AR-004 | No external state management library | Done | Pure `useState` hooks in `App.tsx` |
| AR-005 | No external UI component library | Done | All components hand-built with CSS |
| AR-006 | Testing with Jest and React Testing Library | Done | `@testing-library/react@16.3.1` |

### Project Structure

```
texas-holdem-poker/
├── public/
│   ├── index.html              # HTML template
│   ├── manifest.json           # Web app manifest
│   └── robots.txt
├── src/
│   ├── game/                   # Pure game logic (no React dependencies)
│   │   ├── types.ts            # TypeScript interfaces (Card, Player, GameState, etc.)
│   │   ├── deck.ts             # Deck class, card utilities (suit symbols, colors)
│   │   ├── pokerLogic.ts       # Hand evaluation, comparison, kicker descriptions
│   │   ├── ai.ts               # PokerAI class, decision-making system
│   │   └── pokerLogic.test.ts  # Unit tests for hand evaluation
│   ├── components/             # Reusable React components
│   │   ├── Card.tsx            # Playing card component (face, back, flip, burn states)
│   │   ├── Card.css            # Card styling and animations
│   │   ├── PlayerArea.tsx      # Player info display (name, chips, cards, indicators)
│   │   └── PlayerArea.css      # Player area styling
│   ├── App.tsx                 # Main game component -- all game state and logic (~2130 lines)
│   ├── App.css                 # Main layout, controls, overlays, status container
│   ├── App.test.tsx            # App component tests
│   ├── index.tsx               # React entry point
│   ├── index.css               # Global styles (body, fonts)
│   ├── react-app-env.d.ts      # CRA TypeScript declarations
│   ├── reportWebVitals.ts      # Performance reporting
│   └── setupTests.ts           # Test configuration
├── PRDs/                       # Product requirements documents
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── requirements.md             # Legacy requirements (superseded by PRDs/)
├── progress.md                 # Legacy progress tracking (superseded by PRDs/)
└── README.md                   # Project overview and setup instructions
```

### State Management

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AR-010 | Centralized state in App.tsx via `useState` hooks | Done | ~25 state variables |
| AR-011 | No Redux, Context, or Zustand | Done | Deliberate choice for simplicity |
| AR-012 | Game logic functions defined inline in App component | Done | `handleBettingAction`, `advanceGamePhase`, etc. |
| AR-013 | AI turn triggered by `useEffect` watching state changes | Done | Fires when `currentPlayerIndex` changes to AI |
| AR-014 | Stale closure mitigation via parameter passing | Done | Functions accept current values rather than relying on closure-captured state |

### Build and Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Start dev server on `localhost:3000` |
| `npm run build` | Production build to `build/` |
| `npm test` | Run Jest test suite |
| `npm run eject` | Eject from CRA (not recommended) |

### TypeScript Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| `target` | ES2017 | Modern JS features |
| `module` | ESNext | ES module syntax |
| `jsx` | react-jsx | Automatic JSX transform |
| `strict` | true | All strict checks enabled |
| `esModuleInterop` | true | CommonJS interop |
| `lib` | dom, dom.iterable, esnext | Browser + modern JS |

### Deployment

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AR-020 | Vercel deployment ready | Done | Standard CRA output |
| AR-021 | Netlify deployment ready | Done | Standard CRA output |
| AR-022 | GitHub Pages deployment option | Done | `gh-pages` package referenced in README |

## Current Implementation

The entire game is a single-page React application. The `App` component (~2130 lines) contains:

1. **State declarations** (~80 lines) -- all `useState` hooks
2. **Game logic functions** (~1400 lines) -- initialization, dealing, betting, phase transitions, AI triggering, winner determination
3. **useEffect hooks** (~50 lines) -- AI auto-trigger, log auto-scroll, reactive name/blind updates
4. **JSX render** (~600 lines) -- init overlay, game board, status container

The `src/game/` directory contains pure TypeScript logic with no React imports, making it testable and portable.

## Design Decisions

- **Monolithic App.tsx:** All game state and logic lives in a single component. This was a pragmatic "get it working" choice. For maintainability, the state and logic could be extracted into custom hooks (e.g., `useGameState`, `useBetting`, `useDealing`) or a state machine library.
- **No state management library:** With only two players and ~25 state variables, React's built-in `useState` is sufficient. Redux or Zustand would add boilerplate without clear benefit at this scale.
- **setTimeout for animation sequencing:** React doesn't natively support sequenced animations. The current approach uses nested `setTimeout` calls, which works but is fragile. Libraries like `framer-motion` or a state machine could replace this.
- **Separation of game logic:** `src/game/` contains pure functions and classes with no React coupling. This is intentional -- it allows unit testing hand evaluation, AI decisions, and deck operations independently.

## Open Questions / Known Issues

- `App.tsx` at ~2130 lines is difficult to navigate. Extracting into custom hooks would improve maintainability.
- The `setTimeout` chain pattern for animations creates implicit coupling between timing values. A more declarative animation system would be more robust.
- No error boundaries are implemented. A crash in game logic will unmount the entire app.
- `web-vitals` is included but not configured to report anywhere meaningful.
