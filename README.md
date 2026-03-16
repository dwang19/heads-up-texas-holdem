# Texas Hold'em Poker Game 🃏

A web-based Texas Hold'em poker game built with React & TypeScript. Play against a computer opponent in this heads-up poker game.

## Features
- ♠️ Classic Texas Hold'em rules (heads-up play)
- 🤖 Computer AI opponent
- 🎨 Clean, modern UI with card animations
- ⚡ Built with React + TypeScript
- 📱 Responsive design

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
   cd "C:\Projects\Texas Holdem Poker"
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
│   │   └── ai.ts           # Computer AI
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