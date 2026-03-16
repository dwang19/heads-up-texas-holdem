# Texas Hold'em Poker -- Product Requirements

## Project Summary

A web-based heads-up (1v1) Texas Hold'em poker game built with React 19 and TypeScript. The human player competes against an AI opponent across multiple rounds until one player cannot afford the big blind.

**Tech Stack:** React 19, TypeScript 4.9, Create React App, CSS (no external UI libraries)

## PRD Index

### Game Design

| Document | Description |
|----------|-------------|
| [Core Rules](game-design/core-rules.md) | Texas Hold'em rules as implemented -- hand rankings, blind structure, betting, all-in, showdown, win conditions |
| [Game Flow](game-design/game-flow.md) | Game lifecycle, phase transitions, dealing sequence, betting order, round management |
| [AI Opponent](game-design/ai-opponent.md) | AI decision-making system -- personality types, hand evaluation, pot odds, bluffing |

### Technical

| Document | Description |
|----------|-------------|
| [Architecture](technical/architecture.md) | Tech stack, project structure, state management approach, build and deploy |
| [Data Models](technical/data-models.md) | TypeScript interfaces, full App state shape, Deck class API |

### UI/UX

| Document | Description |
|----------|-------------|
| [Layout & Components](ui-ux/layout-and-components.md) | Component hierarchy, screen layouts, betting controls, overlays |
| [Visual Design](ui-ux/visual-design.md) | Color system, glassmorphism, card styling, responsive breakpoints |
| [Animations](ui-ux/animations.md) | Card dealing, flipping, burning, highlighting, hover effects, timing |

### Roadmap

| Document | Description |
|----------|-------------|
| [Completed Features](roadmap/completed-features.md) | Retroactive log of everything built to date |
| [Future Enhancements](roadmap/future-enhancements.md) | Planned and potential features, prioritized |

## Conventions

- **Status values:** `Done`, `Partial`, `Planned`
- **Requirement IDs:** Use the prefix from the document (e.g., `CR-001` for Core Rules, `GF-001` for Game Flow)
- **Updating PRDs:** When implementing a new feature, update the relevant PRD(s) *before* writing code. Mark requirements as `Done` once merged.
- **Adding new PRDs:** If a feature area doesn't fit an existing document, create a new `.md` file in the appropriate subfolder and add it to this index.
