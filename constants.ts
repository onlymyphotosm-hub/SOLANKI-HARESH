
export const LOCAL_STORAGE_PROFILE_KEY = 'malaCounterProfile';

export const PROFILES = {
  OM: {
    name: 'OM',
    beadsPerRound: 108,
    dailyGoal: { type: 'rounds' as const, value: 1 },
    storageKeyPrefix: 'OM',
  },
  Satnaam: {
    name: 'Satnaam',
    beadsPerRound: 108,
    dailyGoal: { type: 'beads' as const, value: 1000 },
    storageKeyPrefix: 'Satnaam',
  },
  SaarShabd: {
    name: 'SaarShabd',
    beadsPerRound: 108,
    dailyGoal: { type: 'beads' as const, value: 1000 },
    storageKeyPrefix: 'SaarShabd',
  }
};

export type ProfileName = keyof typeof PROFILES;


export const LOCAL_STORAGE_COUNTS_KEY = 'malaCounterDailyCounts';
export const LOCAL_STORAGE_HISTORY_KEY = 'malaCounterHistory';
export const LOCAL_STORAGE_THEME_KEY = 'malaCounterTheme';
export const LOCAL_STORAGE_CUSTOM_SOUND_KEY = 'malaCounterCustomSound';
export const LOCAL_STORAGE_STREAK_KEY = 'malaCounterStreak';
export const LOCAL_STORAGE_PROFILE_SETTINGS_KEY = 'malaCounterProfileSettings';

// Google Drive Backup Configuration
// NOTE: To make this work, you must create a project in Google Cloud Console,
// enable the Drive API, and create an OAuth 2.0 Client ID.
export const GOOGLE_CLIENT_ID = ''; // Enter your Client ID here
export const GOOGLE_API_KEY = '';   // Enter your API Key here
export const BACKUP_FILE_NAME = 'mala_counter_backup.json';

// A valid short click/wooden sound (Small Base64 MP3)
export const BEAD_CLICK_SOUND = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT18AZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT18AZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT18AZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

// A valid chime sound (Small Base64 MP3)
export const ROUND_COMPLETE_SOUND = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
