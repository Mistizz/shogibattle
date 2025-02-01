import { GameState, Piece, Position, PieceType, Player, CapturedPiece, PromotionMap } from '../types/shogi';

type PieceMovement = {
  x: number;
  y: number;
};

type PieceMovements = {
  [K in PieceType]: (player: Player) => PieceMovement[];
};

// 駒の移動可能な方向を定義
const PIECE_MOVEMENTS: PieceMovements = {
  '歩兵': (player: Player) => [
    { x: 0, y: player === '先手' ? -1 : 1 }
  ],
  'と金': (player: Player) => PIECE_MOVEMENTS['金将'](player),
  '香車': (player: Player) => Array.from({ length: 8 }, (_, i) => ({
    x: 0,
    y: player === '先手' ? -(i + 1) : i + 1
  })),
  '桂馬': (player: Player) => [
    { x: -1, y: player === '先手' ? -2 : 2 },
    { x: 1, y: player === '先手' ? -2 : 2 }
  ],
  '銀将': (player: Player) => [
    { x: 0, y: player === '先手' ? -1 : 1 },
    { x: 1, y: player === '先手' ? -1 : 1 },
    { x: -1, y: player === '先手' ? -1 : 1 },
    { x: 1, y: player === '先手' ? 1 : -1 },
    { x: -1, y: player === '先手' ? 1 : -1 }
  ],
  '金将': (player: Player) => [
    { x: 0, y: player === '先手' ? -1 : 1 },   // 前
    { x: 1, y: player === '先手' ? -1 : 1 },   // 右前
    { x: -1, y: player === '先手' ? -1 : 1 },  // 左前
    { x: 1, y: 0 },    // 右
    { x: -1, y: 0 },   // 左
    { x: 0, y: player === '先手' ? 1 : -1 }    // 後ろ
  ],
  '角行': () => {
    const moves: PieceMovement[] = [];
    for (let i = 1; i < 9; i++) {
      moves.push({ x: i, y: i }, { x: -i, y: i }, { x: i, y: -i }, { x: -i, y: -i });
    }
    return moves;
  },
  '飛車': () => {
    const moves: PieceMovement[] = [];
    for (let i = 1; i < 9; i++) {
      moves.push({ x: 0, y: i }, { x: 0, y: -i }, { x: i, y: 0 }, { x: -i, y: 0 });
    }
    return moves;
  },
  '王将': () => [
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 0 }, { x: 1, y: 0 },
    { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
  ],
  '玉将': () => [
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 0 }, { x: 1, y: 0 },
    { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
  ],
  '竜王': () => {
    const moves: PieceMovement[] = [];
    // 飛車の動き
    for (let i = 1; i < 9; i++) {
      moves.push({ x: 0, y: i }, { x: 0, y: -i }, { x: i, y: 0 }, { x: -i, y: 0 });
    }
    // 斜め1マスの動き
    moves.push({ x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 });
    return moves;
  },
  '竜馬': () => {
    const moves: PieceMovement[] = [];
    // 角行の動き
    for (let i = 1; i < 9; i++) {
      moves.push({ x: i, y: i }, { x: -i, y: i }, { x: i, y: -i }, { x: -i, y: -i });
    }
    // 上下左右1マスの動き
    moves.push({ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 });
    return moves;
  },
  '成香': (player: Player) => PIECE_MOVEMENTS['金将'](player),
  '成桂': (player: Player) => PIECE_MOVEMENTS['金将'](player),
  '成銀': (player: Player) => PIECE_MOVEMENTS['金将'](player)
};

// 成り駒の対応表
const PROMOTION_MAP: PromotionMap = {
  '歩兵': 'と金',
  '香車': '成香',
  '桂馬': '成桂',
  '銀将': '成銀',
  '角行': '竜馬',
  '飛車': '竜王'
};

// 成った駒を元の駒に戻す変換マップ
const UNPROMOTE_MAP: { [key in PieceType]?: PieceType } = {
  'と金': '歩兵',
  '成香': '香車',
  '成桂': '桂馬',
  '成銀': '銀将',
  '竜馬': '角行',
  '竜王': '飛車'
} as const;

// 座標が盤面内かチェック
const isWithinBoard = (pos: Position): boolean => {
  return pos.x >= 0 && pos.x < 9 && pos.y >= 0 && pos.y < 9;
};

