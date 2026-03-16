import { evaluateHand, compareHands, getTieBreakingDescriptions } from './pokerLogic';
import { Card, PokerHand } from './types';

// Helper function to create test cards
const createCard = (rank: number, suit: Card['suit']): Card => ({
  rank,
  suit,
  displayRank: rank === 14 ? 'A' : rank === 13 ? 'K' : rank === 12 ? 'Q' : rank === 11 ? 'J' : rank.toString()
});

// PRD: game-design/core-rules.md (CR hand rankings, CR-041 compareHands, CR-044 kickers)
describe('Poker Hand Evaluation (CR hand rankings, CR-041)', () => {
  test('Royal Flush', () => {
    const holeCards = [
      createCard(14, 'hearts'), // Ace
      createCard(13, 'hearts')  // King
    ];
    const communityCards = [
      createCard(12, 'hearts'), // Queen
      createCard(11, 'hearts'), // Jack
      createCard(10, 'hearts'), // 10
      createCard(9, 'clubs'),   // 9 (different suit)
      createCard(8, 'diamonds') // 8 (different suit)
    ];

    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('royal-flush');
    expect(result.rank).toBe(10);
    expect(result.description).toBe('Royal Flush');
  });

  test('Straight Flush', () => {
    const holeCards = [
      createCard(9, 'spades'),  // 9
      createCard(10, 'spades')  // 10
    ];
    const communityCards = [
      createCard(11, 'spades'), // Jack
      createCard(12, 'spades'), // Queen
      createCard(13, 'spades'), // King
      createCard(7, 'hearts'),  // 7 (different suit)
      createCard(8, 'diamonds') // 8 (different suit)
    ];

    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('straight-flush');
    expect(result.rank).toBe(9);
    expect(result.description).toContain('Straight Flush');
  });

  test('Four of a Kind', () => {
    const holeCards = [
      createCard(7, 'hearts'),  // 7
      createCard(7, 'diamonds') // 7
    ];
    const communityCards = [
      createCard(7, 'clubs'),   // 7
      createCard(7, 'spades'),  // 7
      createCard(14, 'hearts'), // Ace
      createCard(2, 'clubs'),   // 2
      createCard(3, 'diamonds') // 3
    ];

    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('four-of-a-kind');
    expect(result.rank).toBe(8);
    expect(result.description).toContain('Four 7s');
  });

  test('Full House', () => {
    const holeCards = [
      createCard(8, 'hearts'),  // 8
      createCard(8, 'diamonds') // 8
    ];
    const communityCards = [
      createCard(8, 'clubs'),   // 8
      createCard(9, 'hearts'),  // 9
      createCard(9, 'spades'),  // 9
      createCard(14, 'hearts'), // Ace
      createCard(2, 'clubs')    // 2
    ];

    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('full-house');
    expect(result.rank).toBe(7);
    expect(result.description).toContain('Full of');
  });

  test('Flush', () => {
    const holeCards = [
      createCard(14, 'hearts'), // Ace
      createCard(10, 'hearts')  // 10
    ];
    const communityCards = [
      createCard(7, 'hearts'),  // 7
      createCard(5, 'hearts'),  // 5
      createCard(3, 'hearts'),  // 3
      createCard(9, 'clubs'),   // 9 (different suit)
      createCard(8, 'diamonds') // 8 (different suit)
    ];

    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('flush');
    expect(result.rank).toBe(6);
    expect(result.description).toContain('Flush');
  });

  test('Straight', () => {
    const holeCards = [
      createCard(14, 'hearts'), // Ace
      createCard(2, 'diamonds') // 2
    ];
    const communityCards = [
      createCard(3, 'clubs'),   // 3
      createCard(4, 'hearts'),  // 4
      createCard(5, 'spades'),  // 5
      createCard(9, 'clubs'),   // 9
      createCard(8, 'diamonds') // 8
    ];

    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('straight');
    expect(result.rank).toBe(5);
    expect(result.description).toContain('Straight');
  });

  test('Wheel straight (A-2-3-4-5)', () => {
    const holeCards = [
      createCard(14, 'hearts'),
      createCard(2, 'diamonds')
    ];
    const communityCards = [
      createCard(3, 'clubs'),
      createCard(4, 'spades'),
      createCard(5, 'hearts'),
      createCard(9, 'clubs'),
      createCard(8, 'diamonds')
    ];
    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('straight');
    expect(result.rank).toBe(5);
    expect(result.description).toMatch(/5 High Straight|Straight/);
  });

  test('Three of a Kind', () => {
    const holeCards = [
      createCard(9, 'hearts'),
      createCard(9, 'diamonds')
    ];
    const communityCards = [
      createCard(9, 'clubs'),
      createCard(4, 'spades'),
      createCard(7, 'hearts'),
      createCard(2, 'clubs'),
      createCard(14, 'diamonds')
    ];
    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('three-of-a-kind');
    expect(result.rank).toBe(4);
    expect(result.description).toContain('9');
  });

  test('Two Pair', () => {
    const holeCards = [
      createCard(10, 'hearts'),
      createCard(10, 'diamonds')
    ];
    const communityCards = [
      createCard(8, 'clubs'),
      createCard(8, 'spades'),
      createCard(14, 'hearts'),
      createCard(3, 'clubs'),
      createCard(2, 'diamonds')
    ];
    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('two-pair');
    expect(result.rank).toBe(3);
    expect(result.description).toMatch(/10s and 8s|8s and 10s/);
  });

  test('One Pair', () => {
    const holeCards = [
      createCard(12, 'hearts'),
      createCard(12, 'clubs')
    ];
    const communityCards = [
      createCard(7, 'diamonds'),
      createCard(5, 'spades'),
      createCard(3, 'hearts'),
      createCard(2, 'clubs'),
      createCard(14, 'diamonds')
    ];
    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('pair');
    expect(result.rank).toBe(2);
    expect(result.description).toContain('Queen');
  });

  test('High Card', () => {
    const holeCards = [
      createCard(14, 'hearts'), // Ace
      createCard(7, 'diamonds') // 7
    ];
    const communityCards = [
      createCard(2, 'clubs'),   // 2
      createCard(4, 'hearts'),  // 4
      createCard(6, 'spades'),  // 6
      createCard(9, 'clubs'),   // 9
      createCard(8, 'diamonds') // 8
    ];

    const result = evaluateHand(holeCards, communityCards);
    expect(result.type).toBe('high-card');
    expect(result.rank).toBe(1);
    expect(result.description).toContain('High');
  });

  test('Hand Comparison: hand1 wins (CR-041)', () => {
    const hand1Hole = [createCard(14, 'hearts'), createCard(13, 'hearts')];
    const hand1Community = [createCard(12, 'hearts'), createCard(11, 'hearts'), createCard(10, 'hearts'), createCard(9, 'clubs'), createCard(8, 'diamonds')];
    const hand1 = evaluateHand(hand1Hole, hand1Community); // Royal Flush

    const hand2Hole = [createCard(14, 'hearts'), createCard(7, 'diamonds')];
    const hand2Community = [createCard(2, 'clubs'), createCard(4, 'hearts'), createCard(6, 'spades'), createCard(9, 'clubs'), createCard(8, 'diamonds')];
    const hand2 = evaluateHand(hand2Hole, hand2Community); // High Card

    expect(compareHands(hand1, hand2)).toBe(1);
  });

  test('Hand Comparison: hand2 wins (CR-041)', () => {
    const hand1 = evaluateHand(
      [createCard(2, 'hearts'), createCard(3, 'clubs')],
      [createCard(4, 'diamonds'), createCard(5, 'spades'), createCard(7, 'hearts'), createCard(8, 'clubs'), createCard(9, 'diamonds')]
    ); // High card
    const hand2 = evaluateHand(
      [createCard(10, 'hearts'), createCard(10, 'spades')],
      [createCard(14, 'clubs'), createCard(8, 'hearts'), createCard(3, 'diamonds'), createCard(2, 'spades'), createCard(6, 'clubs')]
    ); // Pair
    expect(compareHands(hand1, hand2)).toBe(-1);
  });

  test('Hand Comparison: tie returns 0 (CR-041)', () => {
    const comm = [createCard(12, 'diamonds'), createCard(11, 'diamonds'), createCard(10, 'diamonds'), createCard(9, 'clubs'), createCard(8, 'spades')];
    const hole1 = [createCard(14, 'spades'), createCard(13, 'spades')];
    const hole2 = [createCard(14, 'hearts'), createCard(13, 'hearts')];
    const hand1 = evaluateHand(hole1, comm);
    const hand2 = evaluateHand(hole2, comm);
    expect(compareHands(hand1, hand2)).toBe(0);
  });

  test('Kicker tie-breaking: pair of Kings, Ace kicker beats Queen kicker (CR-044)', () => {
    const comm = [createCard(13, 'hearts'), createCard(7, 'diamonds'), createCard(4, 'clubs'), createCard(3, 'spades'), createCard(2, 'hearts')];
    const hand1 = evaluateHand(
      [createCard(13, 'spades'), createCard(14, 'spades')], comm
    );
    const hand2 = evaluateHand(
      [createCard(13, 'diamonds'), createCard(12, 'diamonds')], comm
    );
    expect(hand1.type).toBe('pair');
    expect(hand2.type).toBe('pair');
    expect(compareHands(hand1, hand2)).toBe(1);
  });

  test('Two-pair kicker: same two pair, higher kicker wins (CR-044)', () => {
    const comm = [createCard(10, 'hearts'), createCard(8, 'diamonds'), createCard(3, 'clubs'), createCard(10, 'spades'), createCard(8, 'clubs')];
    const hand1 = evaluateHand(
      [createCard(14, 'hearts'), createCard(2, 'spades')], comm
    );
    const hand2 = evaluateHand(
      [createCard(6, 'hearts'), createCard(2, 'diamonds')], comm
    );
    expect(hand1.type).toBe('two-pair');
    expect(hand2.type).toBe('two-pair');
    expect(compareHands(hand1, hand2)).toBe(1);
  });
});

