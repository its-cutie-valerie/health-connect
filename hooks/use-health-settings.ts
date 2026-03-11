import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export type SyncType = 
  | 'Steps' 
  | 'HeartRate' 
  | 'Distance' 
  | 'TotalCaloriesBurned' 
  | 'SleepSession' 
  | 'Weight' 
  | 'Height'
  | 'ActiveCaloriesBurned'
  | 'BasalMetabolicRate'
  | 'BloodGlucose'
  | 'BloodPressure'
  | 'BodyFat'
  | 'BodyTemperature'
  | 'BoneMass'
  | 'ExerciseSession'
  | 'FloorsClimbed'
  | 'Hydration'
  | 'Nutrition'
  | 'OxygenSaturation'
  | 'RespiratoryRate'
  | 'RestingHeartRate'
  | 'Vo2Max';

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'failure' | 'no_data';
  recordCount: number;
  message?: string;
}

export interface HealthSettings {
  syncEnabled: Record<SyncType, boolean>;
  apiEndpoint: string;
  userId: string;
  authHeader: string;
  autoSync: boolean;
  lookbackDays: number;
  syncIntervalHours: number;
  lastSync?: string;
  history: SyncHistoryEntry[];
  notificationsEnabled: boolean;
}

const SETTINGS_KEY = 'health_sync_settings';

const DEFAULT_SETTINGS: HealthSettings = {
  syncEnabled: {
    Steps: true,
    HeartRate: true,
    Distance: true,
    TotalCaloriesBurned: true,
    SleepSession: true,
    Weight: true,
    Height: true,
    ActiveCaloriesBurned: true,
    BasalMetabolicRate: true,
    BloodGlucose: true,
    BloodPressure: true,
    BodyFat: true,
    BodyTemperature: true,
    BoneMass: true,
    ExerciseSession: true,
    FloorsClimbed: true,
    Hydration: true,
    Nutrition: true,
    OxygenSaturation: true,
    RespiratoryRate: true,
    RestingHeartRate: true,
    Vo2Max: true,
  },
  apiEndpoint: 'http://192.168.1.x:3000/api/health',
  userId: 'user_valerie',
  authHeader: '',
  autoSync: false,
  lookbackDays: 1,
  syncIntervalHours: 1,
  history: [],
  notificationsEnabled: true,
};

export function useHealthSettings() {
  const [settings, setSettings] = useState<HealthSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ 
          ...DEFAULT_SETTINGS, 
          ...parsed,
          // Ensure nested objects are merged correctly
          syncEnabled: { ...DEFAULT_SETTINGS.syncEnabled, ...parsed.syncEnabled }
        });
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<HealthSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  const addHistoryEntry = async (entry: OpaqueSyncHistoryEntry) => {
    const newEntry: SyncHistoryEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    
    const newHistory = [newEntry, ...settings.history].slice(0, 20); // Keep last 20
    await updateSettings({ history: newHistory });
  };

  return { settings, updateSettings, addHistoryEntry, isLoading };
}

type OpaqueSyncHistoryEntry = Omit<SyncHistoryEntry, 'id' | 'timestamp'>;
