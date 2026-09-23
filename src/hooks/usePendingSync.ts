import { useEffect, useMemo } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { pendingSyncService } from '../services/pendingSync.service.ts';
import type { SyncedItem } from '../services/pendingSync.service.ts';
import { useAuthStore } from '../services/storage/authStore.ts';
import { usePendingSyncStore } from '../store/pendingSync.store.ts';
import { taskKeys } from '../features/tasks/hooks/taskKeys.ts';
import { financeKeys } from '../features/finance/hooks/financeKeys.ts';
import { yearMonthOf } from '../features/finance/utils/month.ts';
import type { PendingEntry } from '../types/pendingSync.types.ts';
import type { Task } from '../types/task.types.ts';
import type { Transaction } from '../types/transaction.types.ts';
import { useNetworkStatus } from './useNetworkStatus.ts';

const RETRY_INTERVAL_MS = 30 * 1000;

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some(existing => existing.id === item.id)
    ? items.map(existing => (existing.id === item.id ? item : existing))
    : [...items, item];
}

function publishSyncedItem(queryClient: QueryClient, synced: SyncedItem) {
  if (synced.entity === 'task') {
    queryClient.setQueryData<Task[]>(taskKeys.all, tasks =>
      tasks ? upsertById(tasks, synced.item) : tasks,
    );
    return;
  }
  // The item's date may have moved it between months: place it in its own
  // month's cache and remove it from every other month.
  const targetMonth = yearMonthOf(synced.item.occurred_on);
  queryClient
    .getQueriesData<Transaction[]>({ queryKey: financeKeys.all })
    .forEach(([queryKey, transactions]) => {
      if (!transactions) {
        return;
      }
      const isTargetMonth = queryKey[1] === targetMonth;
      queryClient.setQueryData<Transaction[]>(
        queryKey,
        isTargetMonth
          ? upsertById(transactions, synced.item)
          : transactions.filter(item => item.id !== synced.item.id),
      );
    });
}

export async function flushPendingEntries(
  queryClient: QueryClient,
  userId: string,
): Promise<void> {
  const syncedItems = await pendingSyncService.syncPendingEntries(
    userId,
    synced => publishSyncedItem(queryClient, synced),
  );
  if (syncedItems.some(synced => synced.entity === 'task')) {
    await queryClient.invalidateQueries({ queryKey: taskKeys.all });
  }
  if (syncedItems.some(synced => synced.entity === 'transaction')) {
    await queryClient.invalidateQueries({ queryKey: financeKeys.all });
  }
}

export function flushPendingEntriesIfOnline(
  queryClient: QueryClient,
  userId: string,
  isOnline: boolean,
): void {
  if (!isOnline) {
    return;
  }
  flushPendingEntries(queryClient, userId).catch(error => {
    console.error('[usePendingSync] Sync run failed', error);
  });
}

export function useUserPendingEntries(): PendingEntry[] {
  const userId = useAuthStore(state => state.user?.id);
  const entries = usePendingSyncStore(state => state.entries);
  return useMemo(
    () => entries.filter(entry => entry.userId === userId),
    [entries, userId],
  );
}

// Drains the offline queue on reconnect, on startup (after store hydration),
// whenever a new entry is queued while online, and periodically while entries
// remain pending. Mount once for the authenticated app.
export function usePendingSync(): void {
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.user?.id);
  const { isOnline } = useNetworkStatus();
  const pendingCount = usePendingSyncStore(
    state =>
      state.entries.filter(
        entry => entry.userId === userId && entry.status === 'pending',
      ).length,
  );

  useEffect(() => {
    if (!userId || !isOnline || pendingCount === 0) {
      return;
    }
    const flush = () => flushPendingEntriesIfOnline(queryClient, userId, true);
    flush();
    const interval = setInterval(flush, RETRY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [queryClient, userId, isOnline, pendingCount]);
}
