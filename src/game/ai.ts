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
 * Personality profile — controls how the AI plays across all situations
 */
interface PersonalityProfile {
  raiseThreshold: number;      // Hand strength needed to value-raise
  callThreshold: number;       // Hand strength needed to call a bet
  bluffFrequency: number;      // 0-1, how often to bluff when checking
  cBetFrequency: number;       // 0-1, continuation bet frequency
  sizingMultiplier: number;    // Bet sizing multiplier (1.0 = standard)
  preflopOpenRange: number;    // 0-1, fraction of hands to open-raise preflop
}

const PERSONALITY_PROFILES: Record<AIPersonality, PersonalityProfile> = {
  aggressive: {
    raiseThreshold: 0.55,
    callThreshold: 0.25,
    bluffFrequency: 0.20,
    cBetFrequency: 0.75,
    sizingMultiplier: 1.2,
    preflopOpenRange: 0.55,
  },
  balanced: {
    raiseThreshold: 0.60,
    callThreshold: 0.30,
    bluffFrequency: 0.12,
    cBetFrequency: 0.65,
    sizingMultiplier: 1.0,
    preflopOpenRange: 0.45,
  },
  conservative: {
    raiseThreshold: 0.70,
    callThreshold: 0.40,
    bluffFrequency: 0.05,
    cBetFrequency: 0.50,
    sizingMultiplier: 0.8,
    preflopOpenRange: 0.30,
  },
};

// Big blind amount (used for preflop sizing)
const BIG_BLIND = 10;

/**
 * AI decision making system for Texas Hold'em poker
 * Features: preflop hand charts, pot-relative sizing, position awareness,
 * bluffing, continuation bets, all-in defense, and personality profiles.
 */
export class PokerAI {
  private personality: AIPersonality;
  private profile: PersonalityProfile;

  constructor(personality: AIPersonality = 'balanced') {
    this.personality = personality;
    this.profile = PERSONALITY_PROFILES[personality];
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
    activePlayersCount: number,
    opponentChips?: number,
    isInPosition?: boolean,
    wasAggressor?: boolean
  ): AIDecisionResult {
    if (!player.cards || player.cards.length === 0) {
      console.warn('AI: No cards available, defaulting to call');
      return { action: 'call', reasoning: 'No cards to evaluate - defaulting to call' };
    }

    // Evaluate hand strength (0-1 scale)
    const handStrength = this.evaluateHandStrength(player.cards, communityCards, gamePhase, isInPosition);

    // Calculate call amount needed
    const callAmount = Math.max(0, currentBet - player.currentBet);

    // Calculate pot odds
    const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;

    // DEBUG logging
    console.log('=== AI DECISION DEBUG ===');
    console.log('Player cards:', player.cards.map(c => `${c.displayRank}${c.suit}`).join(', '));
    console.log('Community cards:', communityCards.map(c => `${c.displayRank}${c.suit}`).join(', ') || 'none');
    console.log('Game phase:', gamePhase);
    console.log('Current bet to match:', currentBet, '| Call amount:', callAmount);
    console.log('Player chips:', player.chips, '| Pot:', pot);
    console.log('Hand strength:', handStrength.toFixed(3), '| Pot odds:', potOdds.toFixed(3));
    console.log('Personality:', this.personality, '| In position:', isInPosition ?? 'unknown');

    const decision = this.decideAction(
      handStrength, potOdds, callAmount, player.chips, pot,
      gamePhase, activePlayersCount, player.cards, communityCards,
      opponentChips, isInPosition, wasAggressor
    );

    console.log('DECISION:', decision.action, decision.amount ? `$${decision.amount}` : '', '-', decision.reasoning);
    console.log('=========================');

    return decision;
  }

  // ─── HAND STRENGTH EVALUATION ──────────────────────────────────

