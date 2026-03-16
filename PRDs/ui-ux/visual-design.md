# Visual Design

## Overview

This document defines the visual design system including colors, materials, card styling, typography, and responsive behavior.

## Requirements

### Color System

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| VD-001 | Background gradient: deep blue to sky blue | Done | `linear-gradient(135deg, #0f4c75 0%, #3282b8 50%, #bbe1fa 100%)` |
| VD-002 | Header: semi-transparent dark overlay | Done | `rgba(0, 0, 0, 0.3)` |
| VD-003 | Human player color: green (#22c55e) | Done | Used for highlights, text, and glow |
| VD-004 | AI player color: blue (#3b82f6) | Done | Used for highlights, text, and glow |
| VD-005 | Gold accent for pot, winners, crowns (#ffd700) | Done | Pot amount, winner crown, game over border |
| VD-006 | Orange accent for current turn, AI actions (#ffa726) | Done | Turn indicator, action text, raise button |
| VD-007 | Red for fold button, defeat, danger (#ff4757) | Done | Fold button gradient, folded state |
| VD-008 | Card suits: red for hearts/diamonds, black for clubs/spades | Done | `getSuitColor()` in `deck.ts` |

**Full Color Palette:**

| Purpose | Color | Hex |
|---------|-------|-----|
| Background (dark) | Deep navy | #0f4c75 |
| Background (mid) | Medium blue | #3282b8 |
| Background (light) | Sky blue | #bbe1fa |
| Human player | Green | #22c55e |
| AI player | Blue | #3b82f6 |
| Gold / Pot / Winner | Gold | #ffd700 |
| Turn indicator / Orange accent | Orange | #ffa726 |
| Fold / Danger | Red | #ff4757 |
| Call button | Dark blue | #3742fa |
| Start / Restart button | Green | #28a745 |
| Text (on dark bg) | White | #ffffff |
| Text (on light bg) | Dark slate | #2c3e50 |
| Init screen accent | Medium blue | #3282b8 |

### Glassmorphism / Materials

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| VD-010 | Semi-transparent panels with blur | Done | `background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px)` |
| VD-011 | Consistent border-radius: 15px for panels, 8px for cards | Done | CSS custom properties not used for radius |
| VD-012 | Elevated shadows on all panels | Done | `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)` |
| VD-013 | Showdown dim overlay (35% black) | Done | `rgba(0, 0, 0, 0.35)` with `z-index: 50` |
| VD-014 | Init overlay backdrop (60% black + blur) | Done | `rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(3px)` |

### Card Design

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| VD-020 | Card face: white background, 1px gray border | Done | `background: white; border: 1px solid #ddd` |
| VD-021 | Rank in top-left and bottom-right (rotated) corners | Done | Standard playing card layout |
| VD-022 | Large suit symbol centered | Done | 2em font size, 0.8 opacity |
| VD-023 | Card back: dark gradient with crosshatch pattern | Done | `linear-gradient(135deg, #1a1a1a, #4a4a4a, #1a1a1a)` with 45/-45deg stripe overlay |
| VD-024 | Deck stack: 3 layers with offset (::before, ::after) | Done | 2px/4px vertical offset, decreasing opacity |
| VD-025 | Empty card slot: same back but 0.3 opacity | Done | `card--empty` class |
| VD-026 | Suit symbols: ♥ ♦ ♣ ♠ (Unicode) | Done | Rendered in HTML, colored by suit |

### Button Design

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| VD-030 | Gradient backgrounds for all action buttons | Done | Each button type has distinct gradient |
| VD-031 | Rounded pill shape (border-radius: 20-25px) | Done | Consistent across fold/call/raise |
| VD-032 | Hover: lift (-2px translateY) + enhanced shadow | Done | `transition: all 0.3s ease` |
| VD-033 | Active: snap back to 0 translateY | Done | Tactile press effect |
| VD-034 | Disabled: gray gradient, not-allowed cursor, 0.6 opacity | Done | Applied when not player's turn |
| VD-035 | Raise input: semi-transparent with orange focus ring | Done | `rgba(255, 255, 255, 0.1)` bg, `#ffa726` focus border |

### Typography

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| VD-040 | Font family: Arial, sans-serif | Done | Applied to cards; rest uses browser default |
| VD-041 | Section headings: 18px, bold, uppercase, letter-spacing 1.5px | Done | Consistent across game-info, log, pot, etc. |
| VD-042 | Heading text-shadow for depth | Done | Triple shadow: `0 1px 2px, 0 2px 8px, 0 0 20px` |
| VD-043 | Pot amount: 48px bold gold with glow | Done | `text-shadow: 0 2px 8px rgba(255, 215, 0, 0.5)` |
| VD-044 | Game log entries: 12px with 10px timestamp | Done | Compact to fit in scroll area |

### Chip Display

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| VD-050 | Gold gradient pill for chip stack | Done | `linear-gradient(135deg, #ffd700, #ffb347)` |
| VD-051 | Money bag emoji (💰) as chip icon | Done | 18px with drop-shadow |
| VD-052 | Chip amount in dark text on gold | Done | `color: #2d3436` for contrast |
| VD-053 | Current bet in subtle transparent pill | Done | `rgba(255, 255, 255, 0.15)` background |

### CSS Custom Properties

```css
:root {
  --container-max-width: 1400px;
  --container-padding: 15px;
  --gap-small: 10px;
  --gap-medium: 15px;
  --gap-large: 20px;
  --game-info-width: 250px;
  --game-log-width: 425px;
  --game-log-height: 255px;
  --pot-width: 250px;
  --pot-height: 210px;
  --deck-width: 130px;
  --deck-height: 210px;
  --community-cards-min-width: 520px;
  --community-cards-height: 210px;
  --burned-cards-width: 280px;
  --burned-cards-height: 210px;
  --action-buttons-min-width: 300px;
  --action-buttons-max-width: 500px;
}
```

### Responsive Design

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| VD-060 | Mobile breakpoint at 768px | Done | `@media (max-width: 768px)` |
| VD-061 | Grid collapses to single column on mobile | Done | All grid areas stack vertically |
| VD-062 | Cards shrink on mobile | Done | Large->80x112, Medium->60x84, Small->50x70 |
| VD-063 | Player area min-width adjusts (250px mobile, 220px small mobile) | Done | `@media (max-width: 480px)` breakpoint |
| VD-064 | Game log max-height capped at 200px on mobile | Done | Prevents log from dominating viewport |
| VD-065 | Cards row stacks vertically on mobile | Done | Each component gets full width |

## Current Implementation

- **App.css:** ~2040 lines covering all layout, controls, status, overlays, and animations
- **Card.css:** ~460 lines for card states, sizes, and animations
- **PlayerArea.css:** ~310 lines for player info, chips, badges, and indicators
- **index.css:** Minimal global styles (body margin, font)

## Design Decisions

- **No CSS-in-JS or preprocessor:** Plain CSS files with BEM-style class naming (`card__front`, `card--highlighted`). Simple and zero-overhead.
- **CSS custom properties for layout:** Dimensions are tokenized in `:root` for easy adjustment, but colors are hardcoded inline. A future pass could tokenize colors too.
- **Glassmorphism everywhere:** The semi-transparent blur effect unifies all panels. It looks modern but may have performance implications on low-end devices due to `backdrop-filter`.
- **No dark/light theme toggle:** The game is always on the blue gradient background. A theme system is not implemented.

## Open Questions / Known Issues

- Color values are scattered across CSS files rather than centralized. A design token system would improve consistency.
- `backdrop-filter: blur()` has inconsistent support in older browsers and can cause performance issues on mobile.
- The 768px breakpoint is the only responsive threshold. Intermediate sizes (tablet landscape) could benefit from additional breakpoints.
- `!important` is used in a few places for showdown card styling. This could be refactored.