describe('getTieBreakingDescriptions', () => {
  const mkHand = (type: PokerHand['type'], cards: Card[], description: string, rank = 0): PokerHand => ({
    type, cards, description, rank,
  });

  test('different pair ranks use plain descriptions, not kicker text', () => {
    const winner = mkHand('pair',
      [createCard(6, 'spades'), createCard(6, 'clubs'), createCard(14, 'hearts'), createCard(13, 'spades'), createCard(12, 'hearts')],
      'Pair of 6s');
    const loser = mkHand('pair',
      [createCard(5, 'spades'), createCard(5, 'hearts'), createCard(14, 'clubs'), createCard(13, 'diamonds'), createCard(12, 'spades')],
      'Pair of 5s');
    const [winDesc, loseDesc] = getTieBreakingDescriptions(winner, loser);
    expect(winDesc).toBe('Pair of 6s');
    expect(loseDesc).toBe('Pair of 5s');
  });

  test('same pair rank shows kicker info', () => {
    const winner = mkHand('pair',
      [createCard(6, 'spades'), createCard(6, 'clubs'), createCard(14, 'hearts'), createCard(13, 'spades'), createCard(12, 'hearts')],
      'Pair of 6s');
    const loser = mkHand('pair',
      [createCard(6, 'hearts'), createCard(6, 'diamonds'), createCard(14, 'clubs'), createCard(13, 'diamonds'), createCard(11, 'spades')],
      'Pair of 6s');
    const [winDesc, loseDesc] = getTieBreakingDescriptions(winner, loser);
    expect(winDesc).toContain('Pair of 6s');
    expect(winDesc).toContain('kicker');
    expect(loseDesc).toContain('Pair of 6s');
    expect(loseDesc).toContain('kicker');
  });

  test('different three-of-a-kind ranks use plain descriptions', () => {
    const winner = mkHand('three-of-a-kind',
      [createCard(9, 'spades'), createCard(9, 'clubs'), createCard(9, 'hearts'), createCard(14, 'diamonds'), createCard(13, 'spades')],
      'Three 9s');
    const loser = mkHand('three-of-a-kind',
      [createCard(7, 'spades'), createCard(7, 'clubs'), createCard(7, 'hearts'), createCard(14, 'clubs'), createCard(13, 'diamonds')],
      'Three 7s');
    const [winDesc, loseDesc] = getTieBreakingDescriptions(winner, loser);
    expect(winDesc).toBe('Three 9s');
    expect(loseDesc).toBe('Three 7s');
  });

  test('different hand types return plain descriptions', () => {
    const winner = mkHand('flush',
      [createCard(14, 'hearts'), createCard(10, 'hearts'), createCard(8, 'hearts'), createCard(6, 'hearts'), createCard(3, 'hearts')],
      'Flush (Ace high)');
    const loser = mkHand('pair',
      [createCard(10, 'spades'), createCard(10, 'clubs'), createCard(14, 'diamonds'), createCard(9, 'hearts'), createCard(7, 'clubs')],
      'Pair of 10s');
    const [winDesc, loseDesc] = getTieBreakingDescriptions(winner, loser);
    expect(winDesc).toBe('Flush (Ace high)');
    expect(loseDesc).toBe('Pair of 10s');
  });
});