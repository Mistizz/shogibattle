import { useState, useEffect } from 'react'
import './App.css'
import Board from './components/Board'
import CapturedPieces from './components/CapturedPieces'
import PromotionDialog from './components/PromotionDialog'
import { Position, GameState, PieceType } from './types/shogi'
import { createInitialGameState, movePiece, canPromote, dropPiece, isValidMove } from './utils/gameLogic'
import { selectComputerMove } from './utils/computerPlayer'

interface MoveInfo {
  from: Position;
  to: Position;
  gameState: GameState;
}

function App() {
  const [gameState, setGameState] = useState(createInitialGameState())
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<MoveInfo | null>(null)
  const [selectedCapturedPiece, setSelectedCapturedPiece] = useState<PieceType | null>(null)

  const handleSquareClick = (position: Position) => {
    if (gameState.isGameOver) {
      return; // ゲーム終了時は操作を無効化
    }

    console.log('Square clicked:', position);
    console.log('Current state:', {
      selectedPosition,
      selectedCapturedPiece,
      currentPlayer: gameState.currentPlayer
    });

    // 持ち駒を選択している場合
    if (selectedCapturedPiece) {
      const newGameState = dropPiece(gameState, selectedCapturedPiece, position);
      if (newGameState !== gameState) {
        setGameState(newGameState);
      }
      setSelectedCapturedPiece(null);
      return;
    }

    if (!selectedPosition) {
      // 駒を選択
      const piece = gameState.board[position.y][position.x].piece;
      console.log('Selected piece:', piece);
      if (piece?.player === gameState.currentPlayer) {
        setSelectedPosition(position);
      }
    } else {
      // 駒を移動
      if (selectedPosition.x === position.x && selectedPosition.y === position.y) {
        setSelectedPosition(null);
      } else {
        const piece = gameState.board[selectedPosition.y][selectedPosition.x].piece;
        console.log('Moving piece:', {
          from: selectedPosition,
          to: position,
          piece
        });

        // 移動可能な場合のみ処理を続行
        if (piece && isValidMove(gameState, selectedPosition, position)) {
          if (canPromote(selectedPosition, position, piece)) {
            setPendingPromotion({
              from: selectedPosition,
              to: position,
              gameState: gameState
            });
          } else {
            const newGameState = movePiece(gameState, selectedPosition, position);
            console.log('New game state:', newGameState);
            setGameState(newGameState);
          }
        }
        setSelectedPosition(null);
      }
    }
  }

  const handlePromote = (promote: boolean) => {
    if (pendingPromotion) {
      const newGameState = movePiece(
        pendingPromotion.gameState,
        pendingPromotion.from,
        pendingPromotion.to,
        promote
      )
      setGameState(newGameState)
      setPendingPromotion(null)
    }
  }

  const handleCapturedPieceClick = (type: string) => {
    if (gameState.isGameOver) return;
    setSelectedCapturedPiece(type as PieceType);
    setSelectedPosition(null);
  };

  // 勝者を判定する関数
  const getWinnerMessage = (): string => {
    if (!gameState.isGameOver) return '';
    // 現在の手番が勝者（王を取った場合）または敗者（詰みの場合）
    const winner = gameState.currentPlayer;
    return `${winner === '先手' ? '後手' : '先手'}の勝ちです！`;
  };

  // コンピュータの手を実行
  useEffect(() => {
    if (gameState.currentPlayer === '後手' && !gameState.isGameOver) {
      // 少し遅延を入れて、人間の手との区別をつけやすくする
      const timer = setTimeout(() => {
        const move = selectComputerMove(gameState);
        if (move) {
          console.log('Computer selected move:', move);
          if (move.from.x === -1 && move.from.y === -1) {
            // 持ち駒を使用する手の場合
            const capturedPieces = gameState.capturedPieces['後手'];
            // 持ち駒の中から最初に見つかった使用可能な駒を使用
            for (const piece of capturedPieces) {
              const newGameState = dropPiece(gameState, piece.type, move.to);
              if (newGameState !== gameState) {
                console.log('Dropping captured piece:', piece.type, 'to:', move.to);
                setGameState(newGameState);
                break;
              }
            }
          } else {
            // 通常の移動の場合
            const piece = gameState.board[move.from.y][move.from.x].piece;
            if (piece) {
              if (canPromote(move.from, move.to, piece)) {
                // 成れる場合は80%の確率で成る
                const shouldPromote = Math.random() < 0.8;
                console.log('Moving piece with promotion:', shouldPromote);
                const newGameState = movePiece(gameState, move.from, move.to, shouldPromote);
                setGameState(newGameState);
              } else {
                console.log('Moving piece without promotion');
                const newGameState = movePiece(gameState, move.from, move.to);
                setGameState(newGameState);
              }
            }
          }
        }
      }, 500); // 500ミリ秒の遅延

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  return (
    <div className="app">
      <h1>将棋</h1>
      <div className="game-container">
        <CapturedPieces
          pieces={gameState.capturedPieces['後手']}
          player="後手"
          onPieceClick={handleCapturedPieceClick}
        />
        <div className="board-container">
          <div className="game-info">
            <p>手番: {gameState.currentPlayer}</p>
            {selectedCapturedPiece && (
              <p className="info">持ち駒 {selectedCapturedPiece} を配置してください</p>
            )}
            {gameState.isCheck && !gameState.isGameOver && (
              <p className="warning">王手！</p>
            )}
            {gameState.isGameOver && (
              <div className="game-over">
                <p>ゲーム終了</p>
                <p>{getWinnerMessage()}</p>
              </div>
            )}
          </div>
          <Board
            gameState={gameState}
            selectedPosition={selectedPosition}
            onSquareClick={handleSquareClick}
          />
          <button
            className="reset-button"
            onClick={() => {
              setGameState(createInitialGameState());
              setSelectedPosition(null);
              setSelectedCapturedPiece(null);
              setPendingPromotion(null);
            }}
          >
            リセット
          </button>
        </div>
        <CapturedPieces
          pieces={gameState.capturedPieces['先手']}
          player="先手"
          onPieceClick={handleCapturedPieceClick}
        />
      </div>
      <PromotionDialog
        isOpen={pendingPromotion !== null}
        onPromote={handlePromote}
        pieceName={pendingPromotion?.gameState.board[pendingPromotion.from.y][pendingPromotion.from.x].piece?.type || ''}
      />
    </div>
  )
}

export default App
