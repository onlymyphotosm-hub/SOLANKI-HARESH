
import React from 'react';
import { Theme } from '../themes';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme['colors'];
  onExportToFile: () => void;
  onImportFromFile: (file: File) => void;
}

const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  theme,
  onExportToFile,
  onImportFromFile,
}) => {
  if (!isOpen) return null;

  const importFileRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onImportFromFile(file);
      }
      if (e.target) e.target.value = '';
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-title"
    >
      <div
        className={`${theme.modalBg} rounded-lg shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 scale-95 opacity-0 animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`flex justify-between items-center mb-6 border-b ${theme.modalHeaderBorder} pb-4`}>
          <h2 id="data-title" className={`text-2xl font-bold ${theme.textHeader}`}>Backup & Restore</h2>
          <button onClick={onClose} className={`${theme.textSecondary} hover:${theme.textPrimary} p-2 rounded-full ${theme.buttonHover} transition-colors`} aria-label="Close data management">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="space-y-6">
          <div>
              <h3 className={`text-lg font-semibold ${theme.textHeader} mb-2`}>Export Data</h3>
              <p className={`${theme.textPrimary} text-sm mb-3`}>Save your data to a file on your device.</p>
               <button
                  onClick={onExportToFile}
                  className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export to File
                </button>
          </div>
          
          <div className={`border-t ${theme.modalHeaderBorder}`}></div>

          <div>
              <h3 className={`text-lg font-semibold ${theme.textHeader} mb-2`}>Import Data</h3>
              <p className={`${theme.textPrimary} text-sm mb-3`}>Restore data from a previously exported file.</p>
               <input type="file" accept=".json" ref={importFileRef} className="hidden" onChange={handleFileChange} aria-hidden="true" />
                <button
                  onClick={handleImportClick}
                  className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
                  </svg>
                  Import from File
                </button>
          </div>
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
