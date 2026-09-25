import { onlineManager } from '@tanstack/react-query';
import { planService } from './plan.service.ts';
import { taskService } from './task.service.ts';
import { transactionService } from './transaction.service.ts';
import {
  usePendingSyncStore,
  waitForPendingSyncHydration,
} from '../store/pendingSync.store.ts';
import type { PendingEntry } from '../types/pendingSync.types.ts';
import type { Plan } from '../types/plan.types.ts';
import type { Task } from '../types/task.types.ts';
import type { Transaction } from '../types/transaction.types.ts';

const MAX_SYNC_ATTEMPTS = 3;

export type SyncedItem =
  | { entity: 'task'; item: Task }
  | { entity: 'transaction'; item: Transaction }
  | { entity: 'plan'; item: Plan };

type OnSynced = (synced: SyncedItem) => void;

async function sendEntry(entry: PendingEntry): Promise<SyncedItem> {
  if (entry.entity === 'task') {
    const item =
      entry.operation === 'create'
        ? await taskService.createTask(entry.payload, entry.id)
        : await taskService.updateTask(entry.id, entry.payload);
    return { entity: 'task', item };
  }
  if (entry.entity === 'plan') {
    const item =
      entry.operation === 'create'
        ? await planService.createPlan(entry.payload, entry.id)
        : await planService.updatePlan(entry.id, entry.payload);
    return { entity: 'plan', item };
  }
  const item =
    entry.operation === 'create'
      ? await transactionService.createTransaction(entry.payload, entry.id)
      : await transactionService.updateTransaction(entry.id, entry.payload);
  return { entity: 'transaction', item };
}

let inFlight: Promise<SyncedItem[]> | null = null;

async function runSync(
  userId: string,
  onSynced: OnSynced,
): Promise<SyncedItem[]> {
  await waitForPendingSyncHydration();

  const syncedItems: SyncedItem[] = [];
  const entries = usePendingSyncStore
    .getState()
    .entries.filter(
      entry => entry.userId === userId && entry.status === 'pending',
    );

  for (const entry of entries) {
    if (!onlineManager.isOnline()) {
      break;
    }
    try {
      const synced = await sendEntry(entry);
      // Publish the saved row before dropping the local entry so the item
      // never briefly disappears from the list.
      onSynced(synced);
      usePendingSyncStore.getState().resolveEntry(entry.id, entry.revision);
      syncedItems.push(synced);
    } catch (error) {
      console.error(
        '[pendingSync] Failed to sync',
        entry.entity,
        entry.id,
        error,
      );
      // Connectivity dropped mid-sync: not the entry's fault, keep it pending
      // without spending an attempt.
      if (!onlineManager.isOnline()) {
        break;
      }
      const message =
        error instanceof Error ? error.message : 'Unknown sync error';
      usePendingSyncStore
        .getState()
        .recordFailure(entry.id, message, MAX_SYNC_ATTEMPTS);
    }
  }

  return syncedItems;
}

// Single-flight: concurrent triggers (reconnect + interval + a new queued
// write) must not send the same entry twice.
function syncPendingEntries(
  userId: string,
  onSynced: OnSynced,
): Promise<SyncedItem[]> {
  if (!inFlight) {
    inFlight = runSync(userId, onSynced).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export const pendingSyncService = {
  syncPendingEntries,
};