// 移動可能な位置かチェック
const canMoveTo = (
  gameState: GameState,
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  // 移動先に自分の駒がある場合は移動不可
  const targetPiece = gameState.board[to.y][to.x].piece;
  if (targetPiece && targetPiece.player === piece.player) {
    return false;
  }

  const movements = PIECE_MOVEMENTS[piece.type](piece.player);
  return movements.some(move => move.x === to.x - from.x && move.y === to.y - from.y);
};

// 成りが可能かチェック
export const canPromote = (
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  if (piece.promoted || !PROMOTION_MAP[piece.type]) {
    return false;
  }

  const promotionZone = piece.player === '先手' ? 3 : 6;
  return (piece.player === '先手' && (to.y < 3 || from.y < 3)) ||
         (piece.player === '後手' && (to.y > 5 || from.y > 5));
};

export const isValidMove = (
  gameState: GameState,
  from: Position,
  to: Position
): boolean => {
  const piece = gameState.board[from.y][from.x].piece;
  if (!piece || piece.player !== gameState.currentPlayer) {
    return false;
  }

  // 盤面外への移動は不可
  if (!isWithinBoard(to)) {
    return false;
  }

  return canMoveTo(gameState, from, to, piece);
};

export const createInitialGameState = (): GameState => {
  const board = Array(9).fill(null).map((_, y) => 
    Array(9).fill(null).map((_, x) => ({
      position: { x, y },
      piece: null
    }))
  );

  // 初期配置の設定
  const initialPieces: [number, number, PieceType, Player][] = [
    // 先手の駒
    [0, 6, '歩兵', '先手'], [1, 6, '歩兵', '先手'], [2, 6, '歩兵', '先手'],
    [3, 6, '歩兵', '先手'], [4, 6, '歩兵', '先手'], [5, 6, '歩兵', '先手'],
    [6, 6, '歩兵', '先手'], [7, 6, '歩兵', '先手'], [8, 6, '歩兵', '先手'],
    [1, 7, '角行', '先手'], [7, 7, '飛車', '先手'],
    [0, 8, '香車', '先手'], [1, 8, '桂馬', '先手'], [2, 8, '銀将', '先手'],
    [3, 8, '金将', '先手'], [4, 8, '王将', '先手'], [5, 8, '金将', '先手'],
    [6, 8, '銀将', '先手'], [7, 8, '桂馬', '先手'], [8, 8, '香車', '先手'],

    // 後手の駒
    [0, 2, '歩兵', '後手'], [1, 2, '歩兵', '後手'], [2, 2, '歩兵', '後手'],
    [3, 2, '歩兵', '後手'], [4, 2, '歩兵', '後手'], [5, 2, '歩兵', '後手'],
    [6, 2, '歩兵', '後手'], [7, 2, '歩兵', '後手'], [8, 2, '歩兵', '後手'],
    [1, 1, '飛車', '後手'], [7, 1, '角行', '後手'],
    [0, 0, '香車', '後手'], [1, 0, '桂馬', '後手'], [2, 0, '銀将', '後手'],
    [3, 0, '金将', '後手'], [4, 0, '玉将', '後手'], [5, 0, '金将', '後手'],
    [6, 0, '銀将', '後手'], [7, 0, '桂馬', '後手'], [8, 0, '香車', '後手'],
  ];

  initialPieces.forEach(([x, y, type, player]) => {
    if (board[y][x].piece === null) {
      board[y][x].piece = {
        type,
        player,
        promoted: false
      };
    }
  });

  return {
    board,
    capturedPieces: {
      '先手': [],
      '後手': []
    },
    currentPlayer: '先手',
    isCheck: false,
    isGameOver: false
  };
};

// 指定した位置の駒を取得
const getPieceAt = (gameState: GameState, pos: Position): Piece | null => {
  return gameState.board[pos.y][pos.x].piece;
};

// 玉将/王将の位置を取得
const getKingPosition = (gameState: GameState, player: Player): Position | null => {
  const kingType = player === '先手' ? '王将' : '玉将';
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = getPieceAt(gameState, { x, y });
      if (piece && piece.type === kingType && piece.player === player) {
        return { x, y };
      }
    }
  }
  return null; // 王将/玉将が見つからない場合はnullを返す
};

