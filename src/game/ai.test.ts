/**
 * PRD: game-design/ai-opponent.md (AI-001–AI-046)
 * AI decision-making: personalities, hand strength, pot odds, decision logic
 */

import { getAIDecision, createAI, AIPersonality } from './ai';
import { Card, Player } from './types';

const createCard = (rank: number, suit: Card['suit']): Card => ({
  rank,
  suit,
  displayRank: rank === 14 ? 'A' : rank === 13 ? 'K' : rank === 12 ? 'Q' : rank === 11 ? 'J' : rank.toString()
});

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'ai',
  name: 'AI Player',
  cards: [],
  chips: 100,
  isHuman: false,
  isSmallBlind: false,
  isBigBlind: true,
  currentBet: 0,
  hasFolded: false,
  hasActedThisRound: false,
  ...overrides
});

describe('AI Opponent (AI-001–AI-046)', () => {
  describe('AI-001–AI-004: Personality and default', () => {
    test('createAI returns instance with default balanced personality', () => {
      const ai = createAI();
      expect(ai).toBeDefined();
    });

    test('getAIDecision with no cards returns call (safety, never fold)', () => {
      const player = createPlayer({ cards: [] });
      const result = getAIDecision(player, [], 0, 0, 'preflop', 2);
      expect(result.action).toBe('call');
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('AI-030–AI-031: Pot odds and check when no bet', () => {
    test('when callAmount is 0 (check), AI never folds', () => {
      const player = createPlayer({
        cards: [createCard(7, 'hearts'), createCard(2, 'clubs')],
        currentBet: 10,
        chips: 90
      });
      const communityCards: Card[] = [];
      const currentBet = 10;
      const pot = 20;
      const result = getAIDecision(player, communityCards, currentBet, pot, 'preflop', 2);
      expect(['call', 'raise']).toContain(result.action);
      expect(result.action).not.toBe('fold');
    });

    test('when callAmount > player chips, AI folds', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(13, 'hearts')],
        currentBet: 0,
        chips: 5
      });
      const result = getAIDecision(player, [], 10, 20, 'preflop', 2);
      expect(result.action).toBe('fold');
      expect(result.reasoning).toMatch(/Insufficient chips/i);
    });
  });

  describe('AI-040–AI-046: Decision output shape and raise amount', () => {
    test('makeDecision returns valid action and reasoning', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(13, 'spades')],
        currentBet: 0,
        chips: 100
      });
      const result = getAIDecision(player, [], 10, 20, 'preflop', 2);
      expect(['fold', 'call', 'raise']).toContain(result.action);
      expect(typeof result.reasoning).toBe('string');
      expect(result.reasoning.length).toBeGreaterThan(0);
      if (result.action === 'raise' && result.amount != null) {
        expect(result.amount).toBeGreaterThanOrEqual(5);
        expect(result.amount % 5).toBe(0);
      }
    });

    test('getAIDecision accepts all three personalities', () => {
      const player = createPlayer({
        cards: [createCard(10, 'hearts'), createCard(10, 'diamonds')],
        currentBet: 0,
        chips: 100
      });
      const personalities: AIPersonality[] = ['aggressive', 'conservative', 'balanced'];
      personalities.forEach((personality) => {
        const result = getAIDecision(player, [], 10, 20, 'preflop', 2, personality);
        expect(['fold', 'call', 'raise']).toContain(result.action);
      });
    });
  });

  describe('Hand strength affects decision', () => {
    test('strong hand (pair) with no bet to call can raise', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 10,
        chips: 90
      });
      const result = getAIDecision(player, [], 10, 20, 'preflop', 2);
      expect(['call', 'raise']).toContain(result.action);
    });
  });

  describe('AI-010–AI-014: Hand strength evaluation (indirect)', () => {
    test('pocket aces preflop: AI almost never folds against a raise', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 0,
        chips: 100
      });
      let foldCount = 0;
      for (let i = 0; i < 20; i++) {
        const result = getAIDecision(player, [], 20, 30, 'preflop', 2);
        if (result.action === 'fold') foldCount++;
      }
      expect(foldCount).toBe(0); // AA should NEVER fold preflop
    });

    test('weak hand (7-2 offsuit) postflop with big bet: AI folds or calls cautiously', () => {
      const player = createPlayer({
        cards: [createCard(7, 'hearts'), createCard(2, 'clubs')],
        currentBet: 0,
        chips: 100
      });
      const community = [
        createCard(14, 'diamonds'), createCard(13, 'spades'), createCard(11, 'clubs')
      ];
      const result = getAIDecision(player, community, 30, 40, 'flop', 2);
      expect(['fold', 'call']).toContain(result.action);
    });

    test('hand strength evaluated differently per phase (AI-012)', () => {
      const player = createPlayer({
        cards: [createCard(10, 'hearts'), createCard(10, 'diamonds')],
        currentBet: 10,
        chips: 90
      });
      const communityFlop = [
        createCard(3, 'clubs'), createCard(5, 'diamonds'), createCard(8, 'spades')
      ];
      const communityRiver = [
        createCard(3, 'clubs'), createCard(5, 'diamonds'), createCard(8, 'spades'),
        createCard(2, 'hearts'), createCard(7, 'clubs')
      ];
      const flopResult = getAIDecision(player, communityFlop, 10, 20, 'flop', 2);
      const riverResult = getAIDecision(player, communityRiver, 10, 20, 'river', 2);
      expect(['call', 'raise']).toContain(flopResult.action);
      expect(['call', 'raise']).toContain(riverResult.action);
    });
  });

  describe('AI-020–AI-024: Draw detection (indirect)', () => {
    test('flush draw (4 suited cards) on flop: AI stays in hand', () => {
      const player = createPlayer({
        cards: [createCard(10, 'hearts'), createCard(7, 'hearts')],
        currentBet: 10,
        chips: 90
      });
      const community = [
        createCard(3, 'hearts'), createCard(8, 'hearts'), createCard(12, 'clubs')
      ];
      let foldCount = 0;
      for (let i = 0; i < 20; i++) {
        const result = getAIDecision(player, community, 10, 20, 'flop', 2);
        if (result.action === 'fold') foldCount++;
      }
      expect(foldCount).toBe(0); // Should never fold a flush draw
    });

    test('open-ended straight draw on flop: AI stays in hand', () => {
      const player = createPlayer({
        cards: [createCard(9, 'hearts'), createCard(10, 'clubs')],
        currentBet: 10,
        chips: 90
      });
      const community = [
        createCard(8, 'diamonds'), createCard(11, 'spades'), createCard(3, 'clubs')
      ];
      let foldCount = 0;
      for (let i = 0; i < 20; i++) {
        const result = getAIDecision(player, community, 10, 20, 'flop', 2);
        if (result.action === 'fold') foldCount++;
      }
      expect(foldCount).toBe(0); // Should never fold an OESD
    });
  });

  describe('AI-030: Pot odds formula', () => {
    test('pot odds calculated correctly: large pot incentivizes calling', () => {
      const player = createPlayer({
        cards: [createCard(7, 'hearts'), createCard(8, 'clubs')],
        currentBet: 0,
        chips: 100
      });
      const community = [
        createCard(9, 'diamonds'), createCard(10, 'spades'), createCard(2, 'clubs')
      ];
      const smallPotResult = getAIDecision(player, community, 5, 10, 'flop', 2);
      const largePotResult = getAIDecision(player, community, 5, 100, 'flop', 2);
      expect(['fold', 'call', 'raise']).toContain(smallPotResult.action);
      expect(['call', 'raise']).toContain(largePotResult.action);
    });
  });

  describe('AI-042: Preflop behavior', () => {
    test('AI calls cheap preflop bets with speculative hands', () => {
      const player = createPlayer({
        cards: [createCard(6, 'hearts'), createCard(4, 'clubs')],
        currentBet: 5,
        chips: 95
      });
      let foldCount = 0;
      for (let i = 0; i < 30; i++) {
        const result = getAIDecision(player, [], 10, 15, 'preflop', 2);
        if (result.action === 'fold') foldCount++;
      }
      // 64o is a weak hand — may fold sometimes, but should see cheap flops often
      expect(foldCount).toBeLessThan(25);
    });

    test('AI folds trash hands (72o) to large preflop raises', () => {
      const player = createPlayer({
        cards: [createCard(7, 'hearts'), createCard(2, 'clubs')],
        currentBet: 0,
        chips: 100
      });
      let foldCount = 0;
      for (let i = 0; i < 30; i++) {
        const result = getAIDecision(player, [], 30, 45, 'preflop', 2);
        if (result.action === 'fold') foldCount++;
      }
      // 72o facing a big raise should fold most of the time
      expect(foldCount).toBeGreaterThan(15);
    });
  });

  describe('AI-044–AI-045: Raise amount', () => {
    test('raise amount is always >= $5 and a multiple of $5 (AI-045)', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 10,
        chips: 90
      });
      for (let i = 0; i < 50; i++) {
        const result = getAIDecision(player, [], 10, 20, 'preflop', 2);
        if (result.action === 'raise' && result.amount != null) {
          expect(result.amount).toBeGreaterThanOrEqual(5);
          expect(result.amount % 5).toBe(0);
        }
      }
    });

    test('raise amount is $5+ even when checking (callAmount = 0)', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(13, 'hearts')],
        currentBet: 0,
        chips: 100
      });
      const community = [
        createCard(12, 'hearts'), createCard(11, 'hearts'), createCard(3, 'clubs')
      ];
      for (let i = 0; i < 50; i++) {
        const result = getAIDecision(player, community, 0, 30, 'flop', 2);
        if (result.action === 'raise' && result.amount != null) {
          expect(result.amount).toBeGreaterThanOrEqual(5);
          expect(result.amount % 5).toBe(0);
        }
      }
    });
  });

  describe('AI-046: Fallback to call', () => {
    test('AI with very low chips does not raise beyond its stack', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 0,
        chips: 10
      });
      const result = getAIDecision(player, [], 5, 15, 'preflop', 2);
      if (result.action === 'raise' && result.amount != null) {
        expect(result.amount).toBeLessThanOrEqual(10);
      }
      expect(['call', 'raise', 'fold']).toContain(result.action);
    });
  });

  // ─── NEW TESTS: Preflop starting hand chart ───────────────────

  describe('Preflop starting hand chart', () => {
    test('AA/KK raises or calls 100% of the time preflop (never folds)', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 0,
        chips: 100
      });
      let raiseCount = 0;
      for (let i = 0; i < 50; i++) {
        const result = getAIDecision(player, [], 20, 30, 'preflop', 2);
        expect(result.action).not.toBe('fold');
        if (result.action === 'raise') raiseCount++;
      }
      // AA should raise most of the time
      expect(raiseCount).toBeGreaterThan(25);
    });

    test('72o folds to raises most of the time', () => {
      const player = createPlayer({
        cards: [createCard(7, 'hearts'), createCard(2, 'clubs')],
        currentBet: 0,
        chips: 100
      });
      let foldCount = 0;
      for (let i = 0; i < 50; i++) {
        const result = getAIDecision(player, [], 25, 40, 'preflop', 2);
        if (result.action === 'fold') foldCount++;
      }
      expect(foldCount).toBeGreaterThan(25);
    });
  });

  // ─── NEW TESTS: Pot-relative sizing ────────────────────────────

  describe('Pot-relative bet sizing', () => {
    test('postflop raise is proportional to pot (not tiny $1 raises)', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 0,
        chips: 100
      });
      const community = [
        createCard(3, 'clubs'), createCard(7, 'diamonds'), createCard(9, 'spades')
      ];
      let totalRaiseAmount = 0;
      let raiseCount = 0;
      for (let i = 0; i < 50; i++) {
        const result = getAIDecision(player, community, 0, 50, 'flop', 2);
        if (result.action === 'raise' && result.amount != null) {
          totalRaiseAmount += result.amount;
          raiseCount++;
          // Individual raises should be meaningful, not $1
          expect(result.amount).toBeGreaterThanOrEqual(5);
        }
      }
      if (raiseCount > 0) {
        const avgRaise = totalRaiseAmount / raiseCount;
        // With a $50 pot, raises should average at least $15 (30% pot)
        expect(avgRaise).toBeGreaterThanOrEqual(15);
      }
    });
  });

  // ─── NEW TESTS: Bluffing ───────────────────────────────────────

  describe('Bluffing', () => {
    test('aggressive personality bluffs sometimes when checking', () => {
      const player = createPlayer({
        cards: [createCard(4, 'hearts'), createCard(2, 'clubs')],
        currentBet: 0,
        chips: 100
      });
      const community = [
        createCard(14, 'diamonds'), createCard(13, 'spades'), createCard(11, 'clubs')
      ];
      let raiseCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = getAIDecision(player, community, 0, 30, 'flop', 2, 'aggressive');
        if (result.action === 'raise') raiseCount++;
      }
      // Aggressive AI should bluff at least sometimes (c-bets + bluffs)
      expect(raiseCount).toBeGreaterThan(5);
    });
  });

  // ─── NEW TESTS: All-in defense ─────────────────────────────────

  describe('All-in and large bet defense', () => {
    test('AI with a pair calls an all-in (does not fold decent hands)', () => {
      const player = createPlayer({
        cards: [createCard(10, 'hearts'), createCard(10, 'diamonds')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(3, 'clubs'), createCard(7, 'diamonds'), createCard(9, 'spades')
      ];
      let foldCount = 0;
      for (let i = 0; i < 30; i++) {
        // Facing a large bet (~63% of stack)
        const result = getAIDecision(player, community, 50, 60, 'flop', 2);
        if (result.action === 'fold') foldCount++;
      }
      // Pocket tens on a safe board should rarely fold to aggression
      expect(foldCount).toBeLessThan(5);
    });

    test('AI with trips never folds to an all-in', () => {
      const player = createPlayer({
        cards: [createCard(9, 'hearts'), createCard(9, 'diamonds')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(9, 'clubs'), createCard(3, 'diamonds'), createCard(7, 'spades')
      ];
      for (let i = 0; i < 20; i++) {
        const result = getAIDecision(player, community, 70, 80, 'flop', 2);
        expect(result.action).not.toBe('fold');
      }
    });

    test('AI folds very weak hands to all-in', () => {
      const player = createPlayer({
        cards: [createCard(4, 'hearts'), createCard(2, 'clubs')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(14, 'diamonds'), createCard(13, 'spades'), createCard(11, 'clubs')
      ];
      let foldCount = 0;
      for (let i = 0; i < 30; i++) {
        const result = getAIDecision(player, community, 60, 70, 'flop', 2);
        if (result.action === 'fold') foldCount++;
      }
      // 42o on AKJ board should fold to all-in most of the time
      expect(foldCount).toBeGreaterThan(15);
    });
  });

  // ─── NEW TESTS: Position awareness ─────────────────────────────

  describe('Position awareness', () => {
    test('getAIDecision accepts opponentChips and isInPosition params', () => {
      const player = createPlayer({
        cards: [createCard(10, 'hearts'), createCard(10, 'diamonds')],
        currentBet: 0,
        chips: 100
      });
      // Should not throw with new params
      const result = getAIDecision(player, [], 10, 20, 'preflop', 2, 'balanced', 100, true);
      expect(['fold', 'call', 'raise']).toContain(result.action);
    });
  });

  // ─── NEW TESTS: Short stack ────────────────────────────────────

  describe('Short stack play', () => {
    test('short-stacked AI with decent hand goes all-in', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(13, 'spades')],
        currentBet: 0,
        chips: 15
      });
      const community = [
        createCard(14, 'clubs'), createCard(7, 'diamonds'), createCard(3, 'spades')
      ];
      let allInCount = 0;
      for (let i = 0; i < 30; i++) {
        // AK raised preflop (wasAggressor=true), so c-bet + short-stack push applies
        const result = getAIDecision(player, community, 0, 30, 'flop', 2, 'balanced', 85, undefined, true);
        if (result.action === 'raise' && result.amount != null && result.amount >= 13) {
          allInCount++;
        }
      }
      // With top pair + top kicker and only 15 chips, should push all-in often
      expect(allInCount).toBeGreaterThan(10);
    });
  });

  // ─── EDGE CASE TESTS ──────────────────────────────────────────

  describe('Edge cases: preflop hand chart coverage', () => {
    test('suited connectors (87s) are valued higher than trash', () => {
      const player = createPlayer({
        cards: [createCard(8, 'hearts'), createCard(7, 'hearts')],
        currentBet: 0,
        chips: 100
      });
      let foldCount = 0;
      for (let i = 0; i < 30; i++) {
        const result = getAIDecision(player, [], 10, 15, 'preflop', 2);
        if (result.action === 'fold') foldCount++;
      }
      // Suited connectors should mostly see cheap flops
      expect(foldCount).toBeLessThan(10);
    });

    test('KQs (suited broadway) raises or calls, never folds to standard raises', () => {
      const player = createPlayer({
        cards: [createCard(13, 'hearts'), createCard(12, 'hearts')],
        currentBet: 0,
        chips: 100
      });
      for (let i = 0; i < 20; i++) {
        const result = getAIDecision(player, [], 20, 30, 'preflop', 2);
        expect(result.action).not.toBe('fold');
      }
    });

    test('small pocket pair (22) calls cheap raises', () => {
      const player = createPlayer({
        cards: [createCard(2, 'hearts'), createCard(2, 'clubs')],
        currentBet: 0,
        chips: 100
      });
      let callOrRaiseCount = 0;
      for (let i = 0; i < 30; i++) {
        const result = getAIDecision(player, [], 10, 15, 'preflop', 2);
        if (result.action !== 'fold') callOrRaiseCount++;
      }
      // Small pairs should usually set mine (call to see flop)
      expect(callOrRaiseCount).toBeGreaterThan(15);
    });
  });

  describe('Edge cases: postflop river decisions', () => {
    test('AI with nothing on the river folds to bets (no more draws)', () => {
      const player = createPlayer({
        cards: [createCard(4, 'hearts'), createCard(2, 'clubs')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(14, 'diamonds'), createCard(13, 'spades'), createCard(11, 'clubs'),
        createCard(9, 'hearts'), createCard(6, 'diamonds')
      ];
      let foldCount = 0;
      for (let i = 0; i < 30; i++) {
        const result = getAIDecision(player, community, 20, 50, 'river', 2);
        if (result.action === 'fold') foldCount++;
      }
      // 42o with nothing on AKJ96 board — should fold on river
      expect(foldCount).toBeGreaterThan(15);
    });

    test('AI with a made flush on river raises for value', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(10, 'hearts')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(3, 'hearts'), createCard(7, 'hearts'), createCard(11, 'clubs'),
        createCard(9, 'diamonds'), createCard(5, 'hearts')
      ];
      let raiseOrCallCount = 0;
      for (let i = 0; i < 20; i++) {
        const result = getAIDecision(player, community, 10, 40, 'river', 2);
        if (result.action !== 'fold') raiseOrCallCount++;
      }
      // Made flush should never fold on the river
      expect(raiseOrCallCount).toBe(20);
    });
  });

  describe('Edge cases: continuation bet behavior', () => {
    test('AI c-bets on flop when it was the preflop aggressor', () => {
      const player = createPlayer({
        cards: [createCard(8, 'hearts'), createCard(7, 'clubs')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(14, 'diamonds'), createCard(3, 'spades'), createCard(11, 'clubs')
      ];
      let raiseCount = 0;
      for (let i = 0; i < 100; i++) {
        // wasAggressor = true: AI raised preflop, so c-bet should fire
        const result = getAIDecision(player, community, 0, 30, 'flop', 2, 'balanced', undefined, undefined, true);
        if (result.action === 'raise') raiseCount++;
      }
      // C-bet frequency for balanced is 0.65 — should raise a meaningful amount
      expect(raiseCount).toBeGreaterThan(30);
    });

    test('AI does NOT c-bet on flop when it was NOT the preflop aggressor', () => {
      const player = createPlayer({
        cards: [createCard(8, 'hearts'), createCard(7, 'clubs')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(14, 'diamonds'), createCard(3, 'spades'), createCard(11, 'clubs')
      ];
      let raiseCount = 0;
      for (let i = 0; i < 100; i++) {
        // wasAggressor = false: AI just called preflop, no c-bet
        const result = getAIDecision(player, community, 0, 30, 'flop', 2, 'balanced', undefined, undefined, false);
        if (result.action === 'raise') raiseCount++;
      }
      // Without aggressor status, should mostly check (only bluffs/semi-bluffs)
      expect(raiseCount).toBeLessThan(30);
    });
  });

  describe('Edge cases: personality differences on same hand', () => {
    test('aggressive personality raises more often than conservative', () => {
      const player = createPlayer({
        cards: [createCard(10, 'hearts'), createCard(9, 'hearts')],
        currentBet: 0,
        chips: 100
      });
      const community = [
        createCard(8, 'diamonds'), createCard(3, 'spades'), createCard(5, 'clubs')
      ];

      let aggressiveRaises = 0;
      let conservativeRaises = 0;
      for (let i = 0; i < 100; i++) {
        const aggResult = getAIDecision(player, community, 0, 30, 'flop', 2, 'aggressive');
        const conResult = getAIDecision(player, community, 0, 30, 'flop', 2, 'conservative');
        if (aggResult.action === 'raise') aggressiveRaises++;
        if (conResult.action === 'raise') conservativeRaises++;
      }
      expect(aggressiveRaises).toBeGreaterThan(conservativeRaises);
    });
  });

  describe('Edge cases: bet sizing boundaries', () => {
    test('raise never exceeds available chips after calling', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 0,
        chips: 30
      });
      const community = [
        createCard(3, 'clubs'), createCard(7, 'diamonds'), createCard(9, 'spades')
      ];
      for (let i = 0; i < 50; i++) {
        const result = getAIDecision(player, community, 10, 40, 'flop', 2);
        if (result.action === 'raise' && result.amount != null) {
          // Raise + call must not exceed total chips
          expect(result.amount + 10).toBeLessThanOrEqual(30);
          expect(result.amount).toBeGreaterThanOrEqual(5);
          expect(result.amount % 5).toBe(0);
        }
      }
    });

    test('preflop raise sizing is BB-relative (not $1)', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 10,
        chips: 90
      });
      let totalRaise = 0;
      let count = 0;
      for (let i = 0; i < 30; i++) {
        const result = getAIDecision(player, [], 10, 20, 'preflop', 2);
        if (result.action === 'raise' && result.amount != null) {
          totalRaise += result.amount;
          count++;
        }
      }
      if (count > 0) {
        const avg = totalRaise / count;
        // With BB=$10, preflop opens should average ~$25-30, not $1-5
        expect(avg).toBeGreaterThanOrEqual(15);
      }
    });
  });

  describe('Edge cases: position bonus', () => {
    test('position bonus gives slight edge to in-position play', () => {
      const player = createPlayer({
        cards: [createCard(10, 'hearts'), createCard(9, 'diamonds')],
        currentBet: 0,
        chips: 100
      });

      let ipRaiseCount = 0;
      let oopRaiseCount = 0;
      for (let i = 0; i < 200; i++) {
        const ipResult = getAIDecision(player, [], 10, 20, 'preflop', 2, 'balanced', 100, true);
        const oopResult = getAIDecision(player, [], 10, 20, 'preflop', 2, 'balanced', 100, false);
        if (ipResult.action === 'raise') ipRaiseCount++;
        if (oopResult.action === 'raise') oopRaiseCount++;
      }
      // In position should raise at least as often, ideally more
      expect(ipRaiseCount).toBeGreaterThanOrEqual(oopRaiseCount);
    });
  });

  describe('Edge cases: turn and showdown phases', () => {
    test('AI handles turn phase correctly', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(13, 'hearts')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(3, 'hearts'), createCard(7, 'diamonds'), createCard(9, 'spades'),
        createCard(14, 'clubs')
      ];
      const result = getAIDecision(player, community, 10, 40, 'turn', 2);
      // Top pair top kicker on turn should play
      expect(['call', 'raise']).toContain(result.action);
    });

    test('AI handles showdown phase without crashing', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(13, 'hearts')],
        currentBet: 0,
        chips: 80
      });
      const community = [
        createCard(3, 'hearts'), createCard(7, 'diamonds'), createCard(9, 'spades'),
        createCard(14, 'clubs'), createCard(2, 'diamonds')
      ];
      const result = getAIDecision(player, community, 0, 40, 'showdown', 2);
      expect(['call', 'raise']).toContain(result.action);
    });
  });
});
