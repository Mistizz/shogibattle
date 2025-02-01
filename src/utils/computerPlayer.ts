import { GameState, Position, PieceType, Player } from '../types/shogi';
import { getLegalMoves, movePiece, isCheck, dropPiece } from './gameLogic';

// 駒の価値
const PIECE_VALUES: { [key in PieceType]: number } = {
  '歩兵': 1,
  'と金': 5,
  '香車': 4,
  '桂馬': 4,
  '銀将': 5,
  '金将': 6,
  '角行': 8,
  '飛車': 10,
  '王将': 0,  // 王は取れないので評価には含めない
  '玉将': 0,  // 玉は取れないので評価には含めない
  '竜王': 13,
  '竜馬': 11,
  '成香': 6,
  '成桂': 6,
  '成銀': 6
};

// 盤面の位置による価値の補正
const POSITION_VALUES = [
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  [0.0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.0],
  [0.0, 0.2, 0.4, 0.4, 0.4, 0.4, 0.4, 0.2, 0.0],
  [0.0, 0.2, 0.4, 0.6, 0.6, 0.6, 0.4, 0.2, 0.0],
  [0.0, 0.2, 0.4, 0.6, 0.8, 0.6, 0.4, 0.2, 0.0],
  [0.0, 0.2, 0.4, 0.6, 0.6, 0.6, 0.4, 0.2, 0.0],
  [0.0, 0.2, 0.4, 0.4, 0.4, 0.4, 0.4, 0.2, 0.0],
  [0.0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.0],
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
];

// 手の評価結果
interface EvaluatedMove {
  from: Position;
  to: Position;
  score: number;
}

// 盤面の評価
const evaluateBoard = (gameState: GameState): number => {
  let score = 0;
  
  // 王手されている場合は大幅な減点
  if (isCheck(gameState) && gameState.currentPlayer === '後手') {
    score -= 100;  // 王手を回避する手を強く優先
  }

  // 駒の価値の合計を計算
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = gameState.board[y][x].piece;
      if (piece) {
        const value = PIECE_VALUES[piece.type] * (1 + POSITION_VALUES[y][x]);
        score += piece.player === '後手' ? value : -value;
      }
    }
  }

  // 持ち駒の価値を加算
  for (const piece of gameState.capturedPieces['後手']) {
    score += PIECE_VALUES[piece.type] * piece.count;
  }
  for (const piece of gameState.capturedPieces['先手']) {
    score -= PIECE_VALUES[piece.type] * piece.count;
  }

  // 王手をかけている場合はボーナス
  if (isCheck(gameState) && gameState.currentPlayer === '先手') {
    score += 3;
  }

  return score;
};

// 可能な手を評価してランク付け
const evaluateMoves = (gameState: GameState): EvaluatedMove[] => {
  const moves = getLegalMoves(gameState);
  const evaluatedMoves: EvaluatedMove[] = [];

  console.log('Legal moves:', moves.length);  // 合法手の数を出力

  for (const [from, to] of moves) {
    const newState = movePiece(gameState, from, to);
    const score = evaluateBoard(newState);
    evaluatedMoves.push({ from, to, score });
  }

  // 持ち駒を使用する手も評価
  for (const capturedPiece of gameState.capturedPieces[gameState.currentPlayer]) {
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        const to = { x, y };
        const newState = dropPiece(gameState, capturedPiece.type, to);
        if (newState !== gameState) {  // 配置可能な場合
          const score = evaluateBoard(newState);
          evaluatedMoves.push({
            from: { x: -1, y: -1 },  // 持ち駒からの移動を表す特殊な座標
            to,
            score
          });
        }
      }
    }
  }

  // スコアで降順ソート
  const sortedMoves = evaluatedMoves.sort((a, b) => b.score - a.score);
  
  // 上位3手とそのスコアを出力
  console.log('Top 3 moves:');
  sortedMoves.slice(0, 3).forEach((move, index) => {
    console.log(`${index + 1}. From (${move.from.x},${move.from.y}) to (${move.to.x},${move.to.y}) - Score: ${move.score}`);
  });

  return sortedMoves;
};

// 確率に基づいて手を選択
export const selectComputerMove = (gameState: GameState): { from: Position; to: Position } | null => {
  const evaluatedMoves = evaluateMoves(gameState);
  if (evaluatedMoves.length === 0) {
    console.log('No legal moves available');
    return null;
  }

  const random = Math.random();
  let selectedMove: EvaluatedMove;

  if (random < 0.75) {
    // 75%の確率で最善手
    selectedMove = evaluatedMoves[0];
    console.log('Selected best move');
  } else if (random < 0.95) {
    // 20%の確率で2番手（存在する場合）
    selectedMove = evaluatedMoves[1] || evaluatedMoves[0];
    console.log('Selected second best move');
  } else {
    // 5%の確率で3番手（存在する場合）
    selectedMove = evaluatedMoves[2] || evaluatedMoves[1] || evaluatedMoves[0];
    console.log('Selected third best move');
  }

  console.log('Selected move:', {
    from: selectedMove.from,
    to: selectedMove.to,
    score: selectedMove.score
  });

  return {
    from: selectedMove.from,
    to: selectedMove.to
  };
}; 