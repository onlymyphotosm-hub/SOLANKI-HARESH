import React from 'react';
import { Theme } from '../themes';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  theme: Theme['colors'];
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, theme }) => {
  if (!isOpen) return null;

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        className={`${theme.modalBg} rounded-lg shadow-2xl w-full max-w-sm p-6 text-center animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className={`text-2xl font-bold ${theme.textHeader} mb-2`}>{title}</h2>
        <p id="confirm-message" className={`${theme.textPrimary} mb-6`}>{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className={`px-6 py-2 ${theme.textPrimary} ${theme.cancelButton} ${theme.cancelButtonHover} rounded-lg font-semibold transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            className={`px-6 py-2 text-white ${theme.confirmButton} rounded-lg font-semibold transition-colors`}
          >
            Confirm
          </button>
        </div>
      </div>
       <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;