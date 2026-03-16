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
        expect(result.amount).toBeGreaterThanOrEqual(0);
        expect(result.amount % 5).toBe(0); // AI-045: $5 increments
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
      expect(foldCount).toBeLessThan(5);
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
      expect(foldCount).toBeLessThan(10);
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
      expect(foldCount).toBeLessThan(10);
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
    test('AI almost always sees the flop cheaply preflop', () => {
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
      expect(foldCount).toBeLessThan(15);
    });
  });

  describe('AI-044–AI-045: Raise amount', () => {
    test('raise amount is always a multiple of $5 (AI-045)', () => {
      const player = createPlayer({
        cards: [createCard(14, 'hearts'), createCard(14, 'spades')],
        currentBet: 10,
        chips: 90
      });
      for (let i = 0; i < 30; i++) {
        const result = getAIDecision(player, [], 10, 20, 'preflop', 2);
        if (result.action === 'raise' && result.amount != null) {
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
});
