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
  alertIds,
  planTaskAlerts,
  selectAlertsToSchedule,
  type AlertTask,
  type PlannedAlert,
} from '../features/tasks/utils/taskAlerts.ts';
import {
  PLAN_ALERT_ID_PREFIX,
  buildPlanAlert,
  planAlertId,
  selectPlanAlertsToSchedule,
  type PlannedPlanAlert,
  type ReminderPlan,
} from '../features/plans/utils/planReminders.ts';

// Android fixes a channel's sound when the channel is created, so a different
// sound needs a new channel id (and the old channel is deleted).
const REMINDER_CHANNEL_ID = 'task-reminders-v3';
// Older channels cannot be changed: v1 had no sound, v2 used the system sound.
const LEGACY_REMINDER_CHANNEL_IDS = ['task-reminders', 'task-reminders-v2'];

// The bundled alert sound ("New Notification 09" by Universfield, Pixabay
// Content License, no attribution required). Android takes the res/raw file name
// without its extension; iOS needs the .caf in the Xcode target's bundle
// resources, and plays the default sound if it is missing.
const ANDROID_REMINDER_SOUND = 'lifeos_reminder';
const IOS_REMINDER_SOUND = 'lifeos_reminder.caf';
// The sound played when a task is completed and the gift opens: "Short Success
// Sound Glockenspiel Treasure" by freesound_community, Pixabay Content License.
const CELEBRATION_CHANNEL_ID = 'celebration-v1';
const CELEBRATION_NOTIFICATION_ID = 'celebration';
const ANDROID_CELEBRATION_SOUND = 'lifeos_celebration';
const IOS_CELEBRATION_SOUND = 'lifeos_celebration.caf';
// Android stops a notification's sound when the notification goes away, so it
// must outlast the 2.5 s clip.
const CELEBRATION_VISIBLE_MS = 3500;
// TODO: a "Notification sound on/off" setting; the OS already silences alerts
// in silent and Do Not Disturb modes, which is not overridden.

// Editing or unchecking tasks reschedules reminders; without these the alerts
// would reappear on every such action.
let disabledAlertShown = false;
let exactAlarmPromptShown = false;
let legacyChannelsRemoved = false;

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await notifee.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Task Reminders',
    importance: AndroidImportance.HIGH,
    sound: ANDROID_REMINDER_SOUND,
    vibration: true,
  });
  if (!legacyChannelsRemoved) {
    legacyChannelsRemoved = true;
    await Promise.all(
      LEGACY_REMINDER_CHANNEL_IDS.map(id => notifee.deleteChannel(id)),
    );
  }
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

function warnNotificationsDisabledOnce(): void {
  if (!disabledAlertShown) {
    disabledAlertShown = true;
    showNotificationsDisabledAlert();
  }
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

// What is handed to the OS. `data` tells a tap where to go: task alerts carry
// `taskId` and `kind` (start and end open Home), plan reminders carry `planId`.
type ScheduledAlert = {
  id: string;
  title: string;
  body: string | undefined;
  at: Date;
  data: Record<string, string>;
};

function fromTaskAlert(alert: PlannedAlert): ScheduledAlert {
  return {
    id: alert.id,
    title: alert.title,
    body: alert.body,
    at: alert.at,
    data: { taskId: alert.taskId, kind: alert.kind },
  };
}

function fromPlanAlert(alert: PlannedPlanAlert): ScheduledAlert {
  return {
    id: alert.id,
    title: alert.title,
    body: alert.body,
    at: alert.at,
    data: { planId: alert.planId },
  };
}

async function createAlert(
  alert: ScheduledAlert,
  useExactAlarm: boolean,
): Promise<void> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: alert.at.getTime(),
    ...(useExactAlarm
      ? { alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE } }
      : {}),
  };
  // A deterministic id per task and kind (or per plan), so rescheduling replaces
  // the alert.
  await notifee.createTriggerNotification(
    {
      id: alert.id,
      title: alert.title,
      body: alert.body,
      data: alert.data,
      android: {
        channelId: REMINDER_CHANNEL_ID,
        pressAction: { id: 'default' },
      },
      ios: {
        sound: IOS_REMINDER_SOUND,
        // Banner and sound also while the app is open.
        foregroundPresentationOptions: {
          banner: true,
          list: true,
          sound: true,
          badge: true,
        },
      },
    },
    trigger,
  );
}

// Removes every alert of one task (lead, start and end).
async function cancelTaskReminder(taskId: string): Promise<void> {
  try {
    await notifee.cancelTriggerNotifications(alertIds(taskId));
  } catch (error) {
    console.error(error);
  }
}

// Brings one task's scheduled alerts in line with its current state after the
// user created, edited, started or completed it: drops the ones no longer
// wanted and (re)creates the rest.
async function scheduleTaskReminder(task: AlertTask): Promise<void> {
  const { leadMinutes } = useReminderSettingsStore.getState();
  const planned = planTaskAlerts(task, leadMinutes, new Date());

  const wantedIds = new Set(planned.map(alert => alert.id));
  const staleIds = alertIds(task.id).filter(id => !wantedIds.has(id));
  if (staleIds.length > 0) {
    try {
      await notifee.cancelTriggerNotifications(staleIds);
    } catch (error) {
      console.error(error);
    }
  }
  if (planned.length === 0) {
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    warnNotificationsDisabledOnce();
    return;
  }

  try {
    await ensureChannel();
    const useExactAlarm = await canUseExactAlarms(true);
    for (const alert of planned) {
      await createAlert(fromTaskAlert(alert), useExactAlarm);
    }
  } catch (error) {
    console.error(error);
  }
}

