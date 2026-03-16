import { Card, Player, GameState } from './types';
import { evaluateHand, compareHands } from './pokerLogic';

export type AIDecision = 'fold' | 'call' | 'raise';
export type AIPersonality = 'aggressive' | 'conservative' | 'balanced';

export interface AIDecisionResult {
  action: AIDecision;
  amount?: number;
  reasoning: string;
}

/**
 * AI decision making system for Texas Hold'em poker
 * Evaluates hand strength and makes strategic betting decisions
 */

export class PokerAI {
  private personality: AIPersonality;

  constructor(personality: AIPersonality = 'balanced') {
    this.personality = personality;
  }

  /**
   * Main decision making function for AI players
   */
  makeDecision(
    player: Player,
    communityCards: Card[],
    currentBet: number,
    pot: number,
    gamePhase: GameState['phase'],
    activePlayersCount: number
  ): AIDecisionResult {
    if (!player.cards || player.cards.length === 0) {
      // Safety: if no cards available, just call/check - don't fold
      console.warn('AI: No cards available, defaulting to call');
      return { action: 'call', reasoning: 'No cards to evaluate - defaulting to call' };
    }

    // Evaluate hand strength (0-1 scale)
    const handStrength = this.evaluateHandStrength(player.cards, communityCards, gamePhase);

    // Calculate pot odds
    const potOdds = this.calculatePotOdds(player, currentBet, pot);

    // Calculate call amount needed
    const callAmount = Math.max(0, currentBet - player.currentBet);

    // DEBUG: Log all input values
    console.log('=== AI DECISION DEBUG ===');
    console.log('Player cards:', player.cards.map(c => `${c.displayRank}${c.suit}`).join(', '));
    console.log('Community cards:', communityCards.map(c => `${c.displayRank}${c.suit}`).join(', ') || 'none');
    console.log('Game phase:', gamePhase);
    console.log('Current bet to match:', currentBet);
    console.log('Player current bet:', player.currentBet);
    console.log('Call amount needed:', callAmount);
    console.log('Player chips:', player.chips);
    console.log('Pot:', pot);
    console.log('Hand strength:', handStrength.toFixed(3));
    console.log('Pot odds:', potOdds.toFixed(3));
    console.log('Personality:', this.personality);

    // Make decision based on personality and hand strength
    const decision = this.decideAction(handStrength, potOdds, callAmount, player.chips, gamePhase, activePlayersCount);
    
    console.log('DECISION:', decision.action, '-', decision.reasoning);
    console.log('=========================');
    
    return decision;
  }

  /**
   * Evaluate hand strength and win probability on a scale of 0-1
   * 0 = worst possible hand (0% chance to win), 1 = nuts (100% chance to win)
   * Considers current hand equity, improvement potential, and opponent modeling
   */
  private evaluateHandStrength(holeCards: Card[], communityCards: Card[], phase: GameState['phase']): number {
    if (holeCards.length !== 2) return 0;

    // Get current available cards based on game phase
    let availableCards = [...holeCards];
    let remainingCards = 0; // Cards yet to be dealt

    switch (phase) {
      case 'preflop':
        remainingCards = 5; // Flop(3) + Turn(1) + River(1)
        break;
      case 'flop':
        availableCards = [...holeCards, ...communityCards.slice(0, 3)];
        remainingCards = 2; // Turn(1) + River(1)
        break;
      case 'turn':
        availableCards = [...holeCards, ...communityCards.slice(0, 4)];
        remainingCards = 1; // River(1)
        break;
      case 'river':
      case 'showdown':
        availableCards = [...holeCards, ...communityCards];
        remainingCards = 0;
        break;
    }

    // Evaluate current hand strength
    const currentHand = evaluateHand(holeCards, availableCards.slice(2));
    const currentHandRank = currentHand.rank;

    // Calculate base equity (current hand strength)
    const baseEquity = this.calculateCurrentEquity(currentHandRank, phase);

    // Calculate hand potential (improvement equity)
    const improvementEquity = this.calculateImprovementEquity(holeCards, communityCards, phase, remainingCards);

    // Combine current equity with improvement potential
    const totalEquity = this.combineEquity(baseEquity, improvementEquity, remainingCards);

    return Math.min(1.0, Math.max(0.0, totalEquity));
  }

