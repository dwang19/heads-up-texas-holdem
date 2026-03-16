# Animations

## Overview

This document specifies all animations in the game, including card dealing, flipping, burning, highlighting, hover effects, and UI transitions. Animations are implemented via CSS `@keyframes` and JavaScript `setTimeout` sequencing.

## Requirements

### Card Dealing Animation

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-001 | Community cards fly in from above with rotation | Done | `dealCardReveal` keyframe in Card.css |
| AN-002 | Cards start translated up, rotated, scaled down, blurred | Done | From: `translateY(-150px) rotateY(180deg) rotateZ(45deg) scale(0.6)` |
| AN-003 | Cards settle into place with slight overshoot | Done | 30% keyframe: `scale(1.2)`, 70%: `scale(1.05)`, 100%: `scale(1)` |
| AN-004 | Animation duration: 0.8s with spring easing | Done | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` |
| AN-005 | Flop cards dealt with 900ms stagger between each | Done | `dealNextFlopCard()` recursive setTimeout |
| AN-006 | Turn/River single card with 1200ms transition time | Done | Includes burn animation before deal |

**`dealCardReveal` Keyframes:**

| Keyframe | Transform | Opacity | Filter |
|----------|-----------|---------|--------|
| 0% | translateY(-150px) translateX(50px) rotateY(180deg) rotateZ(45deg) scale(0.6) | 0 | blur(2px) |
| 30% | translateY(-30px) translateX(10px) rotateY(90deg) rotateZ(10deg) scale(1.2) | 0.8 | blur(1px) |
| 70% | translateY(-5px) translateX(2px) rotateY(10deg) rotateZ(2deg) scale(1.05) | 0.95 | blur(0) |
| 100% | translateY(0) translateX(0) rotateY(0) rotateZ(0) scale(1) | 1 | blur(0) |

### Hole Card Dealing

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-010 | 4 cards dealt sequentially (BB, SB, BB, SB) | Done | 300ms between each card |
| AN-011 | 200ms initial delay before first card | Done | setTimeout in startGame/dealNewHand |
| AN-012 | 600ms pause after last card before enabling actions | Done | Allows player to see cards before acting |
| AN-013 | `holeCardAnimating` flag disables controls during deal | Done | Checked in useEffect and button state |

### Card Flip Animation (AI Reveal)

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-020 | 3D card flip from back to front | Done | `cardFlip` keyframe: rotateY 0 -> 90 -> 180deg |
| AN-021 | Duration: 1s ease-in-out | Done | Smooth mid-point pause at 90deg |
| AN-022 | Uses CSS perspective (1000px) and `preserve-3d` | Done | `card--flipping` and `card__flip-container` |
| AN-023 | Backface-visibility hidden on both faces | Done | Prevents seeing through card during flip |
| AN-024 | Triggered at showdown for AI cards | Done | `aiCardsFlipping` state flag |
| AN-025 | Also triggered at start of all-in runout | Done | AI cards flip face-up before remaining cards dealt |

**`cardFlip` Keyframes:**

| Keyframe | Transform |
|----------|-----------|
| 0% | rotateY(0deg) |
| 50% | rotateY(90deg) |
| 100% | rotateY(180deg) |

### Burn Card Animation

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-030 | Card slides right, rotates, fades with sepia filter | Done | `burnCard` keyframe in Card.css |
| AN-031 | Duration: 1s ease-in-out | Done | Smooth cinematic effect |
| AN-032 | Card ends at 30% opacity with desaturated look | Done | `brightness(0.8) sepia(1) saturate(0.5)` |
| AN-033 | 1000ms wait after burn before dealing community cards | Done | setTimeout in advanceGamePhase |

**`burnCard` Keyframes:**

| Keyframe | Transform | Opacity | Filter |
|----------|-----------|---------|--------|
| 0% | translateX(0) rotateY(0) scale(1) | 1 | brightness(1) |
| 25% | translateX(15px) rotateY(45deg) scale(1.05) | 0.9 | brightness(1.2) sepia(0.3) |
| 50% | translateX(30px) rotateY(90deg) scale(1.1) | 0.7 | brightness(1.4) sepia(0.6) |
| 75% | translateX(20px) rotateY(135deg) scale(1.05) | 0.5 | brightness(1.6) sepia(0.8) |
| 100% | translateX(0) rotateY(180deg) scale(1) | 0.3 | brightness(0.8) sepia(1) saturate(0.5) |

### Card Highlighting (Showdown)

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-040 | Cards used in best hand get glow effect | Done | `cardGlow` keyframe: scale 1.05 -> 1.08, brightness 1.0 -> 1.2 |
| AN-041 | Green glow for human player's cards | Done | Multi-layer box-shadow with rgba(34, 197, 94, ...) |
| AN-042 | Blue glow for AI player's cards | Done | Multi-layer box-shadow with rgba(59, 130, 246, ...) |
| AN-043 | Glow animation: 2s infinite alternate | Done | Subtle pulsing effect |
| AN-044 | During showdown, solid white card backgrounds with enhanced shadow | Done | `!important` override in showdown-active context |

### Hover Effects

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-050 | All cards lift slightly on hover (-2px translateY) | Done | Default `.card:hover` |
| AN-051 | Highlighted cards scale to 1.05 on hover | Done | `.card--highlighted:hover` |
| AN-052 | Community cards raise (-20px) when hovered player's hand uses them | Done | `card--raised` class |
| AN-053 | Unused hole cards dim (0.4 opacity, grayscale, scale 0.95) on hover | Done | `card--dimmed` class |
| AN-054 | Showdown card area gets subtle background on hover | Done | `rgba(255, 255, 255, 0.05)` on `.showdown-cards:hover` |

### Turn Indicator

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-060 | Bouncing badge above current player | Done | `turnIndicatorBounce`: 0/100% Y=0, 50% Y=-3px, 1.5s infinite |
| AN-061 | Pulsing arrow inside badge | Done | `turnArrowPulse`: opacity 1 -> 0.6, 1s infinite |
| AN-062 | Current player area glows orange | Done | `currentPlayerGlow`: box-shadow alternates intensity, 2s infinite |
| AN-063 | Current player area lifted (-5px translateY) | Done | Applied via `.current-player` class |

### AI Thinking Animation

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-070 | Robot emoji bounces | Done | `aiAvatarBounce`: subtle -5px/-3px bounce, 2s infinite |
| AN-071 | Three dots animate sequentially | Done | `thinkingDot`: staggered opacity 0->1->0, 1.4s infinite |
| AN-072 | Dots have staggered delay (-0.32s, -0.16s, 0s) | Done | Creates wave effect |

### Status Container Transitions

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-080 | Slide-in from top when appearing | Done | `aiActionSlideIn`: translateY(-20px) -> 0 + opacity, 0.5s |
| AN-081 | Winner crown bounces | Done | `crownBounce`: Y 0 -> -5px, 1s infinite |
| AN-082 | Game over container glows gold | Done | `gameOverStatusGlow`: box-shadow intensity alternates, 2s infinite |
| AN-083 | Fade-in for overlays | Done | `fadeIn`: opacity 0 -> 1, 0.3s |

### Phase Transition Animations

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AN-090 | Phase indicator scales on transition | Done | `phaseTransition`: scale 0.9 -> 1.05 -> 1, opacity 0.7 -> 1, 0.8s |
| AN-091 | Phase-specific border colors | Done | Preflop: green, Flop: blue, Turn: orange, River: pink, Showdown: purple |
| AN-092 | Phase name text glows in phase color | Done | text-shadow with phase-matched color |

### Animation Timing Summary

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Card deal reveal | 800ms | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Community card dealt |
| Burn card | 1000ms | ease-in-out | Before each community deal |
| Card flip (AI) | 1000ms | ease-in-out | Showdown / all-in runout |
| Card glow pulse | 2000ms | ease-in-out (infinite) | Showdown hand highlight |
| Turn indicator bounce | 1500ms | ease (infinite) | Current player |
| AI thinking dots | 1400ms | ease-in-out (infinite) | AI decision pending |
| Hole card stagger | 300ms gap | linear | Between each hole card deal |
| Flop card stagger | 900ms gap | linear | Between each flop card |
| AI decision delay | 1500ms | N/A (setTimeout) | Before AI action shown |
| AI action display | 2500ms | N/A (setTimeout) | Duration action text shown |
| Post-deal pause | 600ms | N/A (setTimeout) | After last hole card dealt |

## Current Implementation

- **CSS animations:** All visual animations defined in `Card.css`, `PlayerArea.css`, and `App.css` using `@keyframes`
- **JavaScript timing:** `setTimeout` chains in `App.tsx` coordinate multi-step sequences (deal order, burn-then-deal, all-in runout)
- **Animation state flags:** `isDealing`, `holeCardAnimating`, `aiCardsFlipping`, `animatingCardIndices`, `burnAnimatingIndex`

## Design Decisions

- **CSS keyframes over JS animation libraries:** Keeps the bundle small and avoids additional dependencies. The trade-off is less control over sequencing complex multi-element animations.
- **setTimeout for sequencing:** React doesn't provide built-in animation sequencing. setTimeout works but creates fragile timing dependencies. A library like `framer-motion` or GSAP could provide more robust sequencing.
- **Animation flags in state:** Each animation type has a dedicated boolean flag. This is explicit but adds to the state variable count.

## Open Questions / Known Issues

- The 900ms stagger between flop cards feels slightly slow. Could be reduced to 600-700ms.
- Burn card animation runs before every community deal but is somewhat subtle. Making it more visible could improve game feel.
- No animation for chip transfers (pot award). Adding a chip-flying or counter animation would enhance the win/loss moment.
- No sound effects accompany any animation. Audio would significantly improve feedback.
