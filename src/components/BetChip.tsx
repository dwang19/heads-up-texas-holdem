import React from 'react';
import './BetChip.css';

interface BetChipProps {
  amount: number;
}

const BetChip: React.FC<BetChipProps> = ({ amount }) => {
  if (amount <= 0) return null;

  return (
    <div className="bet-chip-container">
      <div className="bet-chip">
        <div className="bet-chip-inner">
          <span className="bet-chip-dollar">$</span>
          <span className="bet-chip-value">{amount}</span>
        </div>
      </div>
    </div>
  );
};

export default BetChip;