  /**
   * Evaluate hand strength on a 0-1 scale.
   * Preflop: uses starting hand chart.
   * Postflop: uses rank-based equity + improvement potential.
   */
  private evaluateHandStrength(
    holeCards: Card[],
    communityCards: Card[],
    phase: GameState['phase'],
    isInPosition?: boolean
  ): number {
    if (holeCards.length !== 2) return 0;

    // Preflop: use starting hand chart instead of generic rank-based eval
    if (phase === 'preflop') {
      return this.evaluatePreflopStrength(holeCards, isInPosition ?? false);
    }

    // Postflop: combine current hand equity + improvement potential
    let availableCards = [...holeCards];
    let remainingCards = 0;

    switch (phase) {
      case 'flop':
        availableCards = [...holeCards, ...communityCards.slice(0, 3)];
        remainingCards = 2;
        break;
      case 'turn':
        availableCards = [...holeCards, ...communityCards.slice(0, 4)];
        remainingCards = 1;
        break;
      case 'river':
      case 'showdown':
        availableCards = [...holeCards, ...communityCards];
        remainingCards = 0;
        break;
    }

    const currentHand = evaluateHand(holeCards, availableCards.slice(2));
    const baseEquity = this.calculateCurrentEquity(currentHand.rank, phase);
    const improvementEquity = this.calculateImprovementEquity(holeCards, communityCards, phase, remainingCards);
    const totalEquity = this.combineEquity(baseEquity, improvementEquity, remainingCards);

    return Math.min(1.0, Math.max(0.0, totalEquity));
  }

  /**
   * Preflop starting hand chart — returns 0-1 strength based on hand quality.
   * Much more accurate than the generic rank-based eval for preflop play.
   */
  private evaluatePreflopStrength(holeCards: Card[], isInPosition: boolean): number {
    const [card1, card2] = holeCards;
    const highRank = Math.max(card1.rank, card2.rank);
    const lowRank = Math.min(card1.rank, card2.rank);
    const isSuited = card1.suit === card2.suit;
    const isPair = card1.rank === card2.rank;
    const gap = highRank - lowRank;

    let strength: number;

    if (isPair) {
      // Pocket pairs
      if (highRank >= 13) strength = 0.95;       // AA, KK
      else if (highRank === 12) strength = 0.90;  // QQ
      else if (highRank >= 10) strength = 0.83;   // JJ, TT
      else if (highRank >= 7) strength = 0.70;    // 99-77
      else strength = 0.55;                        // 66-22
    } else if (highRank === 14) {
      // Ace-x hands
      if (lowRank >= 13) strength = isSuited ? 0.92 : 0.88; // AK
      else if (lowRank >= 12) strength = isSuited ? 0.85 : 0.80; // AQ
      else if (lowRank >= 11) strength = isSuited ? 0.80 : 0.72; // AJ
      else if (lowRank >= 10) strength = isSuited ? 0.75 : 0.65; // AT
      else if (isSuited) strength = 0.60 + (lowRank - 2) * 0.01; // A2s-A9s
      else strength = 0.40 + (lowRank - 2) * 0.02; // A2o-A9o
    } else if (highRank >= 11 && lowRank >= 10) {
      // Broadway hands (KQ, KJ, QJ, KT, QT, JT)
      if (gap <= 1) strength = isSuited ? 0.72 : 0.62; // KQ, QJ, JT
      else strength = isSuited ? 0.60 : 0.50;            // KJ, KT, QT
    } else if (isSuited && gap <= 2 && highRank >= 5) {
      // Suited connectors & 1-gappers (54s-T9s, 64s-T8s)
      strength = 0.45 + (highRank - 5) * 0.03;
    } else if (isSuited && gap <= 3 && highRank >= 6) {
      // Suited 2-gappers
      strength = 0.38 + (highRank - 6) * 0.02;
    } else if (!isSuited && gap <= 1 && highRank >= 6) {
      // Offsuit connectors (65o-T9o)
      strength = 0.35 + (highRank - 6) * 0.03;
    } else if (isSuited) {
      // Other suited hands
      strength = 0.30 + highRank * 0.01;
    } else {
      // Weak/trash hands — in HU, even the worst hand has ~30% equity
      strength = 0.20 + highRank * 0.005;
    }

    // Position bonus: in position can play wider range profitably
    if (isInPosition) {
      strength += 0.05;
    }

    return Math.min(1.0, Math.max(0.0, strength));
  }

