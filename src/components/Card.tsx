import React from 'react';
import { Card as CardType } from '../game/types';
import { getSuitSymbol, getSuitColor } from '../game/deck';
import './Card.css';

interface CardProps {
  card: CardType | null;
  hidden?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  isBurned?: boolean;
  isDealing?: boolean;
  isBurnAnimating?: boolean;
  isHighlighted?: boolean;
  highlightColor?: 'green' | 'blue';
  edgeHighlight?: 'top' | 'bottom' | 'both';
  edgeHighlightColor?: 'green' | 'blue';
  isFlipping?: boolean;
  isDeck?: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  hidden = false,
  size = 'medium',
  className = '',
  isBurned = false,
  isDealing = false,
  isBurnAnimating = false,
  isHighlighted = false,
  highlightColor = 'green',
  edgeHighlight,
  edgeHighlightColor = 'green',
  isFlipping = false,
  isDeck = false
}) => {
  // Handle deck card: show as solid facedown card with stacked effect
  if (isDeck) {
    return (
      <div className={`card card--deck card--hidden card--${size} ${className}`}>
        <div className="card__back">
          <div className="card__pattern"></div>
        </div>
      </div>
    );
  }

  // Handle burned cards: if burned and card exists, show as facedown; if burned and no card, show as empty
  if (isBurned) {
    const animClass = isBurnAnimating ? 'card--burn-animating' : '';
    if (card) {
      // Burned card exists - show as regular facedown card
      return (
        <div className={`card card--hidden card--${size} ${animClass} ${className}`}>
          <div className="card__back">
            <div className="card__pattern"></div>
          </div>
        </div>
      );
    } else {
      // No burned card yet - show as transparent empty slot
      return (
        <div className={`card card--empty card--${size} ${animClass} ${className}`}>
          <div className="card__back">
            <div className="card__pattern"></div>
          </div>
        </div>
      );
    }
  }

  // Handle empty cards (not burned)
  if (!card) {
    return (
      <div className={`card card--empty card--${size} ${className}`}>
        <div className="card__back">
          <div className="card__pattern"></div>
        </div>
      </div>
    );
  }

  if (hidden && !isFlipping) {
    return (
      <div className={`card card--hidden card--${size} ${className}`}>
        <div className="card__back">
          <div className="card__pattern"></div>
        </div>
      </div>
    );
  }

  const suitSymbol = getSuitSymbol(card.suit);
  const suitColor = getSuitColor(card.suit);

  const dealingClass = isDealing ? 'card--dealing' : '';
  const highlightClass = isHighlighted ? `card--highlighted card--highlight-${highlightColor}` : '';
  const edgeHighlightClass = edgeHighlight ? `card--edge-highlight-${edgeHighlight} card--edge-${edgeHighlightColor}` : '';
  const flipClass = isFlipping ? 'card--flipping' : '';
  
  // If flipping, show both back and front with flip animation
  if (isFlipping) {
    return (
      <div className={`card card--${size} ${flipClass} ${highlightClass} ${className}`}>
        <div className="card__flip-container">
          <div className="card__flip-back">
            <div className="card__back">
              <div className="card__pattern"></div>
            </div>
          </div>
          <div className="card__flip-front">
            <div className="card__front">
              <div className="card__corner card__corner--top-left">
                <div className="card__rank" style={{ color: suitColor }}>
                  {card.displayRank}
                </div>
                <div className="card__suit" style={{ color: suitColor }}>
                  {suitSymbol}
                </div>
              </div>

              <div className="card__center">
                <div className="card__suit-large" style={{ color: suitColor }}>
                  {suitSymbol}
                </div>
              </div>

              <div className="card__corner card__corner--bottom-right">
                <div className="card__rank card__rank--rotated" style={{ color: suitColor }}>
                  {card.displayRank}
                </div>
                <div className="card__suit card__suit--rotated" style={{ color: suitColor }}>
                  {suitSymbol}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`card card--${size} ${dealingClass} ${highlightClass} ${edgeHighlightClass} ${className}`}>
      <div className="card__front">
        <div className="card__corner card__corner--top-left">
          <div className="card__rank" style={{ color: suitColor }}>
            {card.displayRank}
          </div>
          <div className="card__suit" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>

        <div className="card__center">
          <div className="card__suit-large" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>

        <div className="card__corner card__corner--bottom-right">
          <div className="card__rank card__rank--rotated" style={{ color: suitColor }}>
            {card.displayRank}
          </div>
          <div className="card__suit card__suit--rotated" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;