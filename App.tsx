
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PROFILES, ProfileName, LOCAL_STORAGE_PROFILE_KEY, LOCAL_STORAGE_COUNTS_KEY, LOCAL_STORAGE_HISTORY_KEY, BEAD_CLICK_SOUND, ROUND_COMPLETE_SOUND, LOCAL_STORAGE_THEME_KEY, LOCAL_STORAGE_CUSTOM_SOUND_KEY, LOCAL_STORAGE_STREAK_KEY, LOCAL_STORAGE_PROFILE_SETTINGS_KEY, GOOGLE_CLIENT_ID, GOOGLE_API_KEY, BACKUP_FILE_NAME } from './constants';
import CircularProgress from './components/CircularProgress';
import CelebrationModal from './components/CelebrationModal';
import HistoryModal, { HistoryEntry } from './components/HistoryModal';
import ConfirmModal from './components/ConfirmModal';
import SettingsModal from './components/SettingsModal';
import DataModal from './components/DataModal';
import { themes } from './themes';
import { generateMalaReport } from './utils/pdfGenerator';

// Add global types for Google API
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
  // Helper to safely get the initial profile synchronously
  const getInitialProfile = (): ProfileName => {
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      return (savedProfile && Object.keys(PROFILES).includes(savedProfile)) ? (savedProfile as ProfileName) : 'OM';
  };

  const [profile, setProfile] = useState<ProfileName>(getInitialProfile);
  
  // Guard to prevent saving stale state during profile switches
  const [isLoaded, setIsLoaded] = useState<boolean>(true);

  // Google Drive State
  const [isGoogleClientReady, setIsGoogleClientReady] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string>('');
  const tokenClient = useRef<any>(null);

  // Custom Profile Settings State with robust parsing
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
                // Safe merge: iterate keys in parsed, if they exist in defaults, merge properties
                Object.keys(parsed).forEach(k => {
                    const pKey = k as ProfileName;
                    if (merged[pKey] && parsed[k]) {
                         merged[pKey] = {
                             ...merged[pKey],
                             ...parsed[k],
                             // Ensure dailyGoal is also merged if partially present
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
  
  // Lazy Initialize Counts with validation
  const [counts, setCounts] = useState<DayData>(() => {
    const p = getInitialProfile();
    const key = `${PROFILES[p].storageKeyPrefix}_${LOCAL_STORAGE_COUNTS_KEY}`;
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Basic shape check to prevent crash on null or invalid objects
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
  
  // Lazy Initialize Streak with validation
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
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showDataModal, setShowDataModal] = useState<boolean>(false);
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void}>({
      title: '', message: '', onConfirm: () => {},
  });
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const beadAudioRef = useRef<HTMLAudioElement | null>(null);
  const roundAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const activeTheme = themes[themeName];
  
  // Merge static profile info with dynamic settings
  const activeProfile = useMemo(() => ({
      ...PROFILES[profile],
      ...customProfileSettings[profile]
  }), [profile, customProfileSettings]);

  // --- Google Drive Integration ---
  useEffect(() => {
    const initGoogleClient = () => {
      if (!window.gapi || !window.google) return;

      window.gapi.load('client', async () => {
        try {
           await window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          
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
        } catch (error) {
           console.error("Error initializing Google Client", error);
           setBackupStatus('Failed to init Google Client');
        }
      });
    };
    
    // Check periodically if scripts are loaded
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
      setBackupStatus('Backing up...');
      try {
        const data = gatherAllData();
        const fileContent = JSON.stringify(data);
        const file = new Blob([fileContent], {type: 'application/json'});
        const metadata = {
            name: BACKUP_FILE_NAME,
            mimeType: 'application/json',
            parents: ['appDataFolder']
        };

        // Check if file exists
        const listResponse = await window.gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILE_NAME}' and 'appDataFolder' in parents`,
            fields: 'files(id, name)',
            spaces: 'appDataFolder'
        });

        if (listResponse.result.files && listResponse.result.files.length > 0) {
            // Update existing file
            const fileId = listResponse.result.files[0].id;
            const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify({ mimeType: 'application/json' })], { type: 'application/json' }));
            form.append('file', file);

            await fetch(updateUrl, {
                method: 'PATCH',
                headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }),
                body: form
            });
            setBackupStatus(`Backup updated: ${new Date().toLocaleTimeString()}`);
        } else {
            // Create new file
            const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            await fetch(createUrl, {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }),
                body: form
            });
            setBackupStatus(`Backup created: ${new Date().toLocaleTimeString()}`);
        }
      } catch (error) {
          console.error('Backup failed', error);
          setBackupStatus('Backup failed. See console.');
      }
  };

  const handleDriveRestore = async () => {
      setBackupStatus('Searching for backup...');
      try {
          const listResponse = await window.gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILE_NAME}' and 'appDataFolder' in parents`,
            fields: 'files(id, name)',
            spaces: 'appDataFolder'
        });

        if (listResponse.result.files && listResponse.result.files.length > 0) {
            const fileId = listResponse.result.files[0].id;
            setBackupStatus('Downloading...');
            const response = await window.gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            processRestoreData(response.result);
        } else {
            setBackupStatus('No backup found in Drive.');
            alert('No backup file found in your Google Drive App Data.');
        }
      } catch (error) {
          console.error('Restore failed', error);
          setBackupStatus('Restore failed. See console.');
      }
  };
  // --- End Google Drive Integration ---

  // Save custom settings when changed
  useEffect(() => {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_SETTINGS_KEY, JSON.stringify(customProfileSettings));
  }, [customProfileSettings]);

  const updateProfileSettings = (newSettings: ProfileSettings) => {
      setCustomProfileSettings(prev => ({
          ...prev,
          [profile]: newSettings
      }));
  };

  const resetProfileSettings = () => {
      setCustomProfileSettings(prev => ({
          ...prev,
          [profile]: {
              beadsPerRound: PROFILES[profile].beadsPerRound,
              dailyGoal: PROFILES[profile].dailyGoal
          }
      }));
  };

  // Calculate total lifetime beads (history + today)
  const totalLifetimeBeads = useMemo(() => {
    const historyBeads = history.reduce((acc, entry) => acc + (entry.rounds * activeProfile.beadsPerRound), 0);
    const todayBeads = (counts.roundCount * activeProfile.beadsPerRound) + counts.beadCount;
    return historyBeads + todayBeads;
  }, [history, counts, activeProfile.beadsPerRound]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setInstallPrompt(null);
    });
  };

  const handleProfileSwitch = (newProfile: ProfileName) => {
      if (newProfile === profile) return;
      // Block saving until the new profile data is loaded
      setIsLoaded(false);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, newProfile);
  };
  
  // Load data from localStorage on profile change (or initial mount if not lazy loaded)
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

    // Load Streak
    const savedStreakRaw = localStorage.getItem(streakKey);
    let savedStreak: StreakData = { count: 0, lastDate: null };
    if (savedStreakRaw) {
        try {
            const parsed = JSON.parse(savedStreakRaw);
            if (parsed && typeof parsed === 'object') savedStreak = parsed;
        } catch(e) {}
    }

    if (savedStreak.lastDate !== todayStr && savedStreak.lastDate !== yesterdayStr) {
        // Reset streak if skipped a day
        setStreak({ count: 0, lastDate: null });
    } else {
        setStreak(savedStreak);
    }
    
    const savedDataRaw = localStorage.getItem(countsKey);
    const savedHistoryRaw = localStorage.getItem(historyKey);
    
    let loadedHistory: HistoryEntry[] = [];
    if (savedHistoryRaw) {
        try {
            const parsed = JSON.parse(savedHistoryRaw);
            if (Array.isArray(parsed)) loadedHistory = parsed;
        } catch (e) {}
    }
    
    if (savedDataRaw) {
      let savedData: DayData = { beadCount: 0, roundCount: 0, lastVisitDate: todayStr, targetReachedToday: false };
      try {
          const parsed = JSON.parse(savedDataRaw);
          if (parsed && typeof parsed === 'object') savedData = parsed;
      } catch (e) {}
      
      // Check if date has changed (New Day Logic)
      if (savedData.lastVisitDate !== todayStr) {
        if (savedData.roundCount > 0 || savedData.beadCount > 0) {
            const yesterdayEntry = {
                date: savedData.lastVisitDate,
                rounds: savedData.roundCount,
            };
            // Add to history if not already present
            if (!loadedHistory.some(h => h.date === yesterdayEntry.date)) {
                const newHistory = [yesterdayEntry, ...loadedHistory];
                loadedHistory.unshift(yesterdayEntry); // update local var for immediate use if needed
                setHistory(newHistory);
                // Save history immediately
                localStorage.setItem(historyKey, JSON.stringify(newHistory));
            }
        }
        // Reset counts for today
        setCounts({ beadCount: 0, roundCount: 0, lastVisitDate: todayStr, targetReachedToday: false });
      } else {
        // Same day, load saved counts
        setCounts(savedData);
      }
    } else {
        setCounts({ beadCount: 0, roundCount: 0, lastVisitDate: todayStr, targetReachedToday: false });
    }
    setHistory(loadedHistory);
    
    // Data successfully loaded for this profile
    setIsLoaded(true);
  }, [profile]); // Depend on profile string (not activeProfile object) to avoid reloading on settings change
  
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
  

  // Save counts to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    const countsKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_COUNTS_KEY}`;
    localStorage.setItem(countsKey, JSON.stringify(counts));
  }, [counts, profile, isLoaded]);

  // Save streak to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    const streakKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_STREAK_KEY}`;
    localStorage.setItem(streakKey, JSON.stringify(streak));
  }, [streak, profile, isLoaded]);


  const handleBeadIncrement = useCallback(() => {
    if (beadAudioRef.current) {
      beadAudioRef.current.currentTime = 0;
      beadAudioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
    
    const oldTargetReached = counts.targetReachedToday;
    let newBeadCount = counts.beadCount + 1;
    let newRoundCount = counts.roundCount;

    if (newBeadCount >= activeProfile.beadsPerRound) {
        newRoundCount += 1;
        newBeadCount = 0;
        setTimeout(() => { roundAudioRef.current?.play().catch(e => console.error("Error playing sound:", e)); }, 50);
    }

    const nextCounts = {
        ...counts,
        beadCount: newBeadCount,
        roundCount: newRoundCount,
    };

    let shouldCelebrate = false;
    const totalBeadsToday = nextCounts.roundCount * activeProfile.beadsPerRound + nextCounts.beadCount;
    
    if (activeProfile.dailyGoal.type === 'rounds') {
        if (nextCounts.roundCount >= activeProfile.dailyGoal.value && !oldTargetReached) {
            shouldCelebrate = true;
        }
    } else { // beads
        if (totalBeadsToday >= activeProfile.dailyGoal.value && !oldTargetReached) {
            shouldCelebrate = true;
        }
    }
    
    if (shouldCelebrate) {
        nextCounts.targetReachedToday = true;
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
        
        const todayStr = new Date().toISOString().slice(0, 10);
        setStreak(prevStreak => {
            if (prevStreak.lastDate === todayStr) return prevStreak;
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            
            const newCount = prevStreak.lastDate === yesterdayStr ? prevStreak.count + 1 : 1;
            return { count: newCount, lastDate: todayStr };
        });
    }
    
    setCounts(nextCounts);

  }, [counts, profile, activeProfile.beadsPerRound, activeProfile.dailyGoal]);

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

  const handleHistoryEdit = (index: number, updatedEntry: HistoryEntry) => {
      const newHistory = [...history];
      newHistory[index] = updatedEntry;
      // Sort desc by date
      newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(newHistory);
      
      if (isLoaded) {
          const historyKey = `${activeProfile.storageKeyPrefix}_${LOCAL_STORAGE_HISTORY_KEY}`;
          localStorage.setItem(historyKey, JSON.stringify(newHistory));
      }
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

  const handleExportData = () => {
    const data = gatherAllData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `mala-counter-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const data = JSON.parse(content);
            processRestoreData(data);
        } catch (error) {
            console.error("Import failed", error);
            alert('Failed to parse backup file. Please ensure it is a valid JSON file.');
        }
    };
    reader.readAsText(file);
    setShowDataModal(false);
  };

  const handleExportPDF = () => {
      const reportData = (Object.keys(PROFILES) as ProfileName[]).map(pName => {
          const isCurrent = pName === profile;
          const prefix = PROFILES[pName].storageKeyPrefix;
          
          // Settings
          const settings = isCurrent 
            ? activeProfile 
            : { ...PROFILES[pName], ...(customProfileSettings[pName] || {}) };

          // History
          let pHistory: HistoryEntry[] = [];
          if (isCurrent) {
              pHistory = [...history];
          } else {
              const raw = localStorage.getItem(`${prefix}_${LOCAL_STORAGE_HISTORY_KEY}`);
              try {
                  pHistory = raw ? JSON.parse(raw) : [];
              } catch (e) { pHistory = []; }
          }

          // Streak
          let pStreak = 0;
          if (isCurrent) {
              pStreak = streak.count;
          } else {
               const raw = localStorage.getItem(`${prefix}_${LOCAL_STORAGE_STREAK_KEY}`);
               try {
                   const sData = raw ? JSON.parse(raw) : { count: 0 };
                   pStreak = sData.count || 0;
               } catch (e) { pStreak = 0; }
          }

          // Today's counts (to add to total)
          let todayBeads = 0;
          let todayRounds = 0;
          
          if (isCurrent) {
              todayBeads = counts.beadCount;
              todayRounds = counts.roundCount;
          } else {
               const raw = localStorage.getItem(`${prefix}_${LOCAL_STORAGE_COUNTS_KEY}`);
               if (raw) {
                   try {
                       const d = JSON.parse(raw);
                       todayBeads = d.beadCount || 0;
                       todayRounds = d.roundCount || 0;
                   } catch (e) { }
               }
          }

          // Calculate Total
          const historyBeads = pHistory.reduce((acc, h) => acc + (h.rounds * settings.beadsPerRound), 0);
          const currentBeads = (todayRounds * settings.beadsPerRound) + todayBeads;
          const totalBeads = historyBeads + currentBeads;
          
          const historyRounds = pHistory.reduce((acc, h) => acc + h.rounds, 0);
          const totalRounds = historyRounds + todayRounds;

          // Format History for PDF
          const displayHistory = [...pHistory];
          if (todayRounds > 0 || todayBeads > 0) {
               displayHistory.unshift({
                   date: new Date().toISOString().slice(0,10) + " (Today)",
                   rounds: todayRounds,
               } as any); 
          }
          
          const formattedHistory = displayHistory.map(h => {
             let beads = h.rounds * settings.beadsPerRound;
             if (h.date.includes("Today")) {
                 beads = currentBeads;
             }
             return {
                date: h.date,
                rounds: h.rounds,
                beads: beads
             };
          });

          return {
              name: PROFILES[pName].name,
              totalBeads,
              totalRounds,
              streak: pStreak,
              history: formattedHistory,
              settings: {
                  beadsPerRound: settings.beadsPerRound,
                  dailyGoal: settings.dailyGoal.type === 'rounds' ? `${settings.dailyGoal.value} Rounds` : `${settings.dailyGoal.value} Beads`
              }
          };
      });
      
      generateMalaReport(reportData, activeTheme.colors);
  };

  const ProfileSwitcher = () => (
    <div className={`flex items-center p-1 rounded-full ${activeTheme.colors.accentLight} shadow-inner`}>
      {(Object.keys(PROFILES) as ProfileName[]).map(profileName => (
        <button
          key={profileName}
          onClick={() => handleProfileSwitch(profileName)}
          className={`px-4 sm:px-6 py-2 text-sm sm:text-base font-bold rounded-full transition-all duration-300 ${profile === profileName ? `${activeTheme.colors.accent} ${activeTheme.colors.accentDark} shadow-md` : `${activeTheme.colors.textSecondary} hover:${activeTheme.colors.textPrimary}`}`}
        >
          {PROFILES[profileName].name}
        </button>
      ))}
    </div>
  );
  
  const goalText = activeProfile.dailyGoal.type === 'rounds'
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
          <div className="flex items-end justify-center space-x-8 md:space-x-12 mb-8">
            <div className="text-center">
              <span className={`text-sm md:text-xl ${activeTheme.colors.textSecondary} uppercase tracking-wider font-semibold`}>Round</span>
              <p className={`text-4xl md:text-6xl font-bold ${activeTheme.colors.accentDark}`}>{counts.roundCount}</p>
            </div>
            
            <div className="text-center">
              <span className={`text-sm md:text-xl ${activeTheme.colors.textSecondary} uppercase tracking-wider font-semibold`}>Total</span>
              <p className={`text-4xl md:text-6xl font-bold ${activeTheme.colors.accentDark}`}>{totalLifetimeBeads}</p>
            </div>

            {streak.count > 0 && (
              <div className="text-center">
                <span className={`text-sm md:text-xl ${activeTheme.colors.textSecondary} uppercase tracking-wider font-semibold`}>Streak</span>
                <p className={`text-4xl md:text-6xl font-bold ${activeTheme.colors.accentDark} flex items-center justify-center`}>
                  {streak.count}
                  <span role="img" aria-label="Streak" className="text-3xl md:text-5xl ml-1">🔥</span>
                </p>
              </div>
            )}
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
              <span className={`text-9xl md:text-[10rem] font-normal ${activeTheme.colors.accentDark} tracking-tighter`}>{counts.beadCount}</span>
              <span className={`absolute bottom-14 md:bottom-16 text-lg ${activeTheme.colors.textSecondary}`}>/ {activeProfile.beadsPerRound}</span>
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
                    onClick={() => setShowDataModal(true)}
                    className={`flex items-center space-x-2 px-3 py-2 ${activeTheme.colors.textSecondary} hover:${activeTheme.colors.textPrimary} ${activeTheme.colors.buttonHover} rounded-lg transition-colors`}
                    aria-label="Backup and restore"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
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
      <HistoryModal 
        theme={activeTheme.colors} 
        history={history} 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        beadsPerRound={activeProfile.beadsPerRound}
        onEditEntry={handleHistoryEdit}
      />
      <DataModal 
        isOpen={showDataModal} 
        onClose={() => setShowDataModal(false)} 
        theme={activeTheme.colors}
        onExportToFile={handleExportData}
        onImportFromFile={handleImportData}
        onExportToPDF={handleExportPDF}
        isGoogleSignedIn={isGoogleSignedIn}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
        onDriveBackup={handleDriveBackup}
        onDriveRestore={handleDriveRestore}
        driveStatus={backupStatus}
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
        canInstall={!!installPrompt}
        onInstall={handleInstallClick}
        currentProfileSettings={customProfileSettings[profile]}
        onUpdateSettings={updateProfileSettings}
        onResetSettings={resetProfileSettings}
        profileName={activeProfile.name}
      />
    </>
  );
};

export default App;
