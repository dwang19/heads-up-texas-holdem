import { Card, PokerHand } from './types';

/**
 * Poker hand evaluation logic for Texas Hold'em
 * Evaluates the best 5-card poker hand from 7 available cards (2 hole + 5 community)
 */

// Helper function to sort cards by rank (highest first)
export const sortCardsByRank = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => b.rank - a.rank);
};

// Helper function to group cards by rank
export const groupByRank = (cards: Card[]): Map<number, Card[]> => {
  const groups = new Map<number, Card[]>();
  cards.forEach(card => {
    if (!groups.has(card.rank)) {
      groups.set(card.rank, []);
    }
    groups.get(card.rank)!.push(card);
  });
  return groups;
};

// Helper function to group cards by suit
export const groupBySuit = (cards: Card[]): Map<string, Card[]> => {
  const groups = new Map<string, Card[]>();
  cards.forEach(card => {
    if (!groups.has(card.suit)) {
      groups.set(card.suit, []);
    }
    groups.get(card.suit)!.push(card);
  });
  return groups;
};

// Check for Royal Flush (A K Q J 10 of same suit)
export const isRoyalFlush = (cards: Card[]): PokerHand | null => {
  const sorted = sortCardsByRank(cards);
  const suits = groupBySuit(cards);

  for (const suitCards of suits.values()) {
    if (suitCards.length >= 5) {
      const royalRanks = [14, 13, 12, 11, 10]; // A, K, Q, J, 10
      const suitRanks = suitCards.map(c => c.rank).sort((a, b) => b - a);

      // Check if we have all royal ranks in this suit
      const hasAllRoyal = royalRanks.every(rank => suitRanks.includes(rank));
      if (hasAllRoyal) {
        const royalCards = royalRanks.map(rank =>
          suitCards.find(c => c.rank === rank)!
        );
        return {
          type: 'royal-flush',
          rank: 10,
          cards: royalCards,
          description: 'Royal Flush'
        };
      }
    }
  }
  return null;
};

// Check for Straight Flush (5 consecutive cards of same suit)
export const isStraightFlush = (cards: Card[]): PokerHand | null => {
  const suits = groupBySuit(cards);

  for (const suitCards of suits.values()) {
    if (suitCards.length >= 5) {
      const sorted = sortCardsByRank(suitCards);
      const ranks = sorted.map(c => c.rank);

      // Check for consecutive sequences
      for (let i = 0; i <= sorted.length - 5; i++) {
        const sequence = ranks.slice(i, i + 5);
        if (isConsecutive(sequence)) {
          return {
            type: 'straight-flush',
            rank: 9,
            cards: sorted.slice(i, i + 5),
            description: `${getRankName(sequence[0])} High Straight Flush`
          };
        }
      }

      // Check for wheel straight flush (A 2 3 4 5)
      if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3) &&
          ranks.includes(4) && ranks.includes(5)) {
        const wheelCards = [14, 2, 3, 4, 5].map(rank =>
          suitCards.find(c => c.rank === rank)!
        ).sort((a, b) => b.rank - a.rank);
        return {
          type: 'straight-flush',
          rank: 9,
          cards: wheelCards,
          description: '5 High Straight Flush'
        };
      }
    }
  }
  return null;
};

// Check for Four of a Kind
export const isFourOfAKind = (cards: Card[]): PokerHand | null => {
  const groups = groupByRank(cards);

  for (const [rank, rankCards] of groups) {
    if (rankCards.length === 4) {
      const quadCards = rankCards;
      const remainingCards = sortCardsByRank(
        cards.filter(c => !quadCards.includes(c))
      );
      const handCards = [...quadCards, remainingCards[0]];

      return {
        type: 'four-of-a-kind',
        rank: 8,
        cards: handCards,
        description: `Four ${getRankName(rank)}s`
      };
    }
  }
  return null;
};

// Check for Full House (3 of one rank + 2 of another)
export const isFullHouse = (cards: Card[]): PokerHand | null => {
  const groups = groupByRank(cards);
  const rankCounts = Array.from(groups.entries())
    .map(([rank, cards]) => ({ rank, count: cards.length, cards }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  if (rankCounts.length >= 2 && rankCounts[0].count >= 3 && rankCounts[1].count >= 2) {
    const trips = rankCounts[0].cards.slice(0, 3);
    const pair = rankCounts[1].cards.slice(0, 2);
    const handCards = [...trips, ...pair];

    return {
      type: 'full-house',
      rank: 7,
      cards: handCards,
      description: `${getRankName(rankCounts[0].rank)}s Full of ${getRankName(rankCounts[1].rank)}s`
    };
  }
  return null;
};

// Check for Flush (5 cards of same suit)
export const isFlush = (cards: Card[]): PokerHand | null => {
  const suits = groupBySuit(cards);

  for (const suitCards of suits.values()) {
    if (suitCards.length >= 5) {
      const sorted = sortCardsByRank(suitCards);
      const handCards = sorted.slice(0, 5);

      return {
        type: 'flush',
        rank: 6,
        cards: handCards,
        description: `${getRankName(handCards[0].rank)} High Flush`
      };
    }
  }
  return null;
};

// Check for Straight (5 consecutive cards)
export const isStraight = (cards: Card[]): PokerHand | null => {
  const sorted = sortCardsByRank(cards);
  const ranks = [...new Set(sorted.map(c => c.rank))]; // Remove duplicates

  // Check for consecutive sequences
  for (let i = 0; i <= ranks.length - 5; i++) {
    const sequence = ranks.slice(i, i + 5);
    if (isConsecutive(sequence)) {
      const handCards = sequence.map(rank =>
        sorted.find(c => c.rank === rank)!
      );
      return {
        type: 'straight',
        rank: 5,
        cards: handCards,
        description: `${getRankName(sequence[0])} High Straight`
      };
    }
  }

  // Check for wheel straight (A 2 3 4 5)
  if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3) &&
      ranks.includes(4) && ranks.includes(5)) {
    const wheelCards = [14, 2, 3, 4, 5].map(rank =>
      sorted.find(c => c.rank === rank)!
    ).sort((a, b) => b.rank - a.rank);
    return {
      type: 'straight',
      rank: 5,
      cards: wheelCards,
      description: '5 High Straight'
    };
  }

  return null;
};

