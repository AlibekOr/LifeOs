import { Linking } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

export type PermissionResult = 'granted' | 'denied';

export async function requestNotificationPermission(): Promise<PermissionResult> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED
    ? 'granted'
    : 'denied';
}

// Checks without prompting, so it is safe to call on app start.
export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

export function openAppSettings(): void {
  Linking.openSettings();
}
