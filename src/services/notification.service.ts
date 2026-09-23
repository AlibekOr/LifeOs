import { Alert, Platform } from 'react-native';
import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidNotificationSetting,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import {
  hasNotificationPermission,
  openAppSettings,
  requestNotificationPermission,
} from '../utils/permissions.ts';
import { useReminderSettingsStore } from '../store/reminderSettings.store.ts';
import {
  getReminderTime,
  selectRemindersToSchedule,
} from '../features/tasks/utils/reminderTime.ts';
import { formatTime } from '../features/tasks/utils/taskFormatting.ts';
import { getTaskStart } from '../features/tasks/utils/taskStatus.ts';
import type { Task } from '../types/task.types.ts';

const REMINDER_CHANNEL_ID = 'task-reminders';
const MS_PER_MINUTE = 60 * 1000;

type ReminderTask = Pick<
  Task,
  'id' | 'title' | 'is_completed' | 'due_date' | 'scheduled_time'
>;

// Editing or unchecking tasks reschedules reminders; without these the alerts
// would reappear on every such action.
let disabledAlertShown = false;
let exactAlarmPromptShown = false;

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await notifee.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Task Reminders',
    importance: AndroidImportance.HIGH,
  });
}

function showNotificationsDisabledAlert(): void {
  Alert.alert(
    'Notifications disabled',
    'Enable notifications in Settings to get reminders for your tasks.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: openAppSettings },
    ],
  );
}

// Asks for notification permission and, if refused, explains how to enable it.
// Used when the user turns reminders on, at the point of use.
async function requestReminderPermission(): Promise<boolean> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    showNotificationsDisabledAlert();
    return false;
  }
  return true;
}

// Android 12+ needs a special "Alarms & reminders" grant for on-time delivery.
// Older Android reports NOT_SUPPORTED and always allows exact alarms.
async function canUseExactAlarms(promptIfMissing: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const { android } = await notifee.getNotificationSettings();
  if (android.alarm !== AndroidNotificationSetting.DISABLED) {
    return true;
  }
  if (promptIfMissing && !exactAlarmPromptShown) {
    exactAlarmPromptShown = true;
    Alert.alert(
      'Allow exact reminders',
      'To get reminders right on time, allow "Alarms & reminders" for LifeOS.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            notifee.openAlarmPermissionSettings();
          },
        },
      ],
    );
  }
  return false;
}

function reminderBody(task: ReminderTask, at: Date): string {
  const minutesAhead = Math.round(
    (getTaskStart(task).getTime() - at.getTime()) / MS_PER_MINUTE,
  );
  return minutesAhead > 0
    ? `Starts at ${formatTime(task.scheduled_time)} · in ${minutesAhead} min`
    : 'Starting now';
}

async function createReminder(
  task: ReminderTask,
  at: Date,
  useExactAlarm: boolean,
): Promise<void> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: at.getTime(),
    ...(useExactAlarm
      ? { alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE } }
      : {}),
  };
  // Same id as the task, so rescheduling replaces the previous reminder.
  await notifee.createTriggerNotification(
    {
      id: task.id,
      title: task.title,
      body: reminderBody(task, at),
      data: { taskId: task.id },
      android: {
        channelId: REMINDER_CHANNEL_ID,
        pressAction: { id: 'default' },
      },
    },
    trigger,
  );
}

async function cancelTaskReminder(taskId: string): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(taskId);
  } catch (error) {
    console.error(error);
  }
}

// Schedules (or clears) the reminder for one task after the user created,
// edited, or completed it.
async function scheduleTaskReminder(task: ReminderTask): Promise<void> {
  const { leadMinutes } = useReminderSettingsStore.getState();
  const at = task.is_completed
    ? null
    : getReminderTime(getTaskStart(task), leadMinutes, new Date());
  if (!at) {
    await cancelTaskReminder(task.id);
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    if (!disabledAlertShown) {
      disabledAlertShown = true;
      showNotificationsDisabledAlert();
    }
    return;
  }

  try {
    await ensureChannel();
    await createReminder(task, at, await canUseExactAlarms(true));
  } catch (error) {
    console.error(error);
  }
}

// Brings scheduled reminders in line with the tasks we know about: adds ones
// missing (tasks from another device, a changed lead time), removes ones whose
// task was finished or deleted. Never prompts; it runs on app start.
async function syncTaskReminders(
  tasks: readonly ReminderTask[],
): Promise<void> {
  const { leadMinutes } = useReminderSettingsStore.getState();
  const planned = selectRemindersToSchedule(tasks, leadMinutes, new Date());

  try {
    const wantedIds = new Set(planned.map(item => item.task.id));
    const scheduledIds = await notifee.getTriggerNotificationIds();
    const staleIds = scheduledIds.filter(id => !wantedIds.has(id));
    if (staleIds.length > 0) {
      await notifee.cancelTriggerNotifications(staleIds);
    }
    if (planned.length === 0 || !(await hasNotificationPermission())) {
      return;
    }

    await ensureChannel();
    const useExactAlarm = await canUseExactAlarms(false);
    for (const { task, at } of planned) {
      await createReminder(task, at, useExactAlarm);
    }
  } catch (error) {
    console.error(error);
  }
}

// Reminders carry task titles, so they must not outlive the signed-in user.
async function cancelAllTaskReminders(): Promise<void> {
  try {
    await notifee.cancelTriggerNotifications();
  } catch (error) {
    console.error(error);
  }
}

export const notificationService = {
  scheduleTaskReminder,
  cancelTaskReminder,
  cancelAllTaskReminders,
  syncTaskReminders,
  requestReminderPermission,
};