// Check for Three of a Kind
export const isThreeOfAKind = (cards: Card[]): PokerHand | null => {
  const groups = groupByRank(cards);

  for (const [rank, rankCards] of groups) {
    if (rankCards.length >= 3) {
      const trips = rankCards.slice(0, 3);
      const remainingCards = sortCardsByRank(
        cards.filter(c => !trips.includes(c))
      );
      const handCards = [...trips, ...remainingCards.slice(0, 2)];

      return {
        type: 'three-of-a-kind',
        rank: 4,
        cards: handCards,
        description: `Three ${getRankName(rank)}s`
      };
    }
  }
  return null;
};

// Check for Two Pair
export const isTwoPair = (cards: Card[]): PokerHand | null => {
  const groups = groupByRank(cards);
  const pairs = Array.from(groups.entries())
    .filter(([_, cards]) => cards.length >= 2)
    .sort((a, b) => b[0] - a[0]); // Sort by rank descending

  if (pairs.length >= 2) {
    const highPair = pairs[0][1].slice(0, 2);
    const lowPair = pairs[1][1].slice(0, 2);
    const remainingCards = sortCardsByRank(
      cards.filter(c => !highPair.includes(c) && !lowPair.includes(c))
    );
    const handCards = [...highPair, ...lowPair, remainingCards[0]];

    return {
      type: 'two-pair',
      rank: 3,
      cards: handCards,
      description: `${getRankName(pairs[0][0])}s and ${getRankName(pairs[1][0])}s`
    };
  }
  return null;
};

// Check for One Pair
export const isOnePair = (cards: Card[]): PokerHand | null => {
  const groups = groupByRank(cards);

  for (const [rank, rankCards] of groups) {
    if (rankCards.length >= 2) {
      const pair = rankCards.slice(0, 2);
      const remainingCards = sortCardsByRank(
        cards.filter(c => !pair.includes(c))
      );
      const handCards = [...pair, ...remainingCards.slice(0, 3)];

      return {
        type: 'pair',
        rank: 2,
        cards: handCards,
        description: `Pair of ${getRankName(rank)}s`
      };
    }
  }
  return null;
};

// Check for High Card
export const getHighCard = (cards: Card[]): PokerHand => {
  const sorted = sortCardsByRank(cards);
  const handCards = sorted.slice(0, 5);

  return {
    type: 'high-card',
    rank: 1,
    cards: handCards,
    description: `${getRankName(handCards[0].rank)} High`
  };
};

// Helper function to check if ranks are consecutive
const isConsecutive = (ranks: number[]): boolean => {
  for (let i = 0; i < ranks.length - 1; i++) {
    if (ranks[i] !== ranks[i + 1] + 1) {
      return false;
    }
  }
  return true;
};

// Helper function to get readable rank name
export const getRankName = (rank: number): string => {
  switch (rank) {
    case 14: return 'Ace';
    case 13: return 'King';
    case 12: return 'Queen';
    case 11: return 'Jack';
    default: return rank.toString();
  }
};

/**
 * Get the kicker card from a poker hand (the highest non-pair/non-trips card)
 * Returns the description with kicker info for tie-breaking scenarios
 */
export const getDescriptionWithKicker = (hand: PokerHand): string => {
  const handCards = hand.cards;
  
  switch (hand.type) {
    case 'pair': {
      // For a pair, kicker is the 3rd card (first non-pair card)
      const pairRank = handCards[0].rank; // First two cards are the pair
      const kicker = handCards.find(c => c.rank !== pairRank);
      if (kicker) {
        return `${hand.description} (${getRankName(kicker.rank)} high)`;
      }
      return hand.description;
    }
    case 'two-pair': {
      // For two pair, kicker is the 5th card
      const kicker = handCards[4];
      if (kicker) {
        return `${hand.description} (${getRankName(kicker.rank)} kicker)`;
      }
      return hand.description;
    }
    case 'three-of-a-kind': {
      // For trips, kicker is the 4th card
      const tripsRank = handCards[0].rank;
      const kicker = handCards.find(c => c.rank !== tripsRank);
      if (kicker) {
        return `${hand.description} (${getRankName(kicker.rank)} high)`;
      }
      return hand.description;
    }
    case 'high-card': {
      // For high card, already has the high card in description
      // But we can add the second highest for more detail
      if (handCards.length >= 2) {
        return `${hand.description} (${getRankName(handCards[1].rank)} kicker)`;
      }
      return hand.description;
    }
    default:
      return hand.description;
  }
};

