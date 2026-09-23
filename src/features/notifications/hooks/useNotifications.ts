import { useCallback, useMemo } from 'react';
import { useNow } from '../../../hooks/useNow.ts';
import { useUserPendingEntries } from '../../../hooks/usePendingSync.ts';
import { useAuthStore } from '../../../services/storage/authStore.ts';
import { useNotificationReadStore } from '../../../store/notificationRead.store.ts';
import { useFinanceSummary } from '../../finance/hooks/useFinanceSummary.ts';
import {
  currentYearMonth,
  formatMonthName,
  shiftYearMonth,
} from '../../finance/utils/month.ts';
import { useTasksWithPending } from '../../tasks/hooks/useTasksWithPending.ts';
import { buildNotifications } from '../utils/buildNotifications.ts';
import type { AppNotification } from '../utils/buildNotifications.ts';

export type NotificationItem = AppNotification & { unread: boolean };

const NO_READ_IDS: string[] = [];

export function useNotifications() {
  const now = useNow();
  const userId = useAuthStore(state => state.user?.id);
  const { tasks, isLoading: tasksLoading } = useTasksWithPending();
  const { insight } = useFinanceSummary(currentYearMonth());
  const entries = useUserPendingEntries();
  const readIds = useNotificationReadStore(state =>
    userId ? state.readByUser[userId] ?? NO_READ_IDS : NO_READ_IDS,
  );
  const markReadInStore = useNotificationReadStore(state => state.markRead);
  const markAllReadInStore = useNotificationReadStore(
    state => state.markAllRead,
  );

  const notifications = useMemo<NotificationItem[]>(() => {
    const failed = entries.filter(entry => entry.status === 'failed');
    const built = buildNotifications({
      tasks: tasks ?? [],
      now,
      insight,
      previousMonthName: formatMonthName(
        shiftYearMonth(currentYearMonth(), -1),
      ),
      failedSync: {
        tasks: failed.filter(entry => entry.entity === 'task').length,
        transactions: failed.filter(entry => entry.entity === 'transaction')
          .length,
      },
    });
    return built.map(item => ({ ...item, unread: !readIds.includes(item.id) }));
  }, [tasks, now, insight, entries, readIds]);

  const unreadCount = notifications.filter(item => item.unread).length;

  const markRead = useCallback(
    (id: string) => {
      if (userId) {
        markReadInStore(userId, id);
      }
    },
    [userId, markReadInStore],
  );

  const markAllRead = useCallback(() => {
    if (userId) {
      markAllReadInStore(
        userId,
        notifications.map(item => item.id),
      );
    }
  }, [userId, markAllReadInStore, notifications]);

  return {
    notifications,
    unreadCount,
    isLoading: tasksLoading && tasks === undefined,
    markRead,
    markAllRead,
  };
}