  /**
   * Calculate equity from current hand strength
   */
  private calculateCurrentEquity(handRank: number, phase: GameState['phase']): number {
    // Hand rank to equity mapping (rough estimates based on poker theory)
    const equityMap = {
      10: 1.0,   // Royal Flush - unbeatable
      9: 0.98,   // Straight Flush
      8: 0.95,   // Four of a Kind
      7: 0.90,   // Full House
      6: 0.85,   // Flush
      5: 0.75,   // Straight
      4: 0.65,   // Three of a Kind
      3: 0.55,   // Two Pair
      2: 0.45,   // Pair
      1: 0.35    // High Card
    };

    let baseEquity = equityMap[handRank as keyof typeof equityMap] || 0.35;

    // Adjust based on phase (later streets have more certainty)
    const phaseMultipliers: Record<GameState['phase'], number> = {
      'waiting': 0.5,  // No game in progress
      'preflop': 0.6,  // Much uncertainty
      'flop': 0.8,     // Some uncertainty
      'turn': 0.9,     // Less uncertainty
      'river': 1.0,    // Full certainty
      'showdown': 1.0
    };

    return baseEquity * (phaseMultipliers[phase] || 1.0);
  }

  /**
   * Calculate equity from hand improvement potential
   */
  private calculateImprovementEquity(holeCards: Card[], communityCards: Card[], phase: GameState['phase'], remainingCards: number): number {
    if (remainingCards === 0) return 0; // No more cards to come

    let improvementEquity = 0;

    // Calculate outs and potential improvements
    const allCards = [...holeCards, ...communityCards];
    const availableCards = phase === 'preflop' ? holeCards : allCards;

    // Flush draw potential
    const flushOuts = this.calculateFlushOuts(holeCards, communityCards, phase);
    if (flushOuts > 0) {
      // Flush equity increases with more outs
      improvementEquity += Math.min(0.25, flushOuts / 47 * 0.3);
    }

    // Straight draw potential
    const straightOuts = this.calculateStraightOuts(holeCards, communityCards, phase);
    if (straightOuts > 0) {
      improvementEquity += Math.min(0.20, straightOuts / 47 * 0.25);
    }

    // Overcard potential (especially preflop)
    if (phase === 'preflop') {
      const overcardEquity = this.calculateOvercardEquity(holeCards);
      improvementEquity += overcardEquity * 0.15;
    }

    // Pair improvement potential
    if (phase === 'flop' || phase === 'turn') {
      const pairOuts = this.calculatePairOuts(holeCards, communityCards);
      improvementEquity += Math.min(0.15, pairOuts / 47 * 0.2);
    }

    // Scale based on remaining cards (more cards = more improvement potential)
    const cardMultiplier = remainingCards / 5; // Max 5 cards in Texas Hold'em
    improvementEquity *= cardMultiplier;

    return Math.min(0.4, improvementEquity); // Cap improvement equity
  }

  /**
   * Combine current equity with improvement equity
   */
  private combineEquity(currentEquity: number, improvementEquity: number, remainingCards: number): number {
    if (remainingCards === 0) return currentEquity;

    // Weight current equity vs improvement equity based on cards remaining
    const currentWeight = (5 - remainingCards) / 5;
    const improvementWeight = remainingCards / 5;

    return (currentEquity * currentWeight) + (improvementEquity * improvementWeight);
  }

