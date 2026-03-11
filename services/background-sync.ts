import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { performFullSync } from './health-service';
import * as SecureStore from 'expo-secure-store';

const BACKGROUND_SYNC_TASK = 'HEALTH_CONNECT_SYNC_TASK';
const SETTINGS_KEY = 'health_sync_settings';

// 1. Define the task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  console.log('[BackgroundFetch] Task started');
  try {
    const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.autoSync) {
        const success = await performFullSync();
        console.log('[BackgroundFetch] Sync success:', success);
        return success ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundFetch] Task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 2. Register/Unregister logic
export async function registerBackgroundSync(intervalHours: number = 1) {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }

  console.log(`[BackgroundFetch] Registering task with ${intervalHours}h interval...`);
  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 60 * 60 * intervalHours, 
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundSync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) {
    console.log('[BackgroundFetch] Unregistering task...');
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}
