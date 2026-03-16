/**
 * PRD: ui-ux/layout-and-components.md (LC-050–LC-060), visual-design (VD-020–VD-026)
 * Card: face-up, face-down, empty, deck, burned, flipping, sizes, highlighted, dimmed
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../../components/Card';
import { Card as CardType } from '../../game/types';

const mockCard: CardType = {
  suit: 'hearts',
  rank: 14,
  displayRank: 'A'
};

describe('Card component (LC-050–LC-060)', () => {
  test('renders rank and suit when face-up', () => {
    const { container } = render(<Card card={mockCard} />);
    const rankEl = container.querySelector('.card__rank');
    const suitEl = container.querySelector('.card__suit');
    expect(rankEl).toBeInTheDocument();
    expect(rankEl).toHaveTextContent('A');
    expect(suitEl).toBeInTheDocument();
    expect(suitEl).toHaveTextContent('♥');
  });

  test('renders hidden (face-down) when hidden prop is true', () => {
    const { container } = render(<Card card={mockCard} hidden />);
    expect(container.querySelector('.card--hidden')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  test('renders empty state when card is null and not burned', () => {
    const { container } = render(<Card card={null} />);
    expect(container.querySelector('.card--empty')).toBeInTheDocument();
  });

  test('renders deck style when isDeck is true', () => {
    const { container } = render(<Card card={null} isDeck />);
    expect(container.querySelector('.card--deck')).toBeInTheDocument();
  });

  test('applies size class medium by default', () => {
    const { container } = render(<Card card={mockCard} />);
    expect(container.querySelector('.card--medium')).toBeInTheDocument();
  });

  test('applies size class when size is small or large', () => {
    const { container: c1 } = render(<Card card={mockCard} size="small" />);
    const { container: c2 } = render(<Card card={mockCard} size="large" />);
    expect(c1.querySelector('.card--small')).toBeInTheDocument();
    expect(c2.querySelector('.card--large')).toBeInTheDocument();
  });

  test('applies highlighted class when isHighlighted', () => {
    const { container } = render(<Card card={mockCard} isHighlighted highlightColor="green" />);
    expect(container.querySelector('.card--highlighted')).toBeInTheDocument();
    expect(container.querySelector('.card--highlight-green')).toBeInTheDocument();
  });

  test('applies dimmed class when className includes card--dimmed', () => {
    const { container } = render(<Card card={mockCard} className="card--dimmed" />);
    expect(container.querySelector('.card--dimmed')).toBeInTheDocument();
  });

  test('renders burned state with card as face-down (LC-055)', () => {
    const { container } = render(<Card card={mockCard} isBurned />);
    expect(container.querySelector('.card--hidden')).toBeInTheDocument();
  });

  test('renders burned state without card as empty (LC-055)', () => {
    const { container } = render(<Card card={null} isBurned />);
    expect(container.querySelector('.card--empty')).toBeInTheDocument();
  });

  test('renders flipping state with flip container (LC-056)', () => {
    const { container } = render(<Card card={mockCard} isFlipping />);
    expect(container.querySelector('.card--flipping')).toBeInTheDocument();
    expect(container.querySelector('.card__flip-container')).toBeInTheDocument();
  });

  test('applies dealing animation class (LC-057)', () => {
    const { container } = render(<Card card={mockCard} isDealing />);
    expect(container.querySelector('.card--dealing')).toBeInTheDocument();
  });

  test('burn card animation class applied when isBurnAnimating (AN-030)', () => {
    const { container } = render(<Card card={mockCard} isBurned isBurnAnimating />);
    expect(container.querySelector('.card--burn-animating')).toBeInTheDocument();
  });

  test('blue highlight color variant (VD-004)', () => {
    const { container } = render(<Card card={mockCard} isHighlighted highlightColor="blue" />);
    expect(container.querySelector('.card--highlight-blue')).toBeInTheDocument();
  });
});
