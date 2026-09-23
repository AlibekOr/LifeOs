import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { notificationService } from '../../../services/notification.service.ts';
import {
  useReminderSettingsHydrated,
  useReminderSettingsStore,
} from '../../../store/reminderSettings.store.ts';
import { useTasksWithPending } from './useTasksWithPending.ts';

// Keeps phone reminders in step with the task list: on load, when tasks change
// (including ones from another device or queued offline), when the lead time is
// changed in Profile, and each time the app returns to the foreground.
export function useReminderSync(): void {
  const { tasks } = useTasksWithPending();
  const leadMinutes = useReminderSettingsStore(state => state.leadMinutes);
  const settingsReady = useReminderSettingsHydrated();
  const [foregroundCount, setForegroundCount] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setForegroundCount(count => count + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!tasks || !settingsReady) {
      return;
    }
    notificationService.syncTaskReminders(tasks).catch(error => {
      console.error('[useReminderSync] Failed to sync reminders', error);
    });
  }, [tasks, leadMinutes, settingsReady, foregroundCount]);
}
