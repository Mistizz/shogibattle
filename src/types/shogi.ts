export type PieceType = 
  | '王将' | '玉将' | '飛車' | '角行'
  | '金将' | '銀将' | '桂馬' | '香車' | '歩兵'
  | '竜王' | '竜馬' | '成銀' | '成桂' | '成香' | 'と金';

export type Player = '先手' | '後手';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  player: Player;
  promoted: boolean;
}

export interface Square {
  position: Position;
  piece: Piece | null;
}

export interface CapturedPiece {
  type: PieceType;
  count: number;
}

export interface GameState {
  board: Square[][];
  capturedPieces: {
    [key in Player]: CapturedPiece[];
  };
  currentPlayer: Player;
  isCheck: boolean;
  isGameOver: boolean;
}

export type PromotionMap = {
  [key in PieceType]?: PieceType;
}; 