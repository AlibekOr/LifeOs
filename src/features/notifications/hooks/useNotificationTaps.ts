import { useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';
import { openTaskFromNotification } from '../utils/openTaskFromNotification.ts';

// Opens the task when a reminder is tapped: while the app is open, and when the
// tap is what launched the app.
export function useNotificationTaps(): void {
  useEffect(() => {
    let active = true;

    notifee
      .getInitialNotification()
      .then(initial => {
        if (active && initial) {
          openTaskFromNotification(initial.notification.data);
        }
      })
      .catch(error => {
        console.error('[useNotificationTaps] Failed to read launch tap', error);
      });

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        openTaskFromNotification(detail.notification?.data);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
}
