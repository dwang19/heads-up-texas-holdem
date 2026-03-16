# Outstanding Features & Improvements – Texas Hold’em Poker App

## 1. Responsive Design – Make it Mobile-Friendly
- Current desktop-only layout breaks on phones/tablets.
- Goal: Full mobile support so users can play comfortably on their phone (especially important once it lives inside the main site).
- Success criteria:
  - Touch-friendly buttons and chip stacks
  - Cards readable at small widths
  - Pot & action area scales cleanly
  - No horizontal scroll
- Nice-to-have: Landscape mode optimization for larger phones.

## 2. Smarter AI Player + Betting Logic Alignment
- AI is too basic: almost always raises only $1 (or tiny amounts) and never uses real poker strategy.
- Conflict with existing rules: raises must be in $5 increments.
- Goal: Give the AI real personality and proper heads-up strategy (tight-aggressive baseline, occasional bluffs, position awareness, stack-size consideration).
- Tasks:
  - Rewrite AI decision engine (simple weighted logic or basic minimax for now)
  - Enforce $5 raise increments everywhere (player + AI)

## 3. Clearer Chip & Pot Visualization
- Current chip stacking and pot tracking feels clunky.
- Hard to follow: “Who just bet what?”, “What’s in the main pot vs side pots?”, “How much is left to call?”
- Goal: Make the money flow obvious at every moment.
- Desired improvements:
  - Visual chip stacks that grow/shrink with each action (animated if possible)
  - Clear “To Call: $XX” indicator
  - Separate “Main Pot” display that updates live
  - End-of-round pot resolution animation + summary (“You win $XX – here’s how the pot was split”)

## 4. Rename to “Heads-Up Texas Hold’em” (or similar)
- Current title doesn’t communicate that it’s strictly 1v1 vs AI.
- Goal: Update everywhere so new visitors instantly understand the format.
- Places to change:
  - Browser tab / page title
  - Main heading
  - Any meta description / social preview
  - Footer / about text
- Suggested final name: **Heads-Up Texas Hold’em** (simple, accurate, searchable)

---

Last updated: March 15, 2026