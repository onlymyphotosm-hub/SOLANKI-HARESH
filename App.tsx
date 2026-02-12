
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PROFILES, ProfileName, LOCAL_STORAGE_PROFILE_KEY, LOCAL_STORAGE_COUNTS_KEY, LOCAL_STORAGE_HISTORY_KEY, BEAD_CLICK_SOUND, ROUND_COMPLETE_SOUND, LOCAL_STORAGE_THEME_KEY, LOCAL_STORAGE_CUSTOM_SOUND_KEY, LOCAL_STORAGE_STREAK_KEY, LOCAL_STORAGE_PROFILE_SETTINGS_KEY, GOOGLE_CLIENT_ID, GOOGLE_API_KEY, BACKUP_FILE_NAME } from './constants';
import CircularProgress from './components/CircularProgress';
import CelebrationModal from './components/CelebrationModal';
import HistoryModal, { HistoryEntry } from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import DataModal from './components/DataModal';
import { themes } from './themes';
import { generateMalaReport } from './utils/pdfGenerator';

const LOCAL_STORAGE_AUTO_SYNC_KEY = 'malaCounterAutoSync';

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

interface StreakData {
  count: number;
  lastDate: string | null;
}

interface ProfileSettings {
    beadsPerRound: number;
    dailyGoal: {
        type: 'rounds' | 'beads';
        value: number;
    };
}