// 駒の移動パスが他の駒に遮られていないかチェック
const isPathClear = (
  gameState: GameState,
  from: Position,
  to: Position,
  movement: PieceMovement
): boolean => {
  const dx = Math.sign(movement.x);
  const dy = Math.sign(movement.y);
  let x = from.x + dx;
  let y = from.y + dy;

  while (x !== to.x || y !== to.y) {
    if (getPieceAt(gameState, { x, y })) {
      return false;
    }
    x += dx;
    y += dy;
  }
  return true;
};

// 指定した位置に移動可能かチェック（障害物考慮）
const canMoveWithObstacles = (
  gameState: GameState,
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  if (!canMoveTo(gameState, from, to, piece)) {
    return false;
  }

  const movement = {
    x: to.x - from.x,
    y: to.y - from.y
  };

  // 桂馬は障害物チェック不要
  if (piece.type === '桂馬') {
    return true;
  }

  // 長距離移動の駒（飛車、角行、香車）は経路チェック
  if (['飛車', '角行', '香車', '竜王', '竜馬'].includes(piece.type)) {
    return isPathClear(gameState, from, to, movement);
  }

  return true;
};

// 王手判定
export const isCheck = (gameState: GameState): boolean => {
  const currentPlayer = gameState.currentPlayer;
  const kingPos = getKingPosition(gameState, currentPlayer);
  
  // 王将/玉将が見つからない場合は王手ではない
  if (!kingPos) {
    return false;
  }

  // 相手の全ての駒について、王手できるかチェック
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = getPieceAt(gameState, { x, y });
      if (piece && piece.player !== currentPlayer) {
        if (canMoveWithObstacles(gameState, { x, y }, kingPos, piece)) {
          return true;
        }
      }
    }
  }

  return false;
};

// 移動後の状態で王手になるかチェック
const willBeInCheck = (
  gameState: GameState,
  from: Position,
  to: Position
): boolean => {
  const player = gameState.currentPlayer;
  const newGameState = JSON.parse(JSON.stringify(gameState));
  const piece = newGameState.board[from.y][from.x].piece;
  const targetPiece = newGameState.board[to.y][to.x].piece;

  // 仮の移動を行う
  newGameState.board[to.y][to.x].piece = piece;
  newGameState.board[from.y][from.x].piece = null;

  // 相手の全ての駒について、王手できるかチェック
  const kingPos = getKingPosition(newGameState, player);
  if (!kingPos) return false;

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const p = getPieceAt(newGameState, { x, y });
      if (p && p.player !== player) {
        if (canMoveWithObstacles(newGameState, { x, y }, kingPos, p)) {
          return true;
        }
      }
    }
  }

  return false;
};

// 合法手の列挙
export const getLegalMoves = (gameState: GameState): [Position, Position][] => {
  const moves: [Position, Position][] = [];
  const currentPlayer = gameState.currentPlayer;

  // 盤上の全ての駒について
  for (let fromY = 0; fromY < 9; fromY++) {
    for (let fromX = 0; fromX < 9; fromX++) {
      const piece = getPieceAt(gameState, { x: fromX, y: fromY });
      if (piece && piece.player === currentPlayer) {
        // 移動可能な全ての位置について
        for (let toY = 0; toY < 9; toY++) {
          for (let toX = 0; toX < 9; toX++) {
            const from = { x: fromX, y: fromY };
            const to = { x: toX, y: toY };
            
            // 移動可能で、かつその手を指した後に自玉が王手されない場合
            if (canMoveWithObstacles(gameState, from, to, piece) && !willBeInCheck(gameState, from, to)) {
              moves.push([from, to]);
            }
          }
        }
      }
    }
  }

  return moves;
};

// 詰み判定
export const isCheckmate = (gameState: GameState): boolean => {
  const currentPlayer = gameState.currentPlayer;
  const kingPos = getKingPosition(gameState, currentPlayer);

  // 王将/玉将が見つからない場合は詰みではない
  if (!kingPos) {
    return false;
  }

  // 王手がかかっていない場合は詰みではない
  if (!isCheck(gameState)) {
    return false;
  }

  // 合法手が1つでもある場合は詰みではない
  return getLegalMoves(gameState).length === 0;
};

// 王将/玉将かどうかを判定
const isKing = (pieceType: PieceType): boolean => {
  return pieceType === '王将' || pieceType === '玉将';
};

