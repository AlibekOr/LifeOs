import type { LifeIconName } from '../../../assets/icons/LifeIcon.tsx';
import type { Task } from '../../../types/task.types.ts';
import type { SpendingInsight } from '../../finance/utils/financeSummary.ts';
import {
  formatDuration,
  formatTime,
} from '../../tasks/utils/taskFormatting.ts';
import { getTaskStart, getTaskTimeInfo } from '../../tasks/utils/taskStatus.ts';

export type NotificationGroup = 'attention' | 'upcoming' | 'insights';

export type NotificationTone = 'danger' | 'primary' | 'warning' | 'success';

export type NotificationTarget =
  | { type: 'task'; taskId: string }
  | { type: 'tasks' }
  | { type: 'finance' };

export type AppNotification = {
  // Stable across renders so read state survives; changes when the situation
  // changes (e.g. a new milestone tier), which makes it unread again.
  id: string;
  group: NotificationGroup;
  title: string;
  body: string;
  timeLabel: string;
  tone: NotificationTone;
  icon: LifeIconName;
  target: NotificationTarget;
};

type NotifiableTask = Pick<
  Task,
  | 'id'
  | 'title'
  | 'due_date'
  | 'scheduled_time'
  | 'duration_minutes'
  | 'is_completed'
  | 'started_at'
>;

export type BuildNotificationsInput = {
  tasks: readonly NotifiableTask[];
  now: Date;
  insight: SpendingInsight | null;
  previousMonthName: string;
  failedSync: { tasks: number; transactions: number };
};

export const UPCOMING_WINDOW_MINUTES = 120;
export const MAX_OVERDUE_NOTIFICATIONS = 5;
// Unfinished tasks older than this stop nagging.
export const OVERDUE_LOOKBACK_DAYS = 7;
export const MILESTONE_TIERS = [3, 5, 10] as const;

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

