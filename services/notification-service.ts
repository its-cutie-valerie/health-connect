import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function sendSyncNotification(title: string, body: string) {
  try {
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'sync_result' },
      },
      trigger: null, // Immediate
    });
  } catch (e) {
    console.error('Failed to send notification', e);
  }
}

async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}
