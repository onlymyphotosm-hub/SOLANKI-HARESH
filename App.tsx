import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PROFILES, ProfileName, LOCAL_STORAGE_PROFILE_KEY, LOCAL_STORAGE_COUNTS_KEY, LOCAL_STORAGE_HISTORY_KEY, BEAD_CLICK_SOUND, ROUND_COMPLETE_SOUND, LOCAL_STORAGE_THEME_KEY, LOCAL_STORAGE_CUSTOM_SOUND_KEY } from './constants';
import CircularProgress from './components/CircularProgress';
import CelebrationModal from './components/CelebrationModal';
import HistoryModal, { HistoryEntry } from './components/HistoryModal';
import DataModal from './components/DataModal';
import ConfirmModal from './components/ConfirmModal';
import SettingsModal from './components/SettingsModal';
import { themes } from './themes';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface DayData {
  beadCount: number;
  roundCount: number;
  lastVisitDate: string;
  targetReachedToday: boolean;
}

interface BackupData {
  counts: DayData;
  history: HistoryEntry[];
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILE_NAME_BASE = 'mala_counter_backup.json';


const App: React.FC = () => {
  const [profile, setProfile] = useState<ProfileName>(() => {
    const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    return (savedProfile && (savedProfile === 'OM' || savedProfile === 'Satnaam')) ? savedProfile : 'OM';
  });
  
  const [counts, setCounts] = useState<DayData>({
    beadCount: 0,
    roundCount: 0,
    lastVisitDate: new Date().toISOString().slice(0, 10),
    targetReachedToday: false,
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [themeName, setThemeName] = useState<string>(localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'amber');
  const [beadSound, setBeadSound] = useState<string>(BEAD_CLICK_SOUND);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showData, setShowData] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void}>({
      title: '', message: '', onConfirm: () => {},
  });
  
  const beadAudioRef = useRef<HTMLAudioElement | null>(null);
  const roundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Google Auth state
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  
  // UI state for data modal
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const activeTheme = themes[themeName];
  const activeProfile = PROFILES[profile];

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, profile);
  }, [profile]);
  
  // Load data from localStorage on initial render or profile change
  useEffect(() => {
    const customSound = localStorage.getItem(LOCAL_STORAGE_CUSTOM_SOUND_KEY);
    setBeadSound(customSound || BEAD_CLICK_SOUND);
    roundAudioRef.current = new Audio(ROUND_COMPLETE_SOUND);

    const countsKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_COUNTS_KEY}`;
    const historyKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_HISTORY_KEY}`;
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const savedDataRaw = localStorage.getItem(countsKey);
    const savedHistoryRaw = localStorage.getItem(historyKey);
    
    const loadedHistory: HistoryEntry[] = savedHistoryRaw ? JSON.parse(savedHistoryRaw) : [];
    
    if (savedDataRaw) {
      const savedData: DayData = JSON.parse(savedDataRaw);
      
      if (savedData.lastVisitDate !== todayStr) {
        if (savedData.roundCount > 0 || savedData.beadCount > 0) {
            const yesterdayEntry = {
                date: savedData.lastVisitDate,
                rounds: savedData.roundCount,
            };
            if (!loadedHistory.some(h => h.date === yesterdayEntry.date)) {
                const newHistory = [yesterdayEntry, ...loadedHistory];
                setHistory(newHistory);
                localStorage.setItem(historyKey, JSON.stringify(newHistory));
            }
        }
        setCounts({ beadCount: 0, roundCount: 0, lastVisitDate: todayStr, targetReachedToday: false });
      } else {
        setCounts(savedData);
      }
    } else {
        setCounts({ beadCount: 0, roundCount: 0, lastVisitDate: todayStr, targetReachedToday: false });
    }
    setHistory(loadedHistory);
  }, [profile]);
  
  // Update bead audio object when sound source changes
  useEffect(() => {
    beadAudioRef.current = new Audio(beadSound);
  }, [beadSound]);

  // Save theme to localStorage and update meta tag/body class
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, themeName);
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", activeTheme.colors.metaThemeColor);
    }
    document.body.className = activeTheme.colors.background;
  }, [themeName, activeTheme]);
  
  // Initialize Google API Client
  useEffect(() => {
      const gapiLoad = () => window.gapi.load('client', () => {
          window.gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: [DISCOVERY_DOC],
          }).then(() => {
              const client = window.google.accounts.oauth2.initTokenClient({
                  client_id: CLIENT_ID,
                  scope: SCOPES,
                  callback: (tokenResponse: any) => {
                      if (tokenResponse && tokenResponse.access_token) {
                          window.gapi.client.setToken(tokenResponse);
                          setIsSignedIn(true);
                      }
                  },
              });
              setTokenClient(client);
              setApiReady(true);
          });
      });
      if (window.gapi) gapiLoad();
  }, []);

  // Save counts to localStorage whenever they change
  useEffect(() => {
    const countsKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_COUNTS_KEY}`;
    localStorage.setItem(countsKey, JSON.stringify(counts));
  }, [counts, profile]);


  const handleBeadIncrement = useCallback(() => {
    if (beadAudioRef.current) {
      beadAudioRef.current.currentTime = 0;
      beadAudioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);

    setCounts(prevCounts => {
      const newBeadCount = prevCounts.beadCount + 1;
      let shouldCelebrate = false;

      if (newBeadCount >= activeProfile.beadsPerRound) {
        const newRoundCount = prevCounts.roundCount + 1;
        setTimeout(() => { roundAudioRef.current?.play().catch(e => console.error("Error playing sound:", e)); }, 50);

        const totalBeadsAfterRound = newRoundCount * activeProfile.beadsPerRound;
        if (activeProfile.dailyGoal.type === 'rounds') {
          if (newRoundCount >= activeProfile.dailyGoal.value && !prevCounts.targetReachedToday) { shouldCelebrate = true; }
        } else { // 'beads'
          if (totalBeadsAfterRound >= activeProfile.dailyGoal.value && !prevCounts.targetReachedToday) { shouldCelebrate = true; }
        }

        if (shouldCelebrate) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
        return { ...prevCounts, beadCount: 0, roundCount: newRoundCount, targetReachedToday: prevCounts.targetReachedToday || shouldCelebrate };
      } else {
        const totalBeadsMidRound = prevCounts.roundCount * activeProfile.beadsPerRound + newBeadCount;
        if (activeProfile.dailyGoal.type === 'beads' && totalBeadsMidRound >= activeProfile.dailyGoal.value && !prevCounts.targetReachedToday) {
            shouldCelebrate = true;
        }

        if (shouldCelebrate) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
        return { ...prevCounts, beadCount: newBeadCount, targetReachedToday: prevCounts.targetReachedToday || shouldCelebrate };
      }
    });
  }, [profile, activeProfile.beadsPerRound, activeProfile.dailyGoal]);

  const showResetConfirm = () => {
    setConfirmConfig({
        title: 'Reset Progress?',
        message: "Are you sure you want to reset today's progress? This can't be undone.",
        onConfirm: () => {
            setCounts(prev => ({ ...prev, beadCount: 0, roundCount: 0, targetReachedToday: false }));
        },
    });
    setShowConfirm(true);
  };
  
  const handleSoundUpload = (file: File) => {
    if (file && file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
                localStorage.setItem(LOCAL_STORAGE_CUSTOM_SOUND_KEY, dataUrl);
                setBeadSound(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    } else {
        alert("Please select a valid audio file.");
    }
  };

  const handleResetSound = () => {
    localStorage.removeItem(LOCAL_STORAGE_CUSTOM_SOUND_KEY);
    setBeadSound(BEAD_CLICK_SOUND);
  };

  // --- Google Drive Functions ---
  const handleSignIn = () => { if (tokenClient) tokenClient.requestAccessToken(); };

  const getFileId = async (): Promise<string | null> => {
      const backupFileName = `${activeProfile.name}_${BACKUP_FILE_NAME_BASE}`;
      const response = await window.gapi.client.drive.files.list({
          spaces: 'appDataFolder', fields: 'files(id, name)', q: `name='${backupFileName}'`,
      });
      return (response.result.files && response.result.files.length > 0) ? response.result.files[0].id : null;
  };

  const handleBackup = async () => {
      if (!isSignedIn) { setStatusMessage('Please sign in first.'); return; }
      setIsBackingUp(true); setStatusMessage('Backing up...');
      
      const backupData: BackupData = { counts, history };
      const file = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const fileId = await getFileId();
      const backupFileName = `${activeProfile.name}_${BACKUP_FILE_NAME_BASE}`;
      
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify({ name: backupFileName })], { type: 'application/json' }));
      formData.append('file', file);

      try {
          await window.gapi.client.request({
              path: `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
              method: fileId ? 'PATCH' : 'POST',
              params: { uploadType: 'multipart' },
              body: formData,
          });
          setStatusMessage('Backup successful!');
      } catch (error) {
          setStatusMessage('Backup failed. Please try again.');
          console.error("Backup error:", error);
      } finally {
          setIsBackingUp(false);
          setTimeout(() => setStatusMessage(''), 3000);
      }
  };

  const handleRestore = async () => {
      if (!isSignedIn) { setStatusMessage('Please sign in first.'); return; }
      setIsRestoring(true); setStatusMessage('Restoring...');
      
      const fileId = await getFileId();
      if (!fileId) {
          setStatusMessage('No backup file found.');
          setIsRestoring(false);
          setTimeout(() => setStatusMessage(''), 3000);
          return;
      }

      try {
          const response = await window.gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
          const backupData: BackupData = JSON.parse(response.body);
          if (backupData && backupData.counts && backupData.history) {
              setCounts(backupData.counts);
              setHistory(backupData.history);
              const historyKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_HISTORY_KEY}`;
              localStorage.setItem(historyKey, JSON.stringify(backupData.history));
              setStatusMessage('Restore successful!');
              setShowData(false);
          } else { throw new Error('Invalid backup file'); }
      } catch (error) {
          setStatusMessage('Restore failed. File may be corrupted.');
          console.error("Restore error:", error);
      } finally {
          setIsRestoring(false);
          setTimeout(() => setStatusMessage(''), 3000);
      }
  };

  const showRestoreConfirm = () => {
    setConfirmConfig({
        title: 'Restore Data?',
        message: "This will overwrite your current progress with the data from Google Drive. Are you sure?",
        onConfirm: handleRestore,
    });
    setShowConfirm(true);
  };
  
  const ProfileSwitcher = () => (
    <div className={`flex items-center p-1 rounded-full ${activeTheme.colors.accentLight} shadow-inner`}>
      {(Object.keys(PROFILES) as ProfileName[]).map(profileName => (
        <button
          key={profileName}
          onClick={() => setProfile(profileName)}
          className={`px-4 sm:px-6 py-2 text-sm sm:text-base font-bold rounded-full transition-all duration-300 ${profile === profileName ? `${activeTheme.colors.accent} ${activeTheme.colors.accentDark} shadow-md` : `${activeTheme.colors.textSecondary} hover:${activeTheme.colors.textPrimary}`}`}
        >
          {PROFILES[profileName].name}
        </button>
      ))}
    </div>
  );
  
  const goalText = profile === 'OM' 
    ? `Daily goal: ${activeProfile.dailyGoal.value} round(s).`
    : `Daily goal: ${activeProfile.dailyGoal.value} beads.`;

  const totalBeadsToday = counts.roundCount * activeProfile.beadsPerRound + counts.beadCount;
  const { progress, progressText } = (() => {
      if (activeProfile.dailyGoal.type === 'rounds') {
          return {
              progress: Math.min((counts.roundCount / activeProfile.dailyGoal.value) * 100, 100),
              progressText: `${counts.roundCount}/${activeProfile.dailyGoal.value}`
          };
      } else { // beads
          return {
              progress: Math.min((totalBeadsToday / activeProfile.dailyGoal.value) * 100, 100),
              progressText: `${totalBeadsToday}/${activeProfile.dailyGoal.value}`
          };
      }
  })();
  const progressBaseBg = activeTheme.colors.progressBase.replace('stroke-', 'bg-');
  const progressFillBg = activeTheme.colors.progressFill.replace('stroke-', 'bg-');

  return (
    <>
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 ${activeTheme.colors.textPrimary} select-none`}>
        <header className="absolute top-0 p-6 text-center w-full flex flex-col items-center">
          <h1 className={`text-3xl font-bold ${activeTheme.colors.textHeader}`}>{activeProfile.name} Jaap</h1>
          <p className={`${activeTheme.colors.textSecondary}`}>{goalText}</p>
          <div className="mt-4"><ProfileSwitcher /></div>
        </header>
        
        <main className="flex flex-col items-center justify-center text-center">
          <div className="mb-8">
            <span className={`text-xl ${activeTheme.colors.textSecondary}`}>Round</span>
            <p className={`text-6xl font-bold ${activeTheme.colors.accentDark}`}>{counts.roundCount}</p>
          </div>

          <button
            onClick={handleBeadIncrement}
            className="relative group w-80 h-80 md:w-96 md:h-96 flex items-center justify-center rounded-full focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-opacity-50 transition-transform duration-200 active:scale-95"
            aria-label="Increment bead count"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <CircularProgress progress={counts.beadCount / activeProfile.beadsPerRound} size={window.innerWidth < 768 ? 256 : 320} strokeWidth={12} baseColor={activeTheme.colors.progressBase} fillColor={activeTheme.colors.progressFill} />
            </div>
            <div
              className={`w-56 h-56 md:w-72 md:h-72 ${activeTheme.colors.accent} rounded-full shadow-lg group-hover:shadow-xl ${activeTheme.colors.accentActive} transition-all duration-200 flex items-center justify-center`}
            >
              <span className={`text-7xl font-light ${activeTheme.colors.accentDark} tracking-tighter`}>{counts.beadCount}</span>
              <span className={`absolute bottom-16 md:bottom-20 text-lg ${activeTheme.colors.textSecondary}`}>/ {activeProfile.beadsPerRound}</span>
            </div>
          </button>
        </main>

        <footer className="absolute bottom-0 left-0 right-0 w-full p-4 md:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-1 md:space-x-2">
                 <button
                    onClick={showResetConfirm}
                    className={`flex items-center space-x-2 px-3 py-2 ${activeTheme.colors.textSecondary} hover:${activeTheme.colors.textPrimary} ${activeTheme.colors.buttonHover} rounded-lg transition-colors`}
                    aria-label="Reset counters for the day"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                    <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                    onClick={() => setShowHistory(true)}
                    className={`flex items-center space-x-2 px-3 py-2 ${activeTheme.colors.textSecondary} hover:${activeTheme.colors.textPrimary} ${activeTheme.colors.buttonHover} rounded-lg transition-colors`}
                    aria-label="View history"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    <span className="hidden sm:inline">History</span>
                </button>
                <button
                        onClick={() => setShowData(true)}
                        disabled={!apiReady}
                        className={`flex items-center space-x-2 px-3 py-2 ${activeTheme.colors.textSecondary} hover:${activeTheme.colors.textPrimary} ${activeTheme.colors.buttonHover} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Manage data backup"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8a4 4 0 118 0v1a1 1 0 01-1 1H6a1 1 0 01-1-1V8zm2 0v1h4V8a2 2 0 10-4 0z"/><path d="M3 12a2 2 0 012-2h10a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z"/></svg>
                        <span className="hidden sm:inline">Data</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className={`flex items-center space-x-2 px-3 py-2 ${activeTheme.colors.textSecondary} hover:${activeTheme.colors.textPrimary} ${activeTheme.colors.buttonHover} rounded-lg transition-colors`}
                        aria-label="Open settings"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                        <span className="hidden sm:inline">Settings</span>
                    </button>
            </div>
            <div className="flex items-center space-x-2" aria-label={`Daily goal progress`}>
                <div className={`w-16 h-2 ${progressBaseBg} rounded-full overflow-hidden`}>
                    <div className={`h-full ${progressFillBg} transition-all duration-300 ease-in-out rounded-full`} style={{ width: `${progress}%` }}></div>
                </div>
                <span className={`text-sm font-medium ${activeTheme.colors.textSecondary}`}>
                    {progressText}
                </span>
            </div>
        </footer>
      </div>
      <CelebrationModal theme={activeTheme.colors} isOpen={showCelebration} onClose={() => setShowCelebration(false)} />
      <HistoryModal theme={activeTheme.colors} history={history} isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <DataModal
          theme={activeTheme.colors}
          isOpen={showData}
          onClose={() => setShowData(false)}
          onSignIn={handleSignIn}
          onBackup={handleBackup}
          onRestore={showRestoreConfirm}
          isSignedIn={isSignedIn}
          isBackingUp={isBackingUp}
          isRestoring={isRestoring}
          statusMessage={statusMessage}
      />
      <ConfirmModal 
          theme={activeTheme.colors}
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentTheme={themeName}
        onThemeChange={setThemeName}
        theme={activeTheme.colors}
        onSoundUpload={handleSoundUpload}
        onResetSound={handleResetSound}
        isCustomSoundSet={beadSound !== BEAD_CLICK_SOUND}
      />
    </>
  );
};

export default App;