export const movePiece = (
  gameState: GameState,
  from: Position,
  to: Position,
  promote?: boolean
): GameState => {
  if (!isValidMove(gameState, from, to)) {
    return gameState;
  }

  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState;
  const piece = newGameState.board[from.y][from.x].piece;
  if (!piece) return gameState;
  
  const targetPiece = newGameState.board[to.y][to.x].piece;

  // 駒を取る場合の処理
  if (targetPiece) {
    // 王将/玉将を取った場合は即座にゲーム終了
    if (isKing(targetPiece.type)) {
      newGameState.isGameOver = true;
      newGameState.currentPlayer = piece.player; // 取った側の勝ち
      return newGameState;
    }

    // 取られた駒が成り駒の場合は元の駒に戻す
    let capturedType = targetPiece.type;
    if (targetPiece.promoted && UNPROMOTE_MAP[targetPiece.type]) {
      capturedType = UNPROMOTE_MAP[targetPiece.type]!;
    }

    const capturedPieces = newGameState.capturedPieces[piece.player];
    const existingPiece = capturedPieces.find((p: CapturedPiece) => p.type === capturedType);
    if (existingPiece) {
      existingPiece.count++;
    } else {
      capturedPieces.push({ type: capturedType, count: 1 });
    }
  }

  // 成りの処理
  if (promote && canPromote(from, to, piece)) {
    const promotedType = PROMOTION_MAP[piece.type];
    if (promotedType) {
      piece.type = promotedType;
      piece.promoted = true;
    }
  }

  // 駒の移動
  newGameState.board[to.y][to.x].piece = piece;
  newGameState.board[from.y][from.x].piece = null;

  // プレイヤーの交代
  newGameState.currentPlayer = newGameState.currentPlayer === '先手' ? '後手' : '先手';

  // 王手と詰みの判定（王が取られていない場合のみ）
  if (!newGameState.isGameOver) {
    newGameState.isCheck = isCheck(newGameState);
    newGameState.isGameOver = isCheckmate(newGameState);
  }

  return newGameState;
};

// 持ち駒を配置可能な位置かチェック
export const canDropPiece = (
  gameState: GameState,
  pieceType: PieceType,
  to: Position,
  player: Player
): boolean => {
  // 既に駒がある場所には配置不可
  if (getPieceAt(gameState, to)) {
    return false;
  }

  // 歩兵の特殊ルール
  if (pieceType === '歩兵') {
    // 二歩のチェック
    const column = to.x;
    let hasPawn = false;
    for (let y = 0; y < 9; y++) {
      const piece = getPieceAt(gameState, { x: column, y });
      if (piece?.type === '歩兵' && piece.player === player) {
        hasPawn = true;
        break;
      }
    }
    if (hasPawn) {
      return false;
    }

    // 最奥の段には配置不可
    if ((player === '先手' && to.y === 0) || (player === '後手' && to.y === 8)) {
      return false;
    }
  }

  // 桂馬の特殊ルール
  if (pieceType === '桂馬') {
    if (player === '先手' && to.y <= 1) return false;
    if (player === '後手' && to.y >= 7) return false;
  }

  // 香車の特殊ルール
  if (pieceType === '香車') {
    if (player === '先手' && to.y === 0) return false;
    if (player === '後手' && to.y === 8) return false;
  }

  return true;
};

// 持ち駒を配置
export const dropPiece = (
  gameState: GameState,
  pieceType: PieceType,
  to: Position
): GameState => {
  const player = gameState.currentPlayer;
  
  if (!canDropPiece(gameState, pieceType, to, player)) {
    return gameState;
  }

  const newGameState = JSON.parse(JSON.stringify(gameState));
  
  // 持ち駒から1枚減らす
  const capturedPieces = newGameState.capturedPieces[player];
  const pieceIndex = capturedPieces.findIndex(p => p.type === pieceType);
  if (pieceIndex === -1 || capturedPieces[pieceIndex].count === 0) {
    return gameState;
  }

  if (capturedPieces[pieceIndex].count === 1) {
    capturedPieces.splice(pieceIndex, 1);
  } else {
    capturedPieces[pieceIndex].count--;
  }

  // 盤面に配置
  newGameState.board[to.y][to.x].piece = {
    type: pieceType,
    player: player,
    promoted: false
  };

  // プレイヤーの交代
  newGameState.currentPlayer = player === '先手' ? '後手' : '先手';

  // 王手と詰みの判定
  newGameState.isCheck = isCheck(newGameState);
  newGameState.isGameOver = isCheckmate(newGameState);

  return newGameState;
}; 