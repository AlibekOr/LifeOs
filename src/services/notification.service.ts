import { Alert, Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { openAppSettings, requestNotificationPermission } from '../utils/permissions.ts';
import type { Task } from '../types/task.types.ts';

const REMINDER_CHANNEL_ID = 'task-reminders';

function getReminderDate(task: Task): Date {
  return new Date(`${task.due_date}T${task.scheduled_time}`);
}

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

async function cancelTaskReminder(taskId: string): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(taskId);
  } catch (error) {
    console.error(error);
  }
}

async function scheduleTaskReminder(task: Task): Promise<void> {
  const reminderDate = getReminderDate(task);
  if (Number.isNaN(reminderDate.getTime()) || reminderDate.getTime() <= Date.now()) {
    await cancelTaskReminder(task.id);
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    Alert.alert(
      'Notifications disabled',
      'Enable notifications in Settings to get reminders for your tasks.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: openAppSettings },
      ],
    );
    return;
  }

  try {
    await ensureChannel();
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: reminderDate.getTime(),
    };
    await notifee.createTriggerNotification(
      {
        id: task.id,
        title: task.title,
        body: `Scheduled for ${task.scheduled_time.slice(0, 5)}`,
        android: {
          channelId: REMINDER_CHANNEL_ID,
          pressAction: { id: 'default' },
        },
      },
      trigger,
    );
  } catch (error) {
    console.error(error);
  }
}

export const notificationService = {
  scheduleTaskReminder,
  cancelTaskReminder,
};