const App: React.FC = () => {
  const getInitialProfile = (): ProfileName => {
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      return (savedProfile && Object.keys(PROFILES).includes(savedProfile)) ? (savedProfile as ProfileName) : 'OM';
  };

  const [profile, setProfile] = useState<ProfileName>(getInitialProfile);
  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  const [isGoogleClientReady, setIsGoogleClientReady] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [isTapping, setIsTapping] = useState(false);
  const tokenClient = useRef<any>(null);
  
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_AUTO_SYNC_KEY) === 'true';
  });

  const [customProfileSettings, setCustomProfileSettings] = useState<Record<ProfileName, ProfileSettings>>(() => {
    const defaults: Record<ProfileName, ProfileSettings> = {} as any;
    (Object.keys(PROFILES) as ProfileName[]).forEach(key => {
        defaults[key] = {
            beadsPerRound: PROFILES[key].beadsPerRound,
            dailyGoal: PROFILES[key].dailyGoal
        };
    });

    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_PROFILE_SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                const merged = { ...defaults };
                Object.keys(parsed).forEach(k => {
                    const pKey = k as ProfileName;
                    if (merged[pKey] && parsed[k]) {
                         merged[pKey] = {
                             ...merged[pKey],
                             ...parsed[k],
                             dailyGoal: {
                                 ...merged[pKey].dailyGoal,
                                 ...(parsed[k].dailyGoal || {})
                             }
                         };
                    }
                });
                return merged;
            }
        }
    } catch (e) {
        console.error("Error loading profile settings", e);
    }
    return defaults;
  });
  
  const [counts, setCounts] = useState<DayData>(() => {
    const p = getInitialProfile();
    const key = `${PROFILES[p].storageKeyPrefix}_${LOCAL_STORAGE_COUNTS_KEY}`;
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object' && typeof parsed.roundCount === 'number') {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Error lazy loading counts", e);
    }
    return {
        beadCount: 0,
        roundCount: 0,
        lastVisitDate: new Date().toISOString().slice(0, 10),
        targetReachedToday: false,
    };
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [streak, setStreak] = useState<StreakData>(() => {
      const p = getInitialProfile();
      const key = `${PROFILES[p].storageKeyPrefix}_${LOCAL_STORAGE_STREAK_KEY}`;
      try {
          const saved = localStorage.getItem(key);
          if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && typeof parsed === 'object' && typeof parsed.count === 'number') {
                  return parsed;
              }
          }
      } catch (e) {
          console.error("Error lazy loading streak", e);
      }
      return { count: 0, lastDate: null };
  });

  const [themeName, setThemeName] = useState<string>(localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'amber');
  const [beadSound, setBeadSound] = useState<string>(BEAD_CLICK_SOUND);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showDataModal, setShowDataModal] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const beadAudioRef = useRef<HTMLAudioElement | null>(null);
  const roundAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const activeTheme = themes[themeName];
  
  const activeProfile = useMemo(() => ({
      ...PROFILES[profile],
      ...customProfileSettings[profile]
  }), [profile, customProfileSettings]);

  useEffect(() => {
    const initGoogleClient = () => {
      if (!window.gapi || !window.google) return;
      window.gapi.load('client', async () => {
        try {
           await window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          
          if (GOOGLE_CLIENT_ID) {
            tokenClient.current = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.appdata',
                callback: (tokenResponse: any) => {
                    if (tokenResponse && tokenResponse.access_token) {
                       setIsGoogleSignedIn(true);
                       setBackupStatus('Signed in');
                    }
                },
            });
            setIsGoogleClientReady(true);
          } else {
             console.warn("Google Client ID is missing. Cloud sync will be unavailable.");
          }
        } catch (error) {
           console.error("Error initializing Google Client", error);
           setBackupStatus('Failed to init Google Client');
        }
      });
    };
    const interval = setInterval(() => {
        if (window.gapi && window.google) {
            clearInterval(interval);
            initGoogleClient();
        }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
        alert("Please configure GOOGLE_CLIENT_ID and GOOGLE_API_KEY in constants.ts to use this feature.");
        return;
    }
    if (tokenClient.current) {
      tokenClient.current.requestAccessToken();
    }
  };

  const handleGoogleLogout = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            window.gapi.client.setToken('');
            setIsGoogleSignedIn(false);
            setBackupStatus('');
        });
    }
  };

  const gatherAllData = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('malaCounter')) {
            data[key] = localStorage.getItem(key);
        }
    }
    return data;
  };

  const processRestoreData = (data: any) => {
        if (typeof data === 'object' && data !== null) {
            const hasValidKeys = Object.keys(data).some(k => k.includes('malaCounter'));
            if (!hasValidKeys && Object.keys(data).length > 0) {
                if (!window.confirm("The data found doesn't look like a standard backup. Try to restore anyway?")) return;
            }
            Object.keys(data).forEach(key => {
                if (key.includes('malaCounter')) {
                    let value = data[key];
                    if (typeof value === 'object' && value !== null) {
                        value = JSON.stringify(value);
                    }
                    if (value !== null && value !== undefined) {
                        localStorage.setItem(key, String(value));
                    }
                }
            });
            alert('Restored successfully from Drive! Reloading...');
            window.location.reload();
        } else {
            alert('Invalid backup format.');
        }
  };

  const handleDriveBackup = async () => {
      setBackupStatus('Syncing...');
      try {
        const data = gatherAllData();
        const fileContent = JSON.stringify(data);
        const file = new Blob([fileContent], {type: 'application/json'});
        const metadata = { name: BACKUP_FILE_NAME, mimeType: 'application/json', parents: ['appDataFolder'] };
        const listResponse = await window.gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILE_NAME}' and 'appDataFolder' in parents`,
            fields: 'files(id, name)',
            spaces: 'appDataFolder'
        });
        if (listResponse.result.files && listResponse.result.files.length > 0) {
            const fileId = listResponse.result.files[0].id;
            const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify({ mimeType: 'application/json' })], { type: 'application/json' }));
            form.append('file', file);
            await fetch(updateUrl, { method: 'PATCH', headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }), body: form });
            setBackupStatus(`Synced: ${new Date().toLocaleTimeString()}`);
        } else {
            const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);
            await fetch(createUrl, { method: 'POST', headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }), body: form });
            setBackupStatus(`Synced: ${new Date().toLocaleTimeString()}`);
        }
      } catch (error) {
          console.error('Backup failed', error);
          setBackupStatus('Sync Failed');
      }
  };

  const handleDriveRestore = async () => {
      setBackupStatus('Searching...');
      try {
          const listResponse = await window.gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILE_NAME}' and 'appDataFolder' in parents`,
            fields: 'files(id, name)',
            spaces: 'appDataFolder'
        });
        if (listResponse.result.files && listResponse.result.files.length > 0) {
            const fileId = listResponse.result.files[0].id;
            setBackupStatus('Downloading...');
            const response = await window.gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
            processRestoreData(response.result);
        } else {
            setBackupStatus('No backup');
            alert('No backup file found in Drive.');
        }
      } catch (error) {
          console.error('Restore failed', error);
          setBackupStatus('Restore failed');
      }
  };

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_AUTO_SYNC_KEY, autoSync.toString());
  }, [autoSync]);

  useEffect(() => {
    if (!autoSync || !isGoogleSignedIn || !isLoaded) return;
    const timer = setTimeout(() => {
        handleDriveBackup();
    }, 5000);
    return () => clearTimeout(timer);
  }, [counts, autoSync, isGoogleSignedIn, isLoaded]);

  useEffect(() => {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_SETTINGS_KEY, JSON.stringify(customProfileSettings));
  }, [customProfileSettings]);

  const updateProfileSettings = (newSettings: ProfileSettings) => {
      setCustomProfileSettings(prev => ({ ...prev, [profile]: newSettings }));
  };

  const resetProfileSettings = () => {
      setCustomProfileSettings(prev => ({ ...prev, [profile]: { beadsPerRound: PROFILES[profile].beadsPerRound, dailyGoal: PROFILES[profile].dailyGoal } }));
  };

  const totalLifetimeBeads = useMemo(() => {
    const historyBeads = history.reduce((acc, entry) => acc + (entry.rounds * activeProfile.beadsPerRound), 0);
    const todayBeads = (counts.roundCount * activeProfile.beadsPerRound) + counts.beadCount;
    return historyBeads + todayBeads;
  }, [history, counts, activeProfile.beadsPerRound]);

  const todayTotalBeads = useMemo(() => {
    return (counts.roundCount * activeProfile.beadsPerRound) + counts.beadCount;
  }, [counts, activeProfile.beadsPerRound]);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => { window.removeEventListener('beforeinstallprompt', handler); };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => { setInstallPrompt(null); });
  };

  const handleProfileSwitch = (newProfile: ProfileName) => {
      if (newProfile === profile) return;
      setIsLoaded(false);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, newProfile);
  };
  
  useEffect(() => {
    const customSound = localStorage.getItem(LOCAL_STORAGE_CUSTOM_SOUND_KEY);
    setBeadSound(customSound || BEAD_CLICK_SOUND);
    roundAudioRef.current = new Audio(ROUND_COMPLETE_SOUND);
    const countsKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_COUNTS_KEY}`;
    const historyKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_HISTORY_KEY}`;
    const streakKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_STREAK_KEY}`;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const savedStreakRaw = localStorage.getItem(streakKey);
    let savedStreak: StreakData = { count: 0, lastDate: null };
    if (savedStreakRaw) { try { const parsed = JSON.parse(savedStreakRaw); if (parsed && typeof parsed === 'object') savedStreak = parsed; } catch(e) {} }
    if (savedStreak.lastDate !== todayStr && savedStreak.lastDate !== yesterdayStr) { setStreak({ count: 0, lastDate: null }); } else { setStreak(savedStreak); }
    const savedDataRaw = localStorage.getItem(countsKey);
    const savedHistoryRaw = localStorage.getItem(historyKey);
    let loadedHistory: HistoryEntry[] = [];
    if (savedHistoryRaw) { try { const parsed = JSON.parse(savedHistoryRaw); if (Array.isArray(parsed)) loadedHistory = parsed; } catch (e) {} }
    if (savedDataRaw) {
      let savedData: DayData = { beadCount: 0, roundCount: 0, lastVisitDate: todayStr, targetReachedToday: false };
      try { const parsed = JSON.parse(savedDataRaw); if (parsed && typeof parsed === 'object') savedData = parsed; } catch (e) {}
      if (savedData.lastVisitDate !== todayStr) {
        if (savedData.roundCount > 0 || savedData.beadCount > 0) {
            const yesterdayEntry = { date: savedData.lastVisitDate, rounds: savedData.roundCount };
            if (!loadedHistory.some(h => h.date === yesterdayEntry.date)) {
                const newHistory = [yesterdayEntry, ...loadedHistory];
                loadedHistory.unshift(yesterdayEntry);
                setHistory(newHistory);
                localStorage.setItem(historyKey, JSON.stringify(newHistory));
            }
        }
        setCounts({ beadCount: 0, roundCount: 0, lastVisitDate: todayStr, targetReachedToday: false });
      } else { setCounts(savedData); }
    } else { setCounts({ beadCount: 0, roundCount: 0, lastVisitDate: todayStr, targetReachedToday: false }); }
    setHistory(loadedHistory);
    setIsLoaded(true);
  }, [profile]);
  
  useEffect(() => { 
    if (beadSound) {
        beadAudioRef.current = new Audio(beadSound); 
    }
  }, [beadSound]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, themeName);
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) { metaThemeColor.setAttribute("content", activeTheme.colors.metaThemeColor); }
    document.body.className = activeTheme.colors.background;
  }, [themeName, activeTheme]);
  
  useEffect(() => {
    if (!isLoaded) return;
    const countsKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_COUNTS_KEY}`;
    localStorage.setItem(countsKey, JSON.stringify(counts));
  }, [counts, profile, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const streakKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_STREAK_KEY}`;
    localStorage.setItem(streakKey, JSON.stringify(streak));
  }, [streak, profile, isLoaded]);

  const handleBeadIncrement = useCallback(() => {
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 150);
    
    if (beadAudioRef.current) { beadAudioRef.current.currentTime = 0; beadAudioRef.current.play().catch(e => console.error(e)); }
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
    const oldTargetReached = counts.targetReachedToday;
    let newBeadCount = counts.beadCount + 1;
    let newRoundCount = counts.roundCount;
    if (newBeadCount >= activeProfile.beadsPerRound) { newRoundCount += 1; newBeadCount = 0; setTimeout(() => { roundAudioRef.current?.play().catch(e => console.error(e)); }, 50); }
    const nextCounts = { ...counts, beadCount: newBeadCount, roundCount: newRoundCount };
    let shouldCelebrate = false;
    const totalToday = nextCounts.roundCount * activeProfile.beadsPerRound + nextCounts.beadCount;
    if (activeProfile.dailyGoal.type === 'rounds') { if (nextCounts.roundCount >= activeProfile.dailyGoal.value && !oldTargetReached) shouldCelebrate = true; } 
    else { if (totalToday >= activeProfile.dailyGoal.value && !oldTargetReached) shouldCelebrate = true; }
    if (shouldCelebrate) {
        nextCounts.targetReachedToday = true;
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
        const todayStr = new Date().toISOString().slice(0, 10);
        setStreak(prevStreak => {
            if (prevStreak.lastDate === todayStr) return prevStreak;
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            const newCount = prevStreak.lastDate === yesterdayStr ? prevStreak.count + 1 : 1;
            return { count: newCount, lastDate: todayStr };
        });
    }
    setCounts(nextCounts);
  }, [counts, profile, activeProfile.beadsPerRound, activeProfile.dailyGoal]);

  const handleHistoryEdit = (index: number, updatedEntry: HistoryEntry) => {
      const newHistory = [...history];
      newHistory[index] = updatedEntry;
      newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(newHistory);
      if (isLoaded) { const historyKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_HISTORY_KEY}`; localStorage.setItem(historyKey, JSON.stringify(newHistory)); }
  };
  
  const handleSoundUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { const dataUrl = e.target?.result as string; if (dataUrl) { localStorage.setItem(LOCAL_STORAGE_CUSTOM_SOUND_KEY, dataUrl); setBeadSound(dataUrl); } };
    reader.readAsDataURL(file);
  };

  const handleExportData = () => {
    const data = gatherAllData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `mala-counter-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { try { const data = JSON.parse(e.target?.result as string); processRestoreData(data); } catch (error) { alert('Invalid backup file.'); } };
    reader.readAsText(file); setShowDataModal(false);
  };

  const goalText = activeProfile.dailyGoal.type === 'rounds' ? `Goal: ${activeProfile.dailyGoal.value} round(s)` : `Goal: ${activeProfile.dailyGoal.value} beads`;
  const { progress, progressText } = (() => {
      const totalToday = counts.roundCount * activeProfile.beadsPerRound + counts.beadCount;
      if (activeProfile.dailyGoal.type === 'rounds') { return { progress: Math.min((counts.roundCount / activeProfile.dailyGoal.value) * 100, 100), progressText: `${counts.roundCount}/${activeProfile.dailyGoal.value}` }; } 
      else { return { progress: Math.min((totalToday / activeProfile.dailyGoal.value) * 100, 100), progressText: `${totalToday}/${activeProfile.dailyGoal.value}` }; }
  })();
  const progressFillBg = activeTheme.colors.progressFill.replace('stroke-', 'bg-');

  return (
    <>
      <div className={`min-h-screen w-full flex flex-col items-center p-4 ${activeTheme.colors.textPrimary} select-none relative overflow-hidden`}>
        {/* Header Section */}
        <header className="w-full pt-6 pb-2 flex flex-col items-center z-10">
          <div className="flex flex-col items-center">
             <h1 className={`text-4xl font-black ${activeTheme.colors.textHeader} tracking-tight`}>{activeProfile.name}</h1>
             <p className={`text-[10px] font-bold uppercase tracking-widest ${activeTheme.colors.textSecondary} mt-1 opacity-70`}>{goalText}</p>
          </div>
          
          <div className="mt-6 w-full max-w-sm">
             <ProfileSwitcher profile={profile} onSwitch={handleProfileSwitch} theme={activeTheme} />
          </div>
        </header>
        
        {/* Main Content (Flexible Center) */}
        <main 
            className={`flex-1 w-full flex flex-col items-center justify-center space-y-8 relative z-0 cursor-pointer touch-manipulation transition-all duration-150 ${isTapping ? 'bg-black/5' : 'bg-transparent'}`}
            onClick={handleBeadIncrement}
        >
          {/* Stats Grid - Moved into the main flow for better alignment */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-md px-2 pointer-events-none">
             <StatCard label="Round" value={counts.roundCount} theme={activeTheme} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9" /></svg>} />
             <StatCard label="Today" value={todayTotalBeads} theme={activeTheme} />
             <StatCard label="Total" value={totalLifetimeBeads} theme={activeTheme} />
             <StatCard label="Streak" value={streak.count} theme={activeTheme} icon="🔥" active={streak.count > 0} />
          </div>

          {/* Central Counter Visual - Self-centering within the flexible main area */}
          <div className="relative group pointer-events-none flex items-center justify-center p-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <CircularProgress 
                progress={counts.beadCount / activeProfile.beadsPerRound} 
                size={Math.min(window.innerWidth * 0.8, 320)} 
                strokeWidth={14} 
                baseColor={activeTheme.colors.progressBase} 
                fillColor={activeTheme.colors.progressFill} 
              />
            </div>
            <div className={`w-56 h-56 md:w-64 md:h-64 ${activeTheme.colors.cardBg} backdrop-blur-md rounded-full shadow-2xl flex flex-col items-center justify-center border border-white/40`}>
              <span className={`text-8xl md:text-9xl font-black ${activeTheme.colors.textHeader} tracking-tighter leading-none`}>
                {counts.beadCount}
              </span>
              <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${activeTheme.colors.textSecondary} -mt-2 opacity-60`}>
                of {activeProfile.beadsPerRound}
              </span>
            </div>
          </div>
        </main>

        {/* Footer Section */}
        <footer className="w-full pb-6 flex flex-col items-center space-y-6 z-10">
            {/* Progress Bar Container */}
            <div className={`w-full max-w-sm flex flex-col items-center space-y-2 p-3 rounded-2xl ${activeTheme.colors.cardBg} backdrop-blur-sm border border-white/40 shadow-sm`}>
                <div className="w-full flex justify-between items-center px-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeTheme.colors.textSecondary}`}>Daily Progress</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeTheme.colors.textSecondary}`}>{progressText}</span>
                </div>
                <div className={`w-full h-1.5 bg-black/5 rounded-full overflow-hidden`}>
                    <div className={`h-full ${progressFillBg} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-3">
                 <IconButton onClick={() => setShowHistory(true)} theme={activeTheme} ariaLabel="Stats" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
                 <IconButton onClick={() => setShowDataModal(true)} theme={activeTheme} ariaLabel="Data" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                 <IconButton onClick={() => setShowSettings(true)} theme={activeTheme} ariaLabel="Settings" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            </div>
        </footer>
      </div>
      <CelebrationModal theme={activeTheme.colors} isOpen={showCelebration} onClose={() => setShowCelebration(false)} />
      <HistoryModal 
        theme={activeTheme.colors} 
        history={history} 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        beadsPerRound={activeProfile.beadsPerRound}
        onEditEntry={handleHistoryEdit}
        todayBeads={todayTotalBeads}
      />
      <DataModal isOpen={showDataModal} onClose={() => setShowDataModal(false)} theme={activeTheme.colors} onExportToFile={handleExportData} onImportFromFile={handleImportData} onExportToPDF={() => generateMalaReport([], activeTheme.colors)} isGoogleSignedIn={isGoogleSignedIn} onGoogleLogin={handleGoogleLogin} onGoogleLogout={handleGoogleLogout} onDriveBackup={handleDriveBackup} onDriveRestore={handleDriveRestore} driveStatus={backupStatus} />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        currentTheme={themeName} 
        onThemeChange={setThemeName} 
        theme={activeTheme.colors} 
        onSoundUpload={handleSoundUpload} 
        onResetSound={() => {localStorage.removeItem(LOCAL_STORAGE_CUSTOM_SOUND_KEY); setBeadSound(BEAD_CLICK_SOUND);}} 
        isCustomSoundSet={beadSound !== BEAD_CLICK_SOUND} 
        canInstall={!!installPrompt} 
        onInstall={handleInstallClick} 
        currentProfileSettings={customProfileSettings[profile]} 
        onUpdateSettings={updateProfileSettings} 
        onResetSettings={resetProfileSettings} 
        profileName={activeProfile.name} 
        isGoogleSignedIn={isGoogleSignedIn}
        autoSync={autoSync}
        onToggleAutoSync={() => setAutoSync(!autoSync)}
      />
    </>
  );
};

const StatCard = ({ label, value, theme, icon, active = true }: any) => (
  <div className={`flex flex-col items-center justify-center p-2 rounded-xl border border-white/40 ${theme.colors.cardBg} backdrop-blur-sm shadow-sm transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>
    <span className={`text-[9px] font-black uppercase tracking-widest ${theme.colors.textSecondary} opacity-60 mb-0.5`}>{label}</span>
    <div className={`flex items-center space-x-1`}>
       {icon && <span className={`${theme.colors.textHeader} opacity-80 scale-75`}>{icon}</span>}
       <span className={`text-sm font-black ${theme.colors.textHeader}`}>{value.toLocaleString()}</span>
    </div>
  </div>
);

const IconButton = ({ onClick, theme, ariaLabel, icon }: any) => (
  <button onClick={onClick} className={`p-4 ${theme.colors.cardBg} backdrop-blur-md border border-white/40 shadow-lg rounded-2xl ${theme.colors.textHeader} active:scale-90 transition-all`} aria-label={ariaLabel}>
    {icon}
  </button>
);

const ProfileSwitcher = ({ profile, onSwitch, theme }: any) => (
    <div className={`relative flex p-1 rounded-2xl bg-black/5 shadow-inner backdrop-blur-sm`}>
      {(Object.keys(PROFILES) as ProfileName[]).map(p => {
        const isActive = profile === p;
        return (
          <button 
            key={p} 
            onClick={() => onSwitch(p)} 
            className={`relative flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 z-10 ${isActive ? theme.colors.textHeader : theme.colors.textSecondary + ' opacity-60'}`}
          >
            {PROFILES[p].name}
            {isActive && <div className={`absolute inset-0 ${theme.colors.accent} shadow-md rounded-xl -z-10 animate-in fade-in zoom-in duration-300`} />}
          </button>
        );
      })}
    </div>
);

export default App;