/**
 * Get descriptions for two hands that highlight the actual tie-breaking kicker
 * Used when both hands are the same type and we need to show what actually broke the tie
 * @returns [winnerDescription, loserDescription] with tie-breaking kicker info
 */
export const getTieBreakingDescriptions = (
  winnerHand: PokerHand,
  loserHand: PokerHand
): [string, string] => {
  // Only applies when hands are the same type
  if (winnerHand.type !== loserHand.type) {
    return [winnerHand.description, loserHand.description];
  }

  const winnerCards = winnerHand.cards;
  const loserCards = loserHand.cards;

  // Find the first card position where they differ
  let tieBreakIndex = -1;
  for (let i = 0; i < Math.min(winnerCards.length, loserCards.length); i++) {
    if (winnerCards[i].rank !== loserCards[i].rank) {
      tieBreakIndex = i;
      break;
    }
  }

  // If no difference found (shouldn't happen if winner was determined)
  if (tieBreakIndex === -1) {
    return [getDescriptionWithKicker(winnerHand), getDescriptionWithKicker(loserHand)];
  }

  const winnerKicker = getRankName(winnerCards[tieBreakIndex].rank);
  const loserKicker = getRankName(loserCards[tieBreakIndex].rank);

  // Build descriptions based on hand type
  switch (winnerHand.type) {
    case 'high-card':
      return [
        `${getRankName(winnerCards[0].rank)} High (${winnerKicker} kicker)`,
        `${getRankName(loserCards[0].rank)} High (${loserKicker} kicker)`
      ];
    case 'pair': {
      if (winnerCards[0].rank !== loserCards[0].rank) {
        return [winnerHand.description, loserHand.description];
      }
      const pairRank = getRankName(winnerCards[0].rank);
      return [
        `Pair of ${pairRank}s (${winnerKicker} kicker)`,
        `Pair of ${pairRank}s (${loserKicker} kicker)`
      ];
    }
    case 'two-pair': {
      // For two pair, use the base description and add kicker
      return [
        `${winnerHand.description} (${winnerKicker} kicker)`,
        `${loserHand.description} (${loserKicker} kicker)`
      ];
    }
    case 'three-of-a-kind': {
      if (winnerCards[0].rank !== loserCards[0].rank) {
        return [winnerHand.description, loserHand.description];
      }
      const tripsRank = getRankName(winnerCards[0].rank);
      return [
        `Three ${tripsRank}s (${winnerKicker} kicker)`,
        `Three ${tripsRank}s (${loserKicker} kicker)`
      ];
    }
    case 'flush': {
      return [
        `${winnerHand.description} (${winnerKicker} high)`,
        `${loserHand.description} (${loserKicker} high)`
      ];
    }
    default:
      // For other hands (straights, full houses, quads), kickers rarely matter
      return [winnerHand.description, loserHand.description];
  }
};

/**
 * Main function to evaluate the best poker hand from 7 cards
 * @param holeCards - Player's 2 private cards
 * @param communityCards - 5 shared community cards
 * @returns The best 5-card poker hand
 */
export const evaluateHand = (holeCards: Card[], communityCards: Card[]): PokerHand => {
  const allCards = [...holeCards, ...communityCards];

  // Try hands from highest to lowest rank
  return (
    isRoyalFlush(allCards) ||
    isStraightFlush(allCards) ||
    isFourOfAKind(allCards) ||
    isFullHouse(allCards) ||
    isFlush(allCards) ||
    isStraight(allCards) ||
    isThreeOfAKind(allCards) ||
    isTwoPair(allCards) ||
    isOnePair(allCards) ||
    getHighCard(allCards)
  );
};

/**
 * Compare two poker hands to determine which is better
 * @param hand1 - First poker hand
 * @param hand2 - Second poker hand
 * @returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
 */
export const compareHands = (hand1: PokerHand, hand2: PokerHand): number => {
  // First compare by hand rank
  if (hand1.rank !== hand2.rank) {
    return hand1.rank > hand2.rank ? 1 : -1;
  }

  // If same hand type, compare by card ranks
  const ranks1 = hand1.cards.map(c => c.rank).sort((a, b) => b - a);
  const ranks2 = hand2.cards.map(c => c.rank).sort((a, b) => b - a);

  for (let i = 0; i < ranks1.length; i++) {
    if (ranks1[i] !== ranks2[i]) {
      return ranks1[i] > ranks2[i] ? 1 : -1;
    }
  }

  return 0; // Complete tie
};