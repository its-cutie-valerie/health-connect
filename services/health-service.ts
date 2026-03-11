import { readRecords, requestPermission } from 'react-native-health-connect';
import * as SecureStore from 'expo-secure-store';
import { HealthSettings, SyncType } from '../hooks/use-health-settings';
import { sendSyncNotification } from './notification-service';

const SETTINGS_KEY = 'health_sync_settings';

export async function requestAllHealthPermissions(syncEnabled: Record<SyncType, boolean>) {
  const permissions = Object.entries(syncEnabled)
    .filter(([_, enabled]) => enabled)
    .map(([type, _]) => ({ 
      recordType: type as any, 
      accessType: 'read' as const 
    }));
  
  if (permissions.length === 0) return true;
  
  try {
    return await requestPermission(permissions);
  } catch (err) {
    console.error('Failed to request permissions:', err);
    throw err;
  }
}

export async function fetchHealthData(settings: HealthSettings) {
  const syncTypes = Object.entries(settings.syncEnabled)
    .filter(([_, enabled]) => enabled)
    .map(([type, _]) => type as SyncType);

  if (syncTypes.length === 0) return {};

  const healthData: Record<string, any> = {};
  
  // Dynamic lookback range based on settings
  const lookbackDays = settings.lookbackDays || 1;
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - lookbackDays);
  startTime.setHours(0, 0, 0, 0);

  // For vitals/sleep we might want a longer default if lookback is 1 day, 
  // but let's stick to the settings for consistency for now.
  const range = startTime.toISOString();

  for (const type of syncTypes) {
    try {
      const result = await readRecords(type as any, {
        timeRangeFilter: {
          operator: 'after',
          startTime: range,
        },
      });
      healthData[type] = result.records;
    } catch (err) {
      console.warn(`Failed to fetch ${type}:`, err);
    }
  }

  return healthData;
}

export async function uploadHealthData(data: any, settings: HealthSettings) {
  const totalRecords = Object.values(data).reduce((acc: number, curr: any) => acc + curr.length, 0);
  
  if (totalRecords === 0) {
    await addHistoryEntry({ status: 'no_data', recordCount: 0, message: 'No new data found' });
    return false;
  }

  console.log(`[HealthService] Syncing ${totalRecords} records to: ${settings.apiEndpoint}`);
  
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (settings.authHeader) {
      headers['Authorization'] = settings.authHeader;
    }

    const response = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: settings.userId,
        platform: 'android',
        timestamp: new Date().toISOString(),
        data,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      const msg = `Server error: ${response.status}`;
      await addHistoryEntry({ status: 'failure', recordCount: totalRecords, message: msg });
      throw new Error(msg);
    }

    // Success
    await addHistoryEntry({ status: 'success', recordCount: totalRecords });
    
    if (settings.notificationsEnabled) {
      await sendSyncNotification('Sync Complete', `Successfully uploaded ${totalRecords} health records.`);
    }

    // Update last sync time
    const updatedSettings = { ...settings, lastSync: new Date().toISOString() };
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(updatedSettings));
    
    return true;
  } catch (error: any) {
    console.error(`[HealthService] Network failure:`, error.message);
    await addHistoryEntry({ status: 'failure', recordCount: totalRecords, message: error.message });
    throw error;
  }
}

async function addHistoryEntry(entry: { status: 'success' | 'failure' | 'no_data'; recordCount: number; message?: string }) {
  try {
    const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
    if (!stored) return;
    
    const settings: HealthSettings = JSON.parse(stored);
    const newEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    
    const newHistory = [newEntry, ...(settings.history || [])].slice(0, 20);
    const updated = { ...settings, history: newHistory };
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to add history entry', e);
  }
}

export async function performFullSync() {
  const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
  if (!stored) return false;
  
  const settings: HealthSettings = JSON.parse(stored);
  try {
    const data = await fetchHealthData(settings);
    return await uploadHealthData(data, settings);
  } catch (e) {
    return false;
  }
}
