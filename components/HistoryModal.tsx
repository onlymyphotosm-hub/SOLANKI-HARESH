import React from 'react';
import { Theme } from '../themes';

export interface HistoryEntry {
  date: string;
  rounds: number;
}

interface HistoryModalProps {
  history: HistoryEntry[];
  onClose: () => void;
  isOpen: boolean;
  theme: Theme['colors'];
}

const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, isOpen, theme }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div 
        className={`${theme.modalBg} rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`p-4 border-b ${theme.modalHeaderBorder} flex justify-between items-center sticky top-0 ${theme.modalBg}/80 backdrop-blur-sm`}>
          <h2 id="history-title" className={`text-2xl font-bold ${theme.textHeader}`}>Your Progress</h2>
          <button onClick={onClose} className={`${theme.textSecondary} hover:${theme.textPrimary} p-2 rounded-full ${theme.buttonHover} transition-colors`} aria-label="Close history">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          {history.length === 0 ? (
            <p className={`${theme.textSecondary} text-center py-8`}>No history yet. Start your first round!</p>
          ) : (
            <ul className="space-y-3">
              {history.map((entry, index) => (
                <li key={index} className={`flex justify-between items-center p-4 ${theme.listItemBackground} rounded-lg shadow-sm border ${theme.listItemBorder}`}>
                  <span className={`font-semibold ${theme.textPrimary}`}>{new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <div className="text-right">
                    <span className={`${theme.accentDark} font-bold text-lg`}>{entry.rounds}</span>
                    <span className={`${theme.textSecondary} text-sm ml-1`}>{entry.rounds === 1 ? 'Round' : 'Rounds'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
      <style>{`
        @keyframes modal-enter {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default HistoryModal;