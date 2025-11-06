import React from 'react';
import { themes, Theme } from '../themes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (themeName: string) => void;
  theme: Theme['colors'];
  onSoundUpload: (file: File) => void;
  onResetSound: () => void;
  isCustomSoundSet: boolean;
  canInstall: boolean;
  onInstall: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    currentTheme, 
    onThemeChange, 
    theme,
    onSoundUpload,
    onResetSound,
    isCustomSoundSet,
    canInstall,
    onInstall,
}) => {
  if (!isOpen) return null;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSoundUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className={`${theme.modalBg} rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`p-4 border-b ${theme.modalHeaderBorder} flex justify-between items-center sticky top-0 ${theme.modalBg}/80 backdrop-blur-sm`}>
          <h2 id="settings-title" className={`text-2xl font-bold ${theme.textHeader}`}>Settings</h2>
          <button onClick={onClose} className={`${theme.textSecondary} hover:${theme.textPrimary} p-2 rounded-full ${theme.buttonHover} transition-colors`} aria-label="Close settings">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
            <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Color Theme</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.values(themes).map(themeOption => (
                        <button 
                            key={themeOption.name} 
                            onClick={() => onThemeChange(themeOption.name)}
                            className={`p-4 rounded-lg border-2 transition-all ${currentTheme === themeOption.name ? 'border-blue-500 shadow-md' : `${theme.listItemBorder} hover:border-gray-300`}`}
                            aria-pressed={currentTheme === themeOption.name}
                        >
                            <span className={`block mb-2 font-semibold ${theme.textPrimary}`}>{themeOption.displayName}</span>
                            <div className="flex h-8 w-full rounded overflow-hidden">
                                {themeOption.previewColors.map((color, index) => (
                                    <div key={index} style={{ backgroundColor: color, flex: 1 }} />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className={`border-t ${theme.modalHeaderBorder} my-6`}></div>

            <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Bead Sound</h3>
                <p className={`${theme.textSecondary} text-sm`}>
                    Current: {isCustomSoundSet ? 'Custom Sound' : 'Default Sound'}
                </p>
                <div className="flex items-center space-x-2">
                    <input
                        type="file"
                        accept="audio/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        aria-hidden="true"
                        id="sound-upload-input"
                    />
                    <button
                        onClick={handleUploadClick}
                        className={`w-full text-center px-4 py-2 ${theme.textPrimary} ${theme.cancelButton} ${theme.cancelButtonHover} rounded-lg font-semibold transition-colors`}
                        aria-label="Upload a custom bead sound"
                    >
                        Upload Sound
                    </button>
                    <button
                        onClick={onResetSound}
                        disabled={!isCustomSoundSet}
                        className={`px-4 py-2 ${theme.textSecondary} hover:${theme.textPrimary} ${theme.buttonHover} rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Reset bead sound to default"
                    >
                        Reset
                    </button>
                </div>
            </div>
            {canInstall && (
              <>
                <div className={`border-t ${theme.modalHeaderBorder} my-6`}></div>
                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Install App</h3>
                  <p className={`${theme.textSecondary} text-sm`}>
                    Install this app on your device for quick access and offline use.
                  </p>
                  <button
                    onClick={onInstall}
                    className={`w-full flex items-center justify-center text-center px-4 py-2 ${theme.textPrimary} ${theme.cancelButton} ${theme.cancelButtonHover} rounded-lg font-semibold transition-colors`}
                    aria-label="Install the application"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Install App
                  </button>
                </div>
              </>
            )}
        </main>
      </div>
      <style>{`
        @keyframes modal-enter { to { opacity: 1; transform: scale(1); } }
        .animate-modal-enter { animation: modal-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
      `}</style>
    </div>
  );
};

export default SettingsModal;