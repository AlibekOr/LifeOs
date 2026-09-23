import { Linking } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

export type PermissionResult = 'granted' | 'denied';

export async function requestNotificationPermission(): Promise<PermissionResult> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED
    ? 'granted'
    : 'denied';
}

export function openAppSettings(): void {
  Linking.openSettings();
}
