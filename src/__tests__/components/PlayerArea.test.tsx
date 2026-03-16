/**
 * PRD: ui-ux/layout-and-components.md (LC-040–LC-048)
 * PlayerArea: name, chips, position badges, turn indicator, last action, cards
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerArea from '../../components/PlayerArea';
import { Player } from '../../game/types';

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'human',
  name: 'TestPlayer',
  cards: [],
  chips: 100,
  isHuman: true,
  isSmallBlind: false,
  isBigBlind: true,
  currentBet: 10,
  hasFolded: false,
  hasActedThisRound: false,
  ...overrides
});

describe('PlayerArea component (LC-040–LC-048)', () => {
  test('renders player name', () => {
    render(<PlayerArea player={createPlayer()} />);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
  });

  test('renders chip amount', () => {
    render(<PlayerArea player={createPlayer({ chips: 85 })} />);
    expect(screen.getByText('$85')).toBeInTheDocument();
  });

  test('renders current bet when > 0', () => {
    render(<PlayerArea player={createPlayer({ currentBet: 20 })} />);
    expect(screen.getByText('$20')).toBeInTheDocument();
  });

  test('renders position badges for Small Blind and Big Blind', () => {
    render(<PlayerArea player={createPlayer({ isSmallBlind: true, isBigBlind: true })} />);
    expect(screen.getByText('Small Blind')).toBeInTheDocument();
    expect(screen.getByText('Big Blind')).toBeInTheDocument();
  });

  test('renders turn indicator when isCurrentPlayer and not folded', () => {
    render(<PlayerArea player={createPlayer()} isCurrentPlayer />);
    expect(screen.getByText('TURN')).toBeInTheDocument();
  });

  test('does not render turn indicator when folded', () => {
    render(<PlayerArea player={createPlayer({ hasFolded: true })} isCurrentPlayer />);
    expect(screen.queryByText('TURN')).not.toBeInTheDocument();
  });

  test('shows (FOLDED) next to name when hasFolded', () => {
    render(<PlayerArea player={createPlayer({ hasFolded: true })} />);
    expect(screen.getByText(/FOLDED/)).toBeInTheDocument();
  });

  test('renders player chips', () => {
    render(<PlayerArea player={createPlayer({ chips: 500 })} />);
    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  test('renders 2 hole cards when provided (LC-046)', () => {
    const player = createPlayer({
      cards: [
        { suit: 'hearts', rank: 14, displayRank: 'A' },
        { suit: 'spades', rank: 13, displayRank: 'K' }
      ]
    });
    const { container } = render(<PlayerArea player={player} />);
    const cards = container.querySelectorAll('.card');
    expect(cards.length).toBe(2);
  });

  test('showdown mode adds showdown-cards class (LC-047)', () => {
    const player = createPlayer({
      cards: [
        { suit: 'hearts', rank: 14, displayRank: 'A' },
        { suit: 'spades', rank: 13, displayRank: 'K' }
      ]
    });
    const { container } = render(<PlayerArea player={player} isShowdown />);
    expect(container.querySelector('.showdown-cards')).toBeInTheDocument();
  });

  test('showdown hover callbacks fire for non-folded player (LC-047)', () => {
    const onHover = jest.fn();
    const onLeave = jest.fn();
    const player = createPlayer({
      cards: [
        { suit: 'hearts', rank: 14, displayRank: 'A' },
        { suit: 'spades', rank: 13, displayRank: 'K' }
      ]
    });
    const { container } = render(
      <PlayerArea player={player} isShowdown onHandHover={onHover} onHandLeave={onLeave} />
    );
    const cardsDiv = container.querySelector('.showdown-cards');
    expect(cardsDiv).toBeInTheDocument();
    if (cardsDiv) {
      fireEvent.mouseEnter(cardsDiv);
      fireEvent.mouseLeave(cardsDiv);
      expect(onHover).toHaveBeenCalled();
      expect(onLeave).toHaveBeenCalled();
    }
  });

  test('used hole cards get highlighted, unused get dimmed during showdown (LC-048)', () => {
    const player = createPlayer({
      cards: [
        { suit: 'hearts', rank: 14, displayRank: 'A' },
        { suit: 'spades', rank: 13, displayRank: 'K' }
      ]
    });
    const { container } = render(
      <PlayerArea player={player} isShowdown isHovered usedHoleCardIndices={[0]} />
    );
    const cards = container.querySelectorAll('.card');
    expect(cards.length).toBe(2);
    const firstCardHighlighted = cards[0].classList.contains('card--highlighted');
    const secondCardDimmed = cards[1].classList.contains('card--dimmed');
    expect(firstCardHighlighted).toBe(true);
    expect(secondCardDimmed).toBe(true);
  });

  test('AI cards shown as hidden during non-showdown phase', () => {
    const player = createPlayer({
      id: 'ai',
      isHuman: false,
      cards: [
        { suit: 'hearts', rank: 14, displayRank: 'A' },
        { suit: 'spades', rank: 13, displayRank: 'K' }
      ]
    });
    const { container } = render(<PlayerArea player={player} gamePhase="preflop" />);
    const hiddenCards = container.querySelectorAll('.card--hidden');
    expect(hiddenCards.length).toBe(2);
  });

  test('current player area has current-player class', () => {
    const { container } = render(<PlayerArea player={createPlayer()} isCurrentPlayer />);
    expect(container.querySelector('.current-player')).toBeInTheDocument();
  });

  test('folded area has folded class', () => {
    const { container } = render(<PlayerArea player={createPlayer({ hasFolded: true })} />);
    expect(container.querySelector('.folded')).toBeInTheDocument();
  });
});
