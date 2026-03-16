# Heads-Up Texas Hold'em 🃏

A web-based heads-up Texas Hold'em poker game built with React & TypeScript. Play 1v1 against an AI opponent with real poker strategy.

## Features
- ♠️ Classic Texas Hold'em rules (heads-up play)
- 🤖 Smart AI opponent with real poker strategy (see below)
- 🎨 Clean, modern UI with card animations and pot delta effects
- ⚡ Built with React + TypeScript
- 📱 Mobile-first responsive design with landscape support
- 💰 Pot-relative bet sizing and $5 raise increments

## Tech Stack
- **Frontend**: React 18 with TypeScript
- **Graphics**: HTML5 Canvas + CSS
- **Build Tool**: Create React App
- **Deployment**: Ready for Vercel/Netlify

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Git (for version control)
- GitHub account (for hosting)

### Installation & Setup

1. **Install Dependencies**
   ```bash
   cd heads-up-texas-holdem
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the game.

3. **Build for Production**
   ```bash
   npm run build
   ```

## Game Rules

### Basic Texas Hold'em
- **Heads-up**: 1v1 play against computer
- **Blinds**: Player is dealer, AI is small blind ($5), you are big blind ($10)
- **Hole Cards**: Each player gets 2 private cards
- **Community Cards**: 5 shared cards (flop: 3, turn: 1, river: 1)
- **Betting Rounds**: Pre-flop, flop, turn, river
- **Actions**: Fold, call, raise

### Hand Rankings (Highest to Lowest)
1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. One Pair
10. High Card

## AI Opponent

The AI uses a multi-layered decision engine designed for competitive heads-up play:

- **Preflop hand charts** — Proper starting hand rankings from premium (AA, KK) down to trash, instead of generic equity. The AI opens, 3-bets, calls, or folds based on hand tier.
- **Pot-relative bet sizing** — Raises scale with the pot (50-75% pot for value, 33-50% for bluffs). Preflop opens are 2.5-3x the big blind. No more $1 min-raises.
- **Position awareness** — The AI plays wider ranges in position (on the button) and tighter out of position, with positional adjustments baked into hand strength.
- **Bluffing & continuation bets** — Pure bluffs with weak hands, semi-bluffs with draws, and c-bets on the flop at personality-driven frequencies.
- **All-in defense** — Dedicated logic to avoid folding decent hands (pairs+) to large bets or all-ins. Only truly weak hands fold under pressure.
- **Short-stack play** — When the stack-to-pot ratio drops below 2, the AI shifts to push/fold mode with appropriate hands.
- **Three personalities** — `aggressive` (wide ranges, frequent bluffs, large sizing), `balanced` (solid default), and `conservative` (tight ranges, rare bluffs, small sizing). Currently defaults to balanced.

All AI logic lives in `src/game/ai.ts`.

## Project Structure

```
texas-holdem-poker/
├── PRDs/                    # Product requirements documents (see PRDs/README.md)
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── Card.tsx        # Playing card component
│   │   ├── Card.css        # Card styling
│   │   └── ...
│   ├── game/               # Game logic
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── deck.ts         # Card/deck management
│   │   ├── pokerLogic.ts   # Hand evaluation
│   │   ├── betting.ts      # Betting validation & round logic
│   │   └── ai.ts           # AI decision engine (hand charts, sizing, bluffing)
│   ├── __tests__/           # Component & integration tests
│   ├── App.tsx             # Main app component
│   └── index.tsx           # App entry point
└── README.md
```

## Development Roadmap

See the [PRDs folder](PRDs/README.md) for detailed requirements, design decisions, and feature tracking. Key documents:

- **[Core Rules](PRDs/game-design/core-rules.md)** -- Hand rankings, blinds, betting, showdown
- **[Game Flow](PRDs/game-design/game-flow.md)** -- Phases, dealing, round lifecycle
- **[AI Opponent](PRDs/game-design/ai-opponent.md)** -- AI decision-making system
- **[Architecture](PRDs/technical/architecture.md)** -- Tech stack and project structure
- **[Completed Features](PRDs/roadmap/completed-features.md)** -- What's been built
- **[Future Enhancements](PRDs/roadmap/future-enhancements.md)** -- What's planned next

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repo to [vercel.com](https://vercel.com)
2. Deploy automatically on git push
3. Get a live URL instantly

### Netlify
1. Connect GitHub repo to [netlify.com](https://netlify.com)
2. Automatic deployments
3. Free hosting for personal projects

### GitHub Pages
```bash
npm install --save-dev gh-pages
npm run deploy
```

## Contributing

This project uses a structured development approach:

1. Check [PRDs/roadmap/future-enhancements.md](PRDs/roadmap/future-enhancements.md) for next tasks
2. Update the relevant PRD before implementing
3. Implement features incrementally
4. Mark requirements as Done in the PRD after completion
5. Commit with descriptive messages

## License

MIT License - feel free to use for learning and portfolio projects.

---

**Built with ❤️ using React & TypeScript**