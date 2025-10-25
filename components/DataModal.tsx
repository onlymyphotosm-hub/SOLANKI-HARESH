import React from 'react';
import { Theme } from '../themes';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onBackup: () => void;
  onRestore: () => void;
  isSignedIn: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  statusMessage: string;
  theme: Theme['colors'];
}

const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onBackup,
  onRestore,
  isSignedIn,
  isBackingUp,
  isRestoring,
  statusMessage,
  theme
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-title"
    >
      <div
        className={`${theme.modalBg} rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`p-4 border-b ${theme.modalHeaderBorder} flex justify-between items-center`}>
          <h2 id="data-title" className={`text-2xl font-bold ${theme.textHeader}`}>Data Backup & Restore</h2>
          <button onClick={onClose} className={`${theme.textSecondary} hover:${theme.textPrimary} p-2 rounded-full ${theme.buttonHover} transition-colors`} aria-label="Close data management">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 text-center">
          {!isSignedIn ? (
            <div>
              <p className={`${theme.textPrimary} mb-4`}>Sign in with your Google account to back up your progress to Google Drive.</p>
              <button
                onClick={onSignIn}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44.5 24c0-1.5-.1-2.9-.4-4.4H24v8.5h11.5c-.5 2.8-2 5.2-4.1 6.8v5.5h7.1c4.2-3.8 6.6-9.4 6.6-16.4z" fill="#4285F4"/><path d="M24 48c6.5 0 11.9-2.1 15.8-5.7l-7.1-5.5c-2.1 1.4-4.9 2.3-7.7 2.3-5.9 0-11-3.9-12.8-9.2H3.9v5.7C7.9 42.6 15.4 48 24 48z" fill="#34A853"/><path d="M11.2 28.8c-.4-.9-.6-2-.6-3.1s.2-2.2.6-3.1V16.9H3.9C2.1 20.3 1 24.5 1 28.8s1.1 8.5 3.9 11.9l7.3-5.7z" fill="#FBBC05"/><path d="M24 9.8c3.5 0 6.6 1.2 9.1 3.6l6.3-6.3C35.9 2.2 30.5 0 24 0 15.4 0 7.9 5.4 3.9 12.6l7.3 5.7c1.8-5.3 6.9-9.5 12.8-9.5z" fill="#EA4335"/></svg>
                Sign in with Google
              </button>
              <p className="text-xs text-stone-400 mt-4">This will only create a single hidden file in your Google Drive.</p>
            </div>
          ) : (
            <div className="space-y-4">
               <p className={`${theme.textPrimary}`}>Your data is backed up to a private folder in your Google Drive.</p>
              <button
                onClick={onBackup}
                disabled={isBackingUp || isRestoring}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:bg-gray-400"
              >
                {isBackingUp ? 'Backing Up...' : 'Backup to Drive'}
              </button>
              <button
                onClick={onRestore}
                disabled={isBackingUp || isRestoring}
                className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition-colors disabled:bg-gray-400"
              >
                {isRestoring ? 'Restoring...' : 'Restore from Drive'}
              </button>
            </div>
          )}
          {statusMessage && (
            <p className={`${theme.textPrimary} mt-4 font-medium`}>{statusMessage}</p>
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

export default DataModal;