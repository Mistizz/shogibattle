import React from 'react';
import { GameState, Position } from '../types/shogi';
import Square from './Square';
import './Board.css';

interface BoardProps {
  gameState: GameState;
  selectedPosition: Position | null;
  onSquareClick: (position: Position) => void;
}

const Board: React.FC<BoardProps> = ({ gameState, selectedPosition, onSquareClick }) => {
  return (
    <div className="board">
      {gameState.board.map((row, y) => (
        <div key={y} className="board-row">
          {row.map((square, x) => (
            <Square
              key={`${x}-${y}`}
              square={square}
              isSelected={selectedPosition?.x === x && selectedPosition?.y === y}
              onClick={() => onSquareClick({ x, y })}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board; 