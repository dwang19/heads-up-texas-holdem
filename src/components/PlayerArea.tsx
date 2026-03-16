import React from 'react';
import { Player } from '../game/types';
import Card from './Card';
import './PlayerArea.css';

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer?: boolean;
  gamePhase?: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  holeCardAnimating?: boolean;
  aiCardsFlipping?: boolean;
  isShowdown?: boolean;
  onHandHover?: () => void;
  onHandLeave?: () => void;
  usedHoleCardIndices?: number[];
  isHovered?: boolean;
  currentBet?: number;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  isCurrentPlayer = false,
  gamePhase = 'waiting',
  holeCardAnimating = false,
  aiCardsFlipping = false,
  isShowdown = false,
  onHandHover,
  onHandLeave,
  usedHoleCardIndices = [],
  isHovered = false,
  currentBet = 0
}) => {
  const getPositionIndicators = () => {
    const indicators: Array<{ full: string; short: string }> = [];
    if (player.isSmallBlind) indicators.push({ full: 'Small Blind', short: 'SB' });
    if (player.isBigBlind) indicators.push({ full: 'Big Blind', short: 'BB' });
    return indicators;
  };

  const positionIndicators = getPositionIndicators();

  return (
    <div className={`player-area ${player.hasFolded ? 'folded' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}>
      {/* Turn Indicator Badge */}
      {isCurrentPlayer && !player.hasFolded && (
        <div className="turn-indicator">
          <div className="turn-arrow">⬇</div>
          <div className="turn-text">TURN</div>
        </div>
      )}

      <div className="player-header">
        <div className="player-name-section">
          <h3 className="player-name">
            {player.name}
            {player.hasFolded && <span className="folded-text"> (FOLDED)</span>}
          </h3>
          {positionIndicators.length > 0 && (
            <div className="position-indicators">
              {positionIndicators.map(indicator => (
                <span key={indicator.short} className="position-badge">
                  <span className="badge-full">{indicator.full}</span>
                  <span className="badge-short">{indicator.short}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="player-chips">
        <div className="chip-stack">
          <div className="chip-icon">💰</div>
          <span className="chip-amount">${player.chips.toLocaleString()}</span>
        </div>
        {currentBet > 0 && (
          <div className="bet-badge">Bet: ${currentBet}</div>
        )}
      </div>

      <div 
        className={`player-cards ${isShowdown ? 'showdown-cards' : ''}`}
        onMouseEnter={isShowdown && !player.hasFolded ? onHandHover : undefined}
        onMouseLeave={isShowdown && !player.hasFolded ? onHandLeave : undefined}
      >
        <div className="cards-row">
          {player.cards.map((card, index) => {
            // For AI cards during showdown flip, show as hidden initially, then flip
            const shouldFlip = !player.isHuman && aiCardsFlipping && gamePhase === 'showdown' && !player.hasFolded;
            // Hide AI cards when not in showdown, but keep human cards visible even if they folded
            const shouldHide = !player.isHuman && gamePhase !== 'showdown' && !shouldFlip;
            
            // During showdown, determine if this card is used in the best hand
            const isUsedInHand = isShowdown && usedHoleCardIndices.includes(index);
            const shouldGlow = isShowdown && !player.hasFolded;
            const isDimmed = isShowdown && isHovered && !isUsedInHand;
            
            // Debug logging for AI player cards
            if (!player.isHuman && gamePhase === 'showdown') {
              console.log(`DEBUG PlayerArea: AI card ${index} - shouldFlip: ${shouldFlip}, aiCardsFlipping: ${aiCardsFlipping}, gamePhase: ${gamePhase}, hasFolded: ${player.hasFolded}`);
            }
            
            return (
              <Card
                key={`${player.id}-${index}`}
                card={card}
                hidden={shouldHide}
                size="medium"
                isDealing={holeCardAnimating}
                isFlipping={shouldFlip}
                isHighlighted={shouldGlow && !isDimmed}
                highlightColor={player.isHuman ? 'green' : 'blue'}
                className={isDimmed ? 'card--dimmed' : ''}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerArea;