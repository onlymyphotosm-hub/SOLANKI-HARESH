
import React from 'react';
import { Theme } from '../themes';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme['colors'];
  onExportToFile: () => void;
  onImportFromFile: (file: File) => void;
  onExportToPDF: () => void;
  isGoogleSignedIn?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onDriveBackup?: () => void;
  onDriveRestore?: () => void;
  driveStatus?: string;
}

const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  theme,
  onExportToFile,
  onImportFromFile,
  onExportToPDF,
  isGoogleSignedIn = false,
  onGoogleLogin,
  onGoogleLogout,
  onDriveBackup,
  onDriveRestore,
  driveStatus
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
        className={`${theme.modalBg} rounded-lg shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 scale-95 opacity-0 animate-modal-enter max-h-[85vh] overflow-y-auto`}
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
           {/* Cloud Backup Section */}
           <div>
              <h3 className={`text-lg font-semibold ${theme.textHeader} mb-2`}>Cloud Backup (Google Drive)</h3>
              <p className={`${theme.textPrimary} text-sm mb-3`}>Sync your progress to Google Drive to access it on other devices.</p>
              
              {!isGoogleSignedIn ? (
                  <button
                    onClick={onGoogleLogin}
                    className="w-full px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center mb-2"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-2" />
                    Sign in with Google
                  </button>
              ) : (
                  <div className="space-y-2">
                      <div className={`p-2 rounded bg-green-50 border border-green-200 text-xs text-green-800 flex justify-between items-center`}>
                          <span>Status: {driveStatus || 'Connected'}</span>
                          <button onClick={onGoogleLogout} className="underline hover:text-green-900">Sign Out</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                           <button
                            onClick={onDriveBackup}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Backup
                          </button>
                           <button
                            onClick={onDriveRestore}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
                            </svg>
                            Restore
                          </button>
                      </div>
                  </div>
              )}
          </div>

          <div className={`border-t ${theme.modalHeaderBorder}`}></div>

          <div>
              <h3 className={`text-lg font-semibold ${theme.textHeader} mb-2`}>Reports</h3>
              <p className={`${theme.textPrimary} text-sm mb-3`}>Download a beautiful PDF report of your progress.</p>
              <button
                  onClick={onExportToPDF}
                  className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export PDF Report
                </button>
          </div>

          <div className={`border-t ${theme.modalHeaderBorder}`}></div>

          <div>
              <h3 className={`text-lg font-semibold ${theme.textHeader} mb-2`}>Local Backup</h3>
              <p className={`${theme.textPrimary} text-sm mb-3`}>Save your data to a file on your device.</p>
               <button
                  onClick={onExportToFile}
                  className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Backup File
                </button>
          </div>
          
          <div className={`border-t ${theme.modalHeaderBorder}`}></div>

          <div>
              <h3 className={`text-lg font-semibold ${theme.textHeader} mb-2`}>Local Restore</h3>
              <p className={`${theme.textPrimary} text-sm mb-3`}>Restore data from a previously exported file.</p>
               <input type="file" accept=".json" ref={importFileRef} className="hidden" onChange={handleFileChange} aria-hidden="true" />
                <button
                  onClick={handleImportClick}
                  className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
                  </svg>
                  Import Backup File
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