  /**
   * Calculate equity from current hand rank (postflop)
   */
  private calculateCurrentEquity(handRank: number, phase: GameState['phase']): number {
    const equityMap: Record<number, number> = {
      10: 1.0,   // Royal Flush
      9: 0.98,   // Straight Flush
      8: 0.95,   // Four of a Kind
      7: 0.90,   // Full House
      6: 0.85,   // Flush
      5: 0.75,   // Straight
      4: 0.65,   // Three of a Kind
      3: 0.55,   // Two Pair
      2: 0.48,   // Pair (strong in HU)
      1: 0.25    // High Card (weak — likely losing)
    };

    const baseEquity = equityMap[handRank] || 0.35;

    const phaseMultipliers: Record<GameState['phase'], number> = {
      'waiting': 0.5,
      'preflop': 0.6,  // Not used (preflop uses hand chart)
      'flop': 0.85,
      'turn': 0.9,
      'river': 1.0,
      'showdown': 1.0
    };

    return baseEquity * (phaseMultipliers[phase] || 1.0);
  }

  /**
   * Calculate equity from hand improvement potential (draws)
   */
  private calculateImprovementEquity(
    holeCards: Card[],
    communityCards: Card[],
    phase: GameState['phase'],
    remainingCards: number
  ): number {
    if (remainingCards === 0) return 0;

    let improvementEquity = 0;

    // Flush draw potential
    const flushOuts = this.calculateFlushOuts(holeCards, communityCards, phase);
    if (flushOuts > 0) {
      improvementEquity += Math.min(0.25, flushOuts / 47 * 0.3);
    }

    // Straight draw potential
    const straightOuts = this.calculateStraightOuts(holeCards, communityCards, phase);
    if (straightOuts > 0) {
      improvementEquity += Math.min(0.20, straightOuts / 47 * 0.25);
    }

    // Overcard potential (preflop)
    if (phase === 'preflop') {
      const overcardEquity = this.calculateOvercardEquity(holeCards);
      improvementEquity += overcardEquity * 0.15;
    }

    // Pair improvement potential (flop/turn)
    if (phase === 'flop' || phase === 'turn') {
      const pairOuts = this.calculatePairOuts(holeCards, communityCards);
      improvementEquity += Math.min(0.15, pairOuts / 47 * 0.2);
    }

    // Scale by remaining cards
    const cardMultiplier = remainingCards / 5;
    improvementEquity *= cardMultiplier;

    return Math.min(0.4, improvementEquity);
  }

  private combineEquity(currentEquity: number, improvementEquity: number, remainingCards: number): number {
    if (remainingCards === 0) return currentEquity;
    // Additive: made hand equity + draw potential (don't penalize made hands)
    return Math.min(1.0, currentEquity + improvementEquity);
  }

  // ─── DRAW CALCULATIONS ─────────────────────────────────────────