function localDateString(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function formatRelativeStart(minutes: number): string {
  if (minutes <= 0) {
    return 'now';
  }
  if (minutes < 60) {
    return `in ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `in ${hours}h` : `in ${hours}h ${rest}m`;
}

function formatShortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function overdueNotifications(
  tasks: readonly NotifiableTask[],
  now: Date,
  today: string,
): AppNotification[] {
  const oldest = now.getTime() - OVERDUE_LOOKBACK_DAYS * MS_PER_DAY;
  const overdue = tasks
    .filter(task => {
      const { status } = getTaskTimeInfo(task, now);
      return (
        (status === 'overdue' || status === 'missed') &&
        getTaskStart(task).getTime() >= oldest
      );
    })
    // Most recently missed first.
    .sort((a, b) => getTaskStart(b).getTime() - getTaskStart(a).getTime());

  const shown = overdue.slice(0, MAX_OVERDUE_NOTIFICATIONS);
  const result: AppNotification[] = shown.map(task => ({
    id: `overdue:${task.id}`,
    group: 'attention',
    title: `${task.title} is overdue`,
    body: `It was scheduled for ${formatTime(task.scheduled_time)}${
      task.due_date === today ? '' : ` on ${formatShortDate(task.due_date)}`
    }.`,
    timeLabel:
      task.due_date === today ? 'Today' : formatShortDate(task.due_date),
    tone: 'danger',
    icon: 'circle-alert',
    target: { type: 'task', taskId: task.id },
  }));

  const hidden = overdue.length - shown.length;
  if (hidden > 0) {
    result.push({
      id: `overdue:more:${hidden}`,
      group: 'attention',
      title: `${plural(hidden, 'more task')} overdue`,
      body: 'Open your tasks to catch up.',
      timeLabel: 'Earlier',
      tone: 'danger',
      icon: 'circle-alert',
      target: { type: 'tasks' },
    });
  }
  return result;
}

function upcomingNotifications(
  tasks: readonly NotifiableTask[],
  now: Date,
): AppNotification[] {
  const windowEnd = now.getTime() + UPCOMING_WINDOW_MINUTES * MS_PER_MINUTE;
  return tasks
    .filter(task => {
      if (task.is_completed) {
        return false;
      }
      const start = getTaskStart(task).getTime();
      return start >= now.getTime() && start <= windowEnd;
    })
    .sort((a, b) => getTaskStart(a).getTime() - getTaskStart(b).getTime())
    .map(task => {
      const minutes = Math.ceil(
        (getTaskStart(task).getTime() - now.getTime()) / MS_PER_MINUTE,
      );
      return {
        id: `upcoming:${task.id}`,
        group: 'upcoming' as const,
        title: `${task.title} starts ${formatRelativeStart(minutes)}`,
        body: `Scheduled for ${formatTime(
          task.scheduled_time,
        )} · ${formatDuration(task.duration_minutes)}`,
        timeLabel: formatTime(task.scheduled_time),
        tone: 'primary' as const,
        icon: 'clock' as const,
        target: { type: 'task' as const, taskId: task.id },
      };
    });
}

function milestoneNotification(
  tasks: readonly NotifiableTask[],
  today: string,
): AppNotification[] {
  const completedToday = tasks.filter(
    task => task.due_date === today && task.is_completed,
  ).length;
  const tier = [...MILESTONE_TIERS].reverse().find(t => completedToday >= t);
  if (!tier) {
    return [];
  }
  return [
    {
      id: `milestone:${today}:${tier}`,
      group: 'insights',
      title: 'Milestone reached',
      body: `You completed ${plural(
        completedToday,
        'task',
      )} today. Great momentum!`,
      timeLabel: 'Today',
      tone: 'success',
      icon: 'circle-check',
      target: { type: 'tasks' },
    },
  ];
}

function spendingNotification(
  insight: SpendingInsight | null,
  previousMonthName: string,
  today: string,
): AppNotification[] {
  if (!insight) {
    return [];
  }
  const month = today.slice(0, 7);
  const isUp = insight.direction === 'more';
  return [
    {
      id: `spending:${month}:${insight.category}:${insight.direction}:${insight.percentChange}`,
      group: 'insights',
      title: isUp
        ? `${insight.category} spending is up ${insight.percentChange}%`
        : `${insight.category} spending is down ${insight.percentChange}%`,
      body: isUp
        ? `Compared to ${previousMonthName}. Keep an eye on your budget.`
        : `Compared to ${previousMonthName}. Nice work keeping it down.`,
      timeLabel: 'This month',
      tone: isUp ? 'warning' : 'success',
      icon: isUp ? 'trending-up' : 'circle-check',
      target: { type: 'finance' },
    },
  ];
}

function syncNotification(
  failedSync: BuildNotificationsInput['failedSync'],
): AppNotification[] {
  const total = failedSync.tasks + failedSync.transactions;
  if (total === 0) {
    return [];
  }
  return [
    {
      id: 'sync:failed',
      group: 'attention',
      title: `${plural(total, 'change')} couldn't be synced`,
      body: 'Open the item to retry, edit, or discard it.',
      timeLabel: 'Now',
      tone: 'danger',
      icon: 'refresh-cw',
      target: failedSync.tasks > 0 ? { type: 'tasks' } : { type: 'finance' },
    },
  ];
}

// Notifications are derived from current data rather than stored, so they are
// never stale: finish the task and its alert disappears.
export function buildNotifications({
  tasks,
  now,
  insight,
  previousMonthName,
  failedSync,
}: BuildNotificationsInput): AppNotification[] {
  const today = localDateString(now);
  return [
    ...syncNotification(failedSync),
    ...overdueNotifications(tasks, now, today),
    ...upcomingNotifications(tasks, now),
    ...milestoneNotification(tasks, today),
    ...spendingNotification(insight, previousMonthName, today),
  ];
}