  /**
   * Calculate flush draw outs
   */
  private calculateFlushOuts(holeCards: Card[], communityCards: Card[], phase: GameState['phase']): number {
    if (phase === 'preflop') {
      const suitCounts = holeCards.reduce((counts, card) => {
        counts[card.suit] = (counts[card.suit] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      // Suited cards have flush potential
      const suitedCount = Math.max(...Object.values(suitCounts));
      if (suitedCount === 2) return 11; // Backdoor flush draw
      return 0;
    }

    const allCards = [...holeCards, ...communityCards];
    const suitCounts = allCards.reduce((counts, card) => {
      counts[card.suit] = (counts[card.suit] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    // Find suit with 4+ cards (flush draw)
    const flushSuit = Object.entries(suitCounts).find(([_, count]) => count >= 4)?.[0];
    if (flushSuit) {
      const suitCards = allCards.filter(card => card.suit === flushSuit).length;
      if (suitCards === 4) {
        // Flush draw - 9 outs (13 cards in suit - 4 on board - 2 in hand)
        return 9;
      }
    }

    return 0;
  }

  /**
   * Calculate straight draw outs
   */
  private calculateStraightOuts(holeCards: Card[], communityCards: Card[], phase: GameState['phase']): number {
    if (phase === 'preflop') {
      const [card1, card2] = holeCards;
      const ranks = [card1.rank, card2.rank].sort((a, b) => a - b);

      // Connected cards have straight potential
      if (Math.abs(ranks[0] - ranks[1]) <= 4) {
        return ranks[0] === ranks[1] ? 6 : 8; // Pocket pair vs connectors
      }
      return 0;
    }

    const allCards = [...holeCards, ...communityCards];
    const ranks = Array.from(new Set(allCards.map(c => c.rank))).sort((a, b) => a - b);

    let maxOuts = 0;

    // Check for open-ended straight draws
    for (let i = 0; i < ranks.length - 3; i++) {
      const sequence = ranks.slice(i, 4);
      if (sequence.every((rank, idx) => idx === 0 || rank === sequence[idx - 1] + 1)) {
        // Check if we have cards in this sequence
        const sequenceCards = allCards.filter(card => sequence.includes(card.rank));
        if (sequenceCards.length >= 3) {
          // Open-ended straight draw = 8 outs
          maxOuts = Math.max(maxOuts, 8);
        }
      }
    }

    // Check for gutshot straight draws
    for (let i = 0; i < ranks.length - 3; i++) {
      const sequence = ranks.slice(i, 4);
      // Look for sequences with one gap
      for (let gap = 0; gap < 3; gap++) {
        const testSequence = [...sequence];
        testSequence.splice(gap, 1); // Remove one card to create gap
        if (testSequence.length === 3 &&
            testSequence.every((rank, idx) => idx === 0 || rank === testSequence[idx - 1] + 1)) {
          const sequenceCards = allCards.filter(card => testSequence.includes(card.rank));
          if (sequenceCards.length >= 3) {
            // Gutshot = 4 outs
            maxOuts = Math.max(maxOuts, 4);
          }
        }
      }
    }

    return maxOuts;
  }

  /**
   * Calculate overcard equity (preflop)
   */
  private calculateOvercardEquity(holeCards: Card[]): number {
    const [card1, card2] = holeCards;
    const highCard = Math.max(card1.rank, card2.rank);

    // Higher cards have more equity against unknown hands
    if (highCard >= 12) return 0.8; // Face cards or better
    if (highCard >= 10) return 0.6; // High cards
    if (highCard >= 8) return 0.4;  // Medium cards
    return 0.2; // Low cards
  }

  /**
   * Calculate pair improvement outs
   */
  private calculatePairOuts(holeCards: Card[], communityCards: Card[]): number {
    const allCards = [...holeCards, ...communityCards];
    const ranks = allCards.map(c => c.rank);
    const uniqueRanks = Array.from(new Set(ranks));

    let pairOuts = 0;

    // Count overcards that could pair our hole cards
    holeCards.forEach(card => {
      const remainingCardsOfRank = 4 - ranks.filter(r => r === card.rank).length;
      pairOuts += remainingCardsOfRank;
    });

    return pairOuts;
  }

  /**
   * Calculate preflop hand potential
   */
  private calculatePreflopPotential(holeCards: Card[]): number {
    const [card1, card2] = holeCards;
    const isSuited = card1.suit === card2.suit;
    const isPair = card1.rank === card2.rank;
    const highCard = Math.max(card1.rank, card2.rank);
    const lowCard = Math.min(card1.rank, card2.rank);

    // Premium hands
    if (isPair && highCard >= 11) return 1.5; // Pocket Jacks or better
    if (isPair && highCard >= 8) return 1.3; // Pocket 8s-10s
    if (highCard === 14 && lowCard >= 10) return 1.4; // Ace-high with good kicker
    if (isSuited && highCard >= 12 && lowCard >= 10) return 1.3; // Suited connectors

    // Good hands
    if (isPair) return 1.1; // Any pocket pair
    if (isSuited && Math.abs(highCard - lowCard) <= 4) return 1.2; // Suited connectors/gappers
    if (highCard >= 12) return 1.0; // High cards

    // Medium hands
    if (isSuited) return 0.9; // Any suited
    if (Math.abs(highCard - lowCard) <= 4) return 0.8; // Connectors

    // Weak hands
    return 0.6;
  }

  /**
   * Calculate postflop improvement potential
   */
  private calculatePostflopPotential(holeCards: Card[], communityCards: Card[]): number {
    const allCards = [...holeCards, ...communityCards];
    const currentHand = evaluateHand(holeCards, communityCards);

    // Count outs (cards that could improve our hand significantly)
    let outs = 0;

    // Flush draws
    const suitCounts = allCards.reduce((counts, card) => {
      counts[card.suit] = (counts[card.suit] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const flushSuit = Object.entries(suitCounts).find(([_, count]) => count >= 4)?.[0];
    if (flushSuit && holeCards.some(card => card.suit === flushSuit)) {
      outs += 9; // Flush draw
    }

    // Straight draws
    const ranks = allCards.map(c => c.rank).sort((a, b) => b - a);
    const uniqueRanks = Array.from(new Set(ranks));

    // Check for open-ended straight draws
    for (let i = 0; i < uniqueRanks.length - 3; i++) {
      const sequence = uniqueRanks.slice(i, 4);
      if (sequence.every((rank, idx) => idx === 0 || rank === sequence[idx - 1] - 1)) {
        if (holeCards.some(card => sequence.includes(card.rank))) {
          outs += 8; // Open-ended straight draw
          break;
        }
      }
    }

    // Calculate potential based on outs
    const improvementPotential = Math.min(1.0, outs / 20); // 20 outs = very strong draw

    return 0.8 + improvementPotential * 0.4; // Base 0.8, up to 1.2
  }

  /**
   * Calculate pot odds (ratio of bet to pot)
   */
  private calculatePotOdds(player: Player, currentBet: number, pot: number): number {
    const callAmount = Math.max(0, currentBet - player.currentBet);
    if (callAmount === 0) return 0; // No bet to call

    return callAmount / (pot + callAmount);
  }

  /**
   * Make the final decision based on hand strength, pot odds, and personality
   * Key strategy: Only fold if opponent raises, otherwise check/call to see more cards
   */
  private decideAction(
    handStrength: number,
    potOdds: number,
    callAmount: number,
    playerChips: number,
    phase: GameState['phase'],
    activePlayersCount: number
  ): AIDecisionResult {
    // Adjust thresholds based on personality
    const thresholds = this.getPersonalityThresholds();

    // If we have no chips or can't call, fold
    if (callAmount > playerChips) {
      return { action: 'fold', reasoning: 'Insufficient chips to call' };
    }

    // Key strategy: If no bet to call (check opportunity), always continue to see more cards
    if (callAmount === 0) {
      // No bet - we can check for free
      if (handStrength >= thresholds.raise) {
        // Strong hand - raise to build pot
        const raiseAmount = this.calculateRaiseAmount(callAmount, playerChips, handStrength, phase);
        return {
          action: 'raise',
          amount: raiseAmount,
          reasoning: `Strong hand (${(handStrength * 100).toFixed(0)}% win probability) - raising to build pot`
        };
      } else {
        // Medium/weak hand - check to see next card for free
        return {
          action: 'call', // This is actually a check when callAmount = 0
          reasoning: `Checking to see next card (${(handStrength * 100).toFixed(0)}% win probability)`
        };
      }
    }

    // There is a bet to call - more careful decision making
    // Check if it's profitable to call (hand strength vs pot odds)
    const shouldCall = handStrength >= potOdds;

    console.log('DEBUG decideAction: callAmount =', callAmount, 'phase =', phase, 'handStrength =', handStrength.toFixed(3));

    // Pre-flop specific logic: Be more willing to see the flop
    // Only fold truly terrible hands with large bets to call
    if (phase === 'preflop') {
      // Pre-flop: almost always see the flop unless call is very expensive
      const callPercentage = callAmount / playerChips;
      
      console.log('DEBUG preflop branch: callPercentage =', callPercentage.toFixed(3), 'thresholds.raise =', thresholds.raise);
      
      if (handStrength >= thresholds.raise) {
        console.log('DEBUG: Taking RAISE branch (strong preflop hand)');
        // Strong preflop hand - raise
        const raiseAmount = this.calculateRaiseAmount(callAmount, playerChips, handStrength, phase);
        return {
          action: 'raise',
          amount: raiseAmount,
          reasoning: `Strong preflop hand (${(handStrength * 100).toFixed(0)}% equity) - raising`
        };
      } else if (callPercentage > 0.3 && handStrength < 0.15) {
        console.log('DEBUG: Taking FOLD branch (expensive call + weak hand)');
        // Only fold preflop if call is expensive (>30% of chips) AND hand is truly terrible
        return { action: 'fold', reasoning: `Weak preflop hand and expensive call (${(callPercentage * 100).toFixed(0)}% of chips) - folding` };
      } else {
        console.log('DEBUG: Taking CALL branch (see the flop)');
        // Call to see the flop
        return {
          action: 'call',
          reasoning: `Preflop - calling ${callAmount} to see the flop (${(handStrength * 100).toFixed(0)}% equity)`
        };
      }
    }

    // Post-flop decision logic
    if (handStrength >= thresholds.raise) {
      // Strong hand - raise or call
      if (this.shouldRaise(handStrength, callAmount, playerChips, phase)) {
        const raiseAmount = this.calculateRaiseAmount(callAmount, playerChips, handStrength, phase);
        return {
          action: 'raise',
          amount: raiseAmount,
          reasoning: `Strong hand (${(handStrength * 100).toFixed(0)}% win probability) - raising`
        };
      } else {
        return {
          action: 'call',
          reasoning: `Strong hand (${(handStrength * 100).toFixed(0)}% win probability) - calling`
        };
      }
    } else if (handStrength >= thresholds.call) {
      // Medium hand - generally call to see more cards
      return {
        action: 'call',
        reasoning: `Decent hand (${(handStrength * 100).toFixed(0)}% win probability) - calling to see more cards`
      };
    } else {
      // Weak hand - only fold if pot odds are very unfavorable
      // Otherwise call to see if hand improves
      console.log('DEBUG: Weak hand branch - potOdds =', potOdds.toFixed(3), 'handStrength =', handStrength.toFixed(3));
      if (potOdds > 0.4 || handStrength > 0.1) {
        console.log('DEBUG: Taking CALL branch (pot odds or some chance)');
        // Good pot odds or some chance of improvement
        return {
          action: 'call',
          reasoning: `Weak hand (${(handStrength * 100).toFixed(0)}% win probability) but good pot odds - calling to see more cards`
        };
      } else {
        console.log('DEBUG: Taking FOLD branch (very weak + poor pot odds)');
        // Very unfavorable situation - fold
        return { action: 'fold', reasoning: 'Very weak hand and poor pot odds - folding' };
      }
    }
  }

  /**
   * Get decision thresholds based on AI personality
   */
  private getPersonalityThresholds() {
    switch (this.personality) {
      case 'aggressive':
        return { raise: 0.6, call: 0.3, fold: 0.1 };
      case 'conservative':
        return { raise: 0.8, call: 0.5, fold: 0.2 };
      case 'balanced':
      default:
        return { raise: 0.7, call: 0.4, fold: 0.15 };
    }
  }

  /**
   * Decide whether to raise instead of just calling
   */
  private shouldRaise(handStrength: number, callAmount: number, playerChips: number, phase: GameState['phase']): boolean {
    // Don't raise if we don't have enough chips
    if (callAmount * 3 > playerChips) return false;

    // More likely to raise in early positions/early phases
    const raiseProbability = handStrength * (phase === 'preflop' ? 1.2 : 0.8);

    // Aggressive AI raises more often
    if (this.personality === 'aggressive') {
      return Math.random() < Math.min(0.8, raiseProbability + 0.2);
    } else if (this.personality === 'conservative') {
      return Math.random() < Math.max(0.1, raiseProbability - 0.2);
    } else {
      return Math.random() < raiseProbability;
    }
  }

  /**
   * Calculate appropriate raise amount
   */
  private calculateRaiseAmount(callAmount: number, playerChips: number, handStrength: number, phase: GameState['phase']): number {
    const minRaise = callAmount + 1;
    const maxRaise = Math.min(playerChips - callAmount, callAmount * 4);

    if (maxRaise <= minRaise) return minRaise;

    // Stronger hands raise more
    const raiseMultiplier = 1 + (handStrength * 2);

    // Aggressive AI raises more
    const personalityMultiplier = this.personality === 'aggressive' ? 1.5 :
                                 this.personality === 'conservative' ? 0.7 : 1.0;

    const targetRaise = callAmount * raiseMultiplier * personalityMultiplier;
    let finalRaise = Math.max(minRaise, Math.min(maxRaise, targetRaise));

    // Round to nearest $5 increment, same as human player
    finalRaise = Math.ceil(finalRaise / 5) * 5;

    // Ensure we still meet minimum raise requirements after rounding
    finalRaise = Math.max(minRaise, finalRaise);

    // If rounding made it exceed maxRaise, use maxRaise but still round down to $5
    if (finalRaise > maxRaise) {
      finalRaise = Math.floor(maxRaise / 5) * 5;
      // Ensure we still meet minimum requirements
      finalRaise = Math.max(minRaise, finalRaise);
    }

    return finalRaise;
  }

  /**
   * Check if this is a good bluffing opportunity
   */
  private isBluffOpportunity(phase: GameState['phase'], activePlayersCount: number): boolean {
    // Only bluff in certain situations
    if (phase === 'preflop' || activePlayersCount > 2) return false;

    // Aggressive AI bluffs more
    const bluffChance = this.personality === 'aggressive' ? 0.3 :
                       this.personality === 'conservative' ? 0.05 : 0.15;

    return Math.random() < bluffChance;
  }

  /**
   * Decide whether to attempt a bluff
   */
  private shouldBluff(handStrength: number, phase: GameState['phase'], activePlayersCount: number, potOdds: number): boolean {
    // Only bluff with very weak hands
    if (handStrength > 0.2) return false;

    // Only bluff in late game phases
    if (phase === 'preflop' || phase === 'flop') return false;

    // Only bluff in heads-up situations
    if (activePlayersCount > 2) return false;

    // Only bluff if pot odds are reasonable
    if (potOdds > 0.3) return false;

    // Aggressive AI bluffs more
    const bluffChance = this.personality === 'aggressive' ? 0.2 : 0.05;

    return Math.random() < bluffChance;
  }
}

/**
 * Factory function to create AI instances with different personalities
 */
export const createAI = (personality: AIPersonality = 'balanced'): PokerAI => {
  return new PokerAI(personality);
};

/**
 * Utility function to get AI decision for a player
 */
export const getAIDecision = (
  player: Player,
  communityCards: Card[],
  currentBet: number,
  pot: number,
  gamePhase: GameState['phase'],
  activePlayersCount: number,
  personality: AIPersonality = 'balanced'
): AIDecisionResult => {
  const ai = createAI(personality);
  return ai.makeDecision(player, communityCards, currentBet, pot, gamePhase, activePlayersCount);
};