  private calculateFlushOuts(holeCards: Card[], communityCards: Card[], phase: GameState['phase']): number {
    if (phase === 'preflop') {
      return holeCards[0].suit === holeCards[1].suit ? 11 : 0;
    }

    const allCards = [...holeCards, ...communityCards];
    const suitCounts = allCards.reduce((counts, card) => {
      counts[card.suit] = (counts[card.suit] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const maxSuit = Math.max(...Object.values(suitCounts));
    return maxSuit === 4 ? 9 : 0;
  }

  private calculateStraightOuts(holeCards: Card[], communityCards: Card[], phase: GameState['phase']): number {
    if (phase === 'preflop') {
      const gap = Math.abs(holeCards[0].rank - holeCards[1].rank);
      if (holeCards[0].rank === holeCards[1].rank) return 6;
      return gap <= 4 ? 8 : 0;
    }

    const allCards = [...holeCards, ...communityCards];
    const ranks = Array.from(new Set(allCards.map(c => c.rank))).sort((a, b) => a - b);
    let maxOuts = 0;

    for (let i = 0; i < ranks.length - 3; i++) {
      const seq = ranks.slice(i, 4);
      if (seq.every((r, idx) => idx === 0 || r === seq[idx - 1] + 1)) {
        if (allCards.filter(c => seq.includes(c.rank)).length >= 3) {
          maxOuts = Math.max(maxOuts, 8);
        }
      }
    }

    if (maxOuts === 0) {
      for (let i = 0; i < ranks.length - 3; i++) {
        const seq = ranks.slice(i, 4);
        for (let gap = 0; gap < 3; gap++) {
          const test = [...seq];
          test.splice(gap, 1);
          if (test.length === 3 && test.every((r, idx) => idx === 0 || r === test[idx - 1] + 1)) {
            if (allCards.filter(c => test.includes(c.rank)).length >= 3) {
              maxOuts = Math.max(maxOuts, 4);
            }
          }
        }
      }
    }

    return maxOuts;
  }

  private calculateOvercardEquity(holeCards: Card[]): number {
    const highCard = Math.max(holeCards[0].rank, holeCards[1].rank);
    if (highCard >= 12) return 0.8;
    if (highCard >= 10) return 0.6;
    if (highCard >= 8) return 0.4;
    return 0.2;
  }

  private calculatePairOuts(holeCards: Card[], communityCards: Card[]): number {
    const allRanks = [...holeCards, ...communityCards].map(c => c.rank);
    let pairOuts = 0;
    holeCards.forEach(card => {
      pairOuts += 4 - allRanks.filter(r => r === card.rank).length;
    });
    return pairOuts;
  }

  // ─── DECISION ENGINE ───────────────────────────────────────────

  /**
   * Core decision logic — fold, call/check, or raise
   */
  private decideAction(
    handStrength: number,
    potOdds: number,
    callAmount: number,
    playerChips: number,
    pot: number,
    phase: GameState['phase'],
    activePlayersCount: number,
    holeCards: Card[],
    communityCards: Card[],
    opponentChips?: number,
    isInPosition?: boolean,
    wasAggressor?: boolean
  ): AIDecisionResult {
    const profile = this.profile;

    // Can't afford to call
    if (callAmount > playerChips) {
      return { action: 'fold', reasoning: 'Insufficient chips to call' };
    }

    // ── ALL-IN / LARGE BET DEFENSE ──
    // When facing a large bet (≥50% of stack), use relaxed thresholds
    const isLargeBet = callAmount >= playerChips * 0.5 && callAmount > 0;
    if (isLargeBet) {
      return this.handleLargeBet(handStrength, callAmount, playerChips, pot, phase);
    }

    // ── NO BET TO CALL (CHECK OPPORTUNITY) ──
    if (callAmount === 0) {
      return this.handleCheckOpportunity(
        handStrength, playerChips, pot, phase,
        holeCards, communityCards, opponentChips, isInPosition, wasAggressor
      );
    }

    // ── PREFLOP WITH BET TO CALL ──
    if (phase === 'preflop') {
      return this.handlePreflopBet(handStrength, callAmount, playerChips, pot, opponentChips);
    }

    // ── POSTFLOP WITH BET TO CALL ──
    return this.handlePostflopBet(
      handStrength, potOdds, callAmount, playerChips, pot, phase,
      holeCards, communityCards, opponentChips
    );
  }

  /**
   * Handle facing a large bet or all-in — use relaxed thresholds to avoid
   * folding decent hands to aggression.
   */
  private handleLargeBet(
    handStrength: number,
    callAmount: number,
    playerChips: number,
    pot: number,
    phase: GameState['phase']
  ): AIDecisionResult {
    const potOdds = callAmount / (pot + callAmount);

    console.log('DEBUG: Large bet defense — handStrength:', handStrength.toFixed(3),
      'potOdds:', potOdds.toFixed(3), 'callAmount:', callAmount);

    // Strong hand: always call (or raise if we can)
    if (handStrength >= this.profile.raiseThreshold) {
      return {
        action: 'call',
        reasoning: `Strong hand (${(handStrength * 100).toFixed(0)}%) — calling large bet`
      };
    }

    // Decent hand (pair or better): call if hand strength > 0.35
    if (handStrength >= 0.35) {
      return {
        action: 'call',
        reasoning: `Decent hand (${(handStrength * 100).toFixed(0)}%) — calling large bet, too strong to fold`
      };
    }

    // Marginal hand with good pot odds: call
    if (handStrength >= 0.20 && potOdds < 0.35) {
      return {
        action: 'call',
        reasoning: `Marginal hand but good pot odds (${(potOdds * 100).toFixed(0)}%) — calling`
      };
    }

    // Truly weak hand facing all-in: fold
    return {
      action: 'fold',
      reasoning: `Weak hand (${(handStrength * 100).toFixed(0)}%) facing large bet — folding`
    };
  }

  /**
   * Handle check opportunity — decide whether to bet/raise or check
   */
  private handleCheckOpportunity(
    handStrength: number,
    playerChips: number,
    pot: number,
    phase: GameState['phase'],
    holeCards: Card[],
    communityCards: Card[],
    opponentChips?: number,
    isInPosition?: boolean,
    wasAggressor?: boolean
  ): AIDecisionResult {
    // Strong hand: raise to build pot
    if (handStrength >= this.profile.raiseThreshold) {
      const raiseAmount = this.calculateRaiseAmount(0, playerChips, handStrength, phase, pot, opponentChips);
      return {
        action: 'raise',
        amount: raiseAmount,
        reasoning: `Strong hand (${(handStrength * 100).toFixed(0)}%) — raising to build pot`
      };
    }

    // Continuation bet: only c-bet on flop if we were the preflop aggressor
    if (phase === 'flop' && wasAggressor && Math.random() < this.profile.cBetFrequency) {
      const cBetAmount = this.calculateRaiseAmount(0, playerChips, 0.5, phase, pot, opponentChips);
      return {
        action: 'raise',
        amount: cBetAmount,
        reasoning: `Continuation bet on flop (${(handStrength * 100).toFixed(0)}% equity)`
      };
    }

    // Semi-bluff: raise with draws on flop/turn
    if ((phase === 'flop' || phase === 'turn') && handStrength < this.profile.callThreshold) {
      const improvementEquity = this.calculateImprovementEquity(
        holeCards, communityCards, phase, phase === 'flop' ? 2 : 1
      );
      if (improvementEquity > 0.15 && Math.random() < 0.6) {
        const raiseAmount = this.calculateRaiseAmount(0, playerChips, 0.45, phase, pot, opponentChips);
        return {
          action: 'raise',
          amount: raiseAmount,
          reasoning: `Semi-bluff with draw potential (${(improvementEquity * 100).toFixed(0)}% improvement equity)`
        };
      }
    }

    // Pure bluff: occasionally raise with weak hands
    if (handStrength < 0.25 && Math.random() < this.profile.bluffFrequency) {
      const bluffAmount = this.calculateRaiseAmount(0, playerChips, 0.4, phase, pot, opponentChips);
      return {
        action: 'raise',
        amount: bluffAmount,
        reasoning: `Bluff raise (${(handStrength * 100).toFixed(0)}% equity — representing strength)`
      };
    }

    // Check-raise with strong hands out of position
    if (isInPosition === false && handStrength >= this.profile.callThreshold &&
        handStrength < this.profile.raiseThreshold && Math.random() < 0.15) {
      // Check to potentially check-raise if opponent bets
      return {
        action: 'call', // check
        reasoning: `Checking with decent hand OOP (${(handStrength * 100).toFixed(0)}%) — trap potential`
      };
    }

    // Default: check
    return {
      action: 'call',
      reasoning: `Checking (${(handStrength * 100).toFixed(0)}% equity)`
    };
  }

  /**
   * Handle preflop bet — use starting hand chart ranges
   */
  private handlePreflopBet(
    handStrength: number,
    callAmount: number,
    playerChips: number,
    pot: number,
    opponentChips?: number
  ): AIDecisionResult {
    const callPercentage = callAmount / playerChips;

    console.log('DEBUG preflop: handStrength:', handStrength.toFixed(3),
      'callPercentage:', callPercentage.toFixed(3));

    // Premium hands: 3-bet / re-raise
    if (handStrength >= 0.85) {
      const raiseAmount = this.calculateRaiseAmount(callAmount, playerChips, handStrength, 'preflop', pot, opponentChips);
      return {
        action: 'raise',
        amount: raiseAmount,
        reasoning: `Premium preflop hand (${(handStrength * 100).toFixed(0)}%) — raising`
      };
    }

    // Strong hands: raise or call depending on position/sizing
    if (handStrength >= 0.65) {
      // Raise with top of range, call with bottom
      if (handStrength >= this.profile.raiseThreshold || Math.random() < 0.5) {
        const raiseAmount = this.calculateRaiseAmount(callAmount, playerChips, handStrength, 'preflop', pot, opponentChips);
        return {
          action: 'raise',
          amount: raiseAmount,
          reasoning: `Strong preflop hand (${(handStrength * 100).toFixed(0)}%) — raising`
        };
      }
      return {
        action: 'call',
        reasoning: `Strong preflop hand (${(handStrength * 100).toFixed(0)}%) — calling`
      };
    }

    // Playable hands: call if price is right
    if (handStrength >= 0.40) {
      if (callPercentage > 0.3) {
        return {
          action: 'fold',
          reasoning: `Marginal hand (${(handStrength * 100).toFixed(0)}%) — too expensive to call (${(callPercentage * 100).toFixed(0)}% of stack)`
        };
      }
      return {
        action: 'call',
        reasoning: `Playable preflop hand (${(handStrength * 100).toFixed(0)}%) — calling to see flop`
      };
    }

    // Weak hands: only call if very cheap (HU — wider calling range)
    if (handStrength >= 0.20 && callPercentage < 0.15) {
      return {
        action: 'call',
        reasoning: `Speculative hand (${(handStrength * 100).toFixed(0)}%) — cheap call to see flop`
      };
    }

    // Trash: fold
    return {
      action: 'fold',
      reasoning: `Weak preflop hand (${(handStrength * 100).toFixed(0)}%) — folding`
    };
  }

  /**
   * Handle postflop bet — standard pot odds + hand strength evaluation
   */
  private handlePostflopBet(
    handStrength: number,
    potOdds: number,
    callAmount: number,
    playerChips: number,
    pot: number,
    phase: GameState['phase'],
    holeCards: Card[],
    communityCards: Card[],
    opponentChips?: number
  ): AIDecisionResult {
    const profile = this.profile;

    // Strong hand: raise for value
    if (handStrength >= profile.raiseThreshold) {
      if (this.shouldRaise(handStrength, callAmount, playerChips, phase)) {
        const raiseAmount = this.calculateRaiseAmount(callAmount, playerChips, handStrength, phase, pot, opponentChips);
        return {
          action: 'raise',
          amount: raiseAmount,
          reasoning: `Strong hand (${(handStrength * 100).toFixed(0)}%) — raising for value`
        };
      }
      return {
        action: 'call',
        reasoning: `Strong hand (${(handStrength * 100).toFixed(0)}%) — calling`
      };
    }

    // Medium hand: call to see more cards
    if (handStrength >= profile.callThreshold) {
      return {
        action: 'call',
        reasoning: `Decent hand (${(handStrength * 100).toFixed(0)}%) — calling`
      };
    }

    // Weak hand with draw: semi-bluff raise sometimes
    if (phase !== 'river') {
      const improvementEquity = this.calculateImprovementEquity(
        holeCards, communityCards, phase, phase === 'flop' ? 2 : 1
      );
      if (improvementEquity > 0.15) {
        // Good draw — call or semi-bluff raise
        if (Math.random() < 0.3) {
          const raiseAmount = this.calculateRaiseAmount(callAmount, playerChips, 0.45, phase, pot, opponentChips);
          return {
            action: 'raise',
            amount: raiseAmount,
            reasoning: `Semi-bluff raise with draw (${(improvementEquity * 100).toFixed(0)}% improvement equity)`
          };
        }
        return {
          action: 'call',
          reasoning: `Calling with draw potential (${(improvementEquity * 100).toFixed(0)}% improvement equity)`
        };
      }
    }

    // Weak hand: consider pot odds (stricter on river since no draws)
    const oddsThreshold = phase === 'river' ? potOdds : potOdds * 0.8;
    if (handStrength > oddsThreshold) {
      return {
        action: 'call',
        reasoning: `Weak hand (${(handStrength * 100).toFixed(0)}%) but decent pot odds — calling`
      };
    }

    // Very weak: fold
    return {
      action: 'fold',
      reasoning: `Weak hand (${(handStrength * 100).toFixed(0)}%) with poor pot odds — folding`
    };
  }

  // ─── BET SIZING ────────────────────────────────────────────────

  /**
   * Calculate raise amount using pot-relative sizing.
   * Returns the raise INCREMENT (added on top of call amount), not the total bet.
   */
  private calculateRaiseAmount(
    callAmount: number,
    playerChips: number,
    handStrength: number,
    phase: GameState['phase'],
    pot: number,
    opponentChips?: number
  ): number {
    const effectiveStack = opponentChips !== undefined
      ? Math.min(playerChips, opponentChips)
      : playerChips;
    const spr = pot > 0 ? effectiveStack / pot : 10;

    let targetRaise: number;

    if (phase === 'preflop') {
      // Preflop sizing: 2.5-3x BB for opens, 3x for 3-bets
      if (callAmount <= BIG_BLIND) {
        // Opening raise: 2.5-3x BB
        targetRaise = BIG_BLIND * (2.5 + handStrength * 0.5);
      } else {
        // 3-bet: ~3x the raise
        targetRaise = callAmount * 3;
      }
    } else {
      // Postflop sizing: pot-relative
      const currentPot = pot + callAmount; // Pot after calling
      let potFraction: number;

      if (handStrength >= 0.7) {
        // Value bet: 55-75% pot
        potFraction = 0.55 + handStrength * 0.2;
      } else if (handStrength >= 0.4) {
        // Medium/semi-bluff: 40-55% pot
        potFraction = 0.40 + (handStrength - 0.4) * 0.5;
      } else {
        // Bluff: 33-45% pot
        potFraction = 0.33 + handStrength * 0.5;
      }

      targetRaise = currentPot * potFraction;

      // Short-stack adjustment: if SPR < 2, just go all-in with decent hands
      if (spr < 2 && handStrength >= 0.40) {
        targetRaise = playerChips - callAmount; // All-in
      }
    }

    // Apply personality sizing multiplier
    targetRaise *= this.profile.sizingMultiplier;

    // Round to $5 increments
    let finalRaise = Math.ceil(targetRaise / 5) * 5;

    // Enforce minimum $5 raise
    finalRaise = Math.max(5, finalRaise);

    // Cap at available chips
    const maxRaise = playerChips - callAmount;
    if (finalRaise > maxRaise) {
      finalRaise = Math.floor(maxRaise / 5) * 5;
      finalRaise = Math.max(5, finalRaise);
    }

    // If we can't even raise $5, just go all-in with what we have
    if (finalRaise > maxRaise) {
      finalRaise = maxRaise;
    }

    return finalRaise;
  }

  /**
   * Decide whether to raise instead of just calling (for strong hands)
   */
  private shouldRaise(
    handStrength: number,
    callAmount: number,
    playerChips: number,
    phase: GameState['phase']
  ): boolean {
    // Don't raise if we barely have chips
    if (callAmount * 2 > playerChips) return false;

    const raiseProbability = handStrength * (phase === 'preflop' ? 1.2 : 0.9);

    if (this.personality === 'aggressive') {
      return Math.random() < Math.min(0.85, raiseProbability + 0.2);
    } else if (this.personality === 'conservative') {
      return Math.random() < Math.max(0.15, raiseProbability - 0.15);
    }
    return Math.random() < raiseProbability;
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
  personality: AIPersonality = 'balanced',
  opponentChips?: number,
  isInPosition?: boolean,
  wasAggressor?: boolean
): AIDecisionResult => {
  const ai = createAI(personality);
  return ai.makeDecision(player, communityCards, currentBet, pot, gamePhase, activePlayersCount, opponentChips, isInPosition, wasAggressor);
};
