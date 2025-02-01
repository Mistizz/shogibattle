import React from 'react';
import { Square as SquareType } from '../types/shogi';
import './Square.css';

interface SquareProps {
  square: SquareType;
  onClick: () => void;
  isSelected?: boolean;
}

const Square: React.FC<SquareProps> = ({
  square,
  onClick,
  isSelected = false,
}) => {
  return (
    <div 
      className={`square ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {square.piece && (
        <div className={`piece ${square.piece.player}`}>
          {square.piece.type}
          {square.piece.promoted && '成'}
        </div>
      )}
    </div>
  );
};

export default Square; 