// Brings scheduled alerts in line with the tasks we know about: adds ones
// missing (tasks from another device, a changed lead time), removes ones whose
// task was finished or deleted, and any left over from the old id scheme. Never
// prompts; it runs on app start.
async function syncTaskReminders(tasks: readonly AlertTask[]): Promise<void> {
  const { leadMinutes } = useReminderSettingsStore.getState();
  const planned = selectAlertsToSchedule(tasks, leadMinutes, new Date());

  try {
    const wantedIds = new Set(planned.map(alert => alert.id));
    const scheduledIds = await notifee.getTriggerNotificationIds();
    // Plan reminders are managed by syncPlanReminders; they must survive here.
    const staleIds = scheduledIds.filter(
      id => !wantedIds.has(id) && !id.startsWith(PLAN_ALERT_ID_PREFIX),
    );
    if (staleIds.length > 0) {
      await notifee.cancelTriggerNotifications(staleIds);
    }
    if (planned.length === 0 || !(await hasNotificationPermission())) {
      return;
    }

    await ensureChannel();
    const useExactAlarm = await canUseExactAlarms(false);
    for (const alert of planned) {
      await createAlert(fromTaskAlert(alert), useExactAlarm);
    }
  } catch (error) {
    console.error(error);
  }
}

async function cancelPlanReminder(planId: string): Promise<void> {
  try {
    await notifee.cancelTriggerNotifications([planAlertId(planId)]);
  } catch (error) {
    console.error(error);
  }
}

// Brings one plan's reminder in line with its current state after the user
// created, edited, completed, cancelled or restored it: removes it when it is no
// longer wanted (no reminder, done, cancelled, already past) and (re)creates it
// otherwise.
async function schedulePlanReminder(plan: ReminderPlan): Promise<void> {
  const alert = buildPlanAlert(plan, new Date());
  if (!alert) {
    await cancelPlanReminder(plan.id);
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    warnNotificationsDisabledOnce();
    return;
  }

  try {
    await ensureChannel();
    const useExactAlarm = await canUseExactAlarms(true);
    await createAlert(fromPlanAlert(alert), useExactAlarm);
  } catch (error) {
    console.error(error);
  }
}

// Same idea as syncTaskReminders, for plans: adds reminders that are missing
// (plans from another device, ones queued offline), removes those whose plan was
// finished, changed or deleted. Only reminders within the near horizon exist.
// Never prompts; it runs on app start and when the app returns to the foreground.
async function syncPlanReminders(
  plans: readonly ReminderPlan[],
): Promise<void> {
  const planned = selectPlanAlertsToSchedule(plans, new Date());

  try {
    const wantedIds = new Set(planned.map(alert => alert.id));
    const scheduledIds = await notifee.getTriggerNotificationIds();
    const staleIds = scheduledIds.filter(
      id => id.startsWith(PLAN_ALERT_ID_PREFIX) && !wantedIds.has(id),
    );
    if (staleIds.length > 0) {
      await notifee.cancelTriggerNotifications(staleIds);
    }
    if (planned.length === 0 || !(await hasNotificationPermission())) {
      return;
    }

    await ensureChannel();
    const useExactAlarm = await canUseExactAlarms(false);
    for (const alert of planned) {
      await createAlert(fromPlanAlert(alert), useExactAlarm);
    }
  } catch (error) {
    console.error(error);
  }
}

// Plays the "congratulations" sound as the gift opens. It goes through a local
// notification so no audio library is needed: on iOS it is sound only while the
// app is open (no banner); Android must post a notification for the sound, so it
// is low-key (no pop-up) and removes itself. Never prompts for permission, and
// never breaks the celebration: without permission it is simply silent.
async function playCelebrationSound(): Promise<void> {
  try {
    if (!(await hasNotificationPermission())) {
      return;
    }
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: CELEBRATION_CHANNEL_ID,
        name: 'Celebration',
        importance: AndroidImportance.DEFAULT,
        sound: ANDROID_CELEBRATION_SOUND,
        vibration: false,
      });
    }
    await notifee.displayNotification({
      id: CELEBRATION_NOTIFICATION_ID,
      title: 'Task complete!',
      android: {
        channelId: CELEBRATION_CHANNEL_ID,
        timeoutAfter: CELEBRATION_VISIBLE_MS,
      },
      ios: {
        sound: IOS_CELEBRATION_SOUND,
        foregroundPresentationOptions: {
          // notifee defaults the deprecated `alert` to true and, when banner and
          // list are both off, falls back to it, so it must be turned off too.
          alert: false,
          banner: false,
          list: false,
          sound: true,
          badge: false,
        },
      },
    });
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
  schedulePlanReminder,
  cancelPlanReminder,
  syncPlanReminders,
  requestReminderPermission,
  playCelebrationSound,
};
