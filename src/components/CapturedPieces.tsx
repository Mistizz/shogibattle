import React from 'react';
import { CapturedPiece, Player } from '../types/shogi';
import './CapturedPieces.css';

interface CapturedPiecesProps {
  pieces: CapturedPiece[];
  player: Player;
  onPieceClick: (type: string) => void;
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  pieces,
  player,
  onPieceClick,
}) => {
  return (
    <div className={`captured-pieces ${player}`}>
      <h3>{player}の持ち駒</h3>
      <div className="pieces-container">
        {pieces.map((piece) => (
          <div
            key={piece.type}
            className="captured-piece"
            onClick={() => onPieceClick(piece.type)}
          >
            <span className="piece-type">{piece.type}</span>
            {piece.count > 1 && <span className="piece-count">{piece.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CapturedPieces; 