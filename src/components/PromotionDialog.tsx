import React from 'react';
import './PromotionDialog.css';

interface PromotionDialogProps {
  isOpen: boolean;
  onPromote: (promote: boolean) => void;
  pieceName: string;
}

const PromotionDialog: React.FC<PromotionDialogProps> = ({
  isOpen,
  onPromote,
  pieceName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="promotion-dialog-overlay">
      <div className="promotion-dialog">
        <h2>成りますか？</h2>
        <p>{pieceName}を成りに変更できます</p>
        <div className="promotion-buttons">
          <button onClick={() => onPromote(true)}>
            成る
          </button>
          <button onClick={() => onPromote(false)}>
            成らない
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionDialog; 