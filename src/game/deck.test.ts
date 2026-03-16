/**
 * PRD: game-design/core-rules.md (CR-002), technical/data-models.md (DM-020–DM-029)
 * Deck class: 52 cards, shuffle, deal, reset, getSuitSymbol, getSuitColor, createDeck
 */

import { Deck, createDeck, getSuitSymbol, getSuitColor } from './deck';
import { Card } from './types';

describe('Deck (CR-002, DM-020–DM-029)', () => {
  describe('constructor and initializeDeck', () => {
    test('creates a deck with 52 cards', () => {
      const deck = new Deck();
      expect(deck.getRemainingCards()).toBe(52);
    });

    test('contains 4 suits each with 13 ranks', () => {
      const deck = new Deck();
      const cards = deck.getCards();
      const suits = new Set(cards.map((c: Card) => c.suit));
      const ranks = new Set(cards.map((c: Card) => c.rank));
      expect(suits.size).toBe(4);
      expect(ranks.size).toBe(13);
      expect(suits.has('hearts')).toBe(true);
      expect(suits.has('diamonds')).toBe(true);
      expect(suits.has('clubs')).toBe(true);
      expect(suits.has('spades')).toBe(true);
      expect(ranks.has(14)).toBe(true); // Ace
      expect(ranks.has(2)).toBe(true);
    });
  });

  describe('shuffle', () => {
    test('shuffle changes card order', () => {
      const deck1 = new Deck();
      const deck2 = new Deck();
      const order1 = deck1.getCards().map((c: Card) => `${c.rank}-${c.suit}`);
      deck2.shuffle();
      const order2 = deck2.getCards().map((c: Card) => `${c.rank}-${c.suit}`);
      expect(order1.join(',')).not.toBe(order2.join(','));
    });

    test('shuffle preserves 52 cards', () => {
      const deck = new Deck();
      deck.shuffle();
      expect(deck.getRemainingCards()).toBe(52);
    });
  });

  describe('dealCard and dealCards', () => {
    test('dealCard reduces remaining count by 1', () => {
      const deck = new Deck();
      deck.dealCard();
      expect(deck.getRemainingCards()).toBe(51);
    });

    test('dealCards(count) returns count cards and reduces deck', () => {
      const deck = new Deck();
      const dealt = deck.dealCards(5);
      expect(dealt.length).toBe(5);
      expect(deck.getRemainingCards()).toBe(47);
    });

    test('dealCard returns undefined when deck empty', () => {
      const deck = new Deck();
      for (let i = 0; i < 52; i++) deck.dealCard();
      expect(deck.dealCard()).toBeUndefined();
    });
  });

  describe('getRemainingCards and reset', () => {
    test('reset restores 52 cards', () => {
      const deck = new Deck();
      deck.dealCards(10);
      deck.reset();
      expect(deck.getRemainingCards()).toBe(52);
    });
  });

  describe('createDeck factory', () => {
    test('createDeck returns shuffled deck with 52 cards', () => {
      const deck = createDeck();
      expect(deck.getRemainingCards()).toBe(52);
      expect(deck).toBeInstanceOf(Deck);
    });
  });

  describe('getSuitSymbol (DM-028)', () => {
    test('returns correct Unicode symbols for each suit', () => {
      expect(getSuitSymbol('hearts')).toBe('♥');
      expect(getSuitSymbol('diamonds')).toBe('♦');
      expect(getSuitSymbol('clubs')).toBe('♣');
      expect(getSuitSymbol('spades')).toBe('♠');
    });
  });

  describe('getSuitColor (DM-029)', () => {
    test('hearts and diamonds are red', () => {
      expect(getSuitColor('hearts')).toBe('red');
      expect(getSuitColor('diamonds')).toBe('red');
    });
    test('clubs and spades are black', () => {
      expect(getSuitColor('clubs')).toBe('black');
      expect(getSuitColor('spades')).toBe('black');
    });
  });
});
