
import React from 'react';
import { themes, Theme } from '../themes';

interface ProfileSettings {
    beadsPerRound: number;
    dailyGoal: {
        type: 'rounds' | 'beads';
        value: number;
    };
}

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
  currentProfileSettings?: ProfileSettings;
  onUpdateSettings?: (settings: ProfileSettings) => void;
  onResetSettings?: () => void;
  profileName?: string;
  isGoogleSignedIn?: boolean;
  autoSync?: boolean;
  onToggleAutoSync?: () => void;
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
    currentProfileSettings,
    onUpdateSettings,
    onResetSettings,
    profileName,
    isGoogleSignedIn,
    autoSync,
    onToggleAutoSync
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

  const handleGoalChange = (key: string, value: any) => {
      if (!currentProfileSettings || !onUpdateSettings) return;
      
      if (key === 'beadsPerRound') {
          onUpdateSettings({ ...currentProfileSettings, beadsPerRound: parseInt(value) || 0 });
      } else if (key === 'goalType') {
          onUpdateSettings({ 
              ...currentProfileSettings, 
              dailyGoal: { ...currentProfileSettings.dailyGoal, type: value } 
          });
      } else if (key === 'goalValue') {
           onUpdateSettings({ 
              ...currentProfileSettings, 
              dailyGoal: { ...currentProfileSettings.dailyGoal, value: parseInt(value) || 0 } 
          });
      }
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
        className={`${theme.modalBg} rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`p-4 border-b ${theme.modalHeaderBorder} flex justify-between items-center sticky top-0 ${theme.modalBg}/80 backdrop-blur-md rounded-t-2xl z-10`}>
          <h2 id="settings-title" className={`text-2xl font-bold ${theme.textHeader}`}>Settings</h2>
          <button onClick={onClose} className={`${theme.textSecondary} hover:${theme.textPrimary} p-2 rounded-full ${theme.buttonHover} transition-colors`} aria-label="Close settings">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto space-y-8">
            
            {/* Profile Goals Section */}
            {currentProfileSettings && onUpdateSettings && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                         <h3 className={`text-lg font-bold ${theme.textHeader}`}>Profile Goals ({profileName})</h3>
                         <button 
                            onClick={onResetSettings}
                            className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-black/5 ${theme.textSecondary} hover:bg-black/10 transition-colors`}
                         >
                            Defaults
                         </button>
                    </div>
                   
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Beads per Round</label>
                            <input 
                                type="number" 
                                min="1"
                                value={currentProfileSettings.beadsPerRound}
                                onChange={(e) => handleGoalChange('beadsPerRound', e.target.value)}
                                className={`w-full p-3 rounded-xl border ${theme.listItemBorder} bg-white shadow-sm font-bold ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                            />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Goal Type</label>
                                <select 
                                    value={currentProfileSettings.dailyGoal.type}
                                    onChange={(e) => handleGoalChange('goalType', e.target.value)}
                                    className={`w-full p-3 rounded-xl border ${theme.listItemBorder} bg-white shadow-sm font-bold ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                                >
                                    <option value="rounds">Rounds</option>
                                    <option value="beads">Beads</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Target</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={currentProfileSettings.dailyGoal.value}
                                    onChange={(e) => handleGoalChange('goalValue', e.target.value)}
                                    className={`w-full p-3 rounded-xl border ${theme.listItemBorder} bg-white shadow-sm font-bold ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cloud Auto-Sync Section */}
            {isGoogleSignedIn && (
                <div className="space-y-4 pt-2">
                    <h3 className={`text-lg font-bold ${theme.textHeader}`}>Cloud Sync</h3>
                    <div className={`p-4 rounded-2xl ${theme.listItemBackground} border ${theme.listItemBorder} flex items-center justify-between shadow-sm`}>
                        <div className="flex flex-col">
                            <span className={`font-bold ${theme.textPrimary}`}>Auto-Sync Counts</span>
                            <span className={`text-[10px] ${theme.textSecondary} uppercase font-black tracking-widest`}>Sync to Drive after activity</span>
                        </div>
                        <button 
                            onClick={onToggleAutoSync}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoSync ? 'bg-amber-500' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className={`text-lg font-bold ${theme.textHeader}`}>Appearance</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.values(themes).map(themeOption => (
                        <button 
                            key={themeOption.name} 
                            onClick={() => onThemeChange(themeOption.name)}
                            className={`p-3 rounded-2xl border-2 transition-all group overflow-hidden ${currentTheme === themeOption.name ? 'border-amber-500 shadow-md scale-[1.02]' : 'border-transparent bg-white/50 hover:bg-white'}`}
                        >
                            <span className={`block mb-2 text-[10px] font-black uppercase tracking-widest ${currentTheme === themeOption.name ? 'text-amber-600' : theme.textSecondary}`}>{themeOption.displayName}</span>
                            <div className="flex h-10 w-full rounded-lg overflow-hidden border border-black/5">
                                {themeOption.previewColors.map((color, index) => (
                                    <div key={index} style={{ backgroundColor: color, flex: 1 }} />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className={`text-lg font-bold ${theme.textHeader}`}>Sound Options</h3>
                <div className={`p-4 rounded-2xl ${theme.listItemBackground} border ${theme.listItemBorder} space-y-4 shadow-sm`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Mode</span>
                        <span className={`font-bold ${theme.textPrimary}`}>{isCustomSoundSet ? 'Custom Sound' : 'Default'}</span>
                    </div>
                    <div className="flex space-x-2">
                        <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="sound-upload-input" />
                        <button
                            onClick={handleUploadClick}
                            className="flex-1 py-2 text-xs font-bold rounded-xl bg-amber-500 text-white shadow-sm active:scale-95 transition-transform"
                        >
                            Upload New
                        </button>
                        <button
                            onClick={onResetSound}
                            disabled={!isCustomSoundSet}
                            className="flex-1 py-2 text-xs font-bold rounded-xl bg-black/5 text-gray-600 hover:bg-black/10 transition-colors disabled:opacity-30"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {canInstall && (
                <div className="pt-4 pb-2">
                  <button
                    onClick={onInstall}
                    className="w-full flex items-center justify-center py-4 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-600/20 font-bold active:scale-95 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Install for Offline Use
                  </button>
                </div>
            )}
        </main>
      </div>
      <style>{`
        @keyframes modal-enter { to { opacity: 1; transform: scale(1); } }
        .animate-modal-enter { animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default SettingsModal;
