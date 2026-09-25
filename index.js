/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { openFromNotification } from './src/features/notifications/utils/openFromNotification.ts';

// Notifee requires a background handler. When the app is alive in the background
// this runs in the same JS runtime, so a tap can open the task or plan directly;
// when the app was killed, useNotificationTaps handles the launch tap instead.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    openFromNotification(detail.notification?.data);
  }
});

AppRegistry.registerComponent(appName, () => App);
