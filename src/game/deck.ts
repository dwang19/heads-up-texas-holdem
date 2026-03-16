import { Card } from './types';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck(): void {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 11=J, 12=Q, 13=K, 14=A
    const displayRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    for (const suit of suits) {
      for (let i = 0; i < ranks.length; i++) {
        this.cards.push({
          suit,
          rank: ranks[i],
          displayRank: displayRanks[i]
        });
      }
    }
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  dealCard(): Card | undefined {
    return this.cards.pop();
  }

  dealCards(count: number): Card[] {
    const dealtCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.dealCard();
      if (card) {
        dealtCards.push(card);
      }
    }
    return dealtCards;
  }

  getRemainingCards(): number {
    return this.cards.length;
  }

  reset(): void {
    this.cards = [];
    this.initializeDeck();
  }

  // For debugging/testing
  getCards(): Card[] {
    return [...this.cards];
  }
}

export const createDeck = (): Deck => {
  const deck = new Deck();
  deck.shuffle();
  return deck;
};

export const getSuitSymbol = (suit: Card['suit']): string => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
};

export const getSuitColor = (suit: Card['suit']): string => {
  return (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
};