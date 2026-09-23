import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand/react';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PendingEntry } from '../types/pendingSync.types.ts';
import type { CreateTaskInput, UpdateTaskInput } from '../types/task.types.ts';
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../types/transaction.types.ts';

type EntryIdentity = { userId: string; id: string };

type EnqueueCreateParams = EntryIdentity &
  (
    | { entity: 'task'; payload: CreateTaskInput }
    | { entity: 'transaction'; payload: CreateTransactionInput }
  );

type EnqueueUpdateParams = EntryIdentity &
  (
    | { entity: 'task'; payload: UpdateTaskInput }
    | { entity: 'transaction'; payload: UpdateTransactionInput }
  );

type PersistedPendingSync = { entries: PendingEntry[] };

type PendingSyncState = PersistedPendingSync & {
  enqueueCreate: (params: EnqueueCreateParams) => void;
  enqueueUpdate: (params: EnqueueUpdateParams) => void;
  resolveEntry: (id: string, syncedRevision: number) => void;
  recordFailure: (id: string, message: string, maxAttempts: number) => void;
  retryEntry: (id: string) => void;
  retryAllFailed: (userId: string) => void;
  discardEntry: (id: string) => void;
};

const STORE_VERSION = 2;

function freshMeta() {
  return {
    status: 'pending' as const,
    attempts: 0,
    lastError: null,
    revision: 0,
    queuedAt: new Date().toISOString(),
  };
}

function newCreateEntry(params: EnqueueCreateParams): PendingEntry {
  const { userId, id } = params;
  if (params.entity === 'task') {
    return {
      entity: 'task',
      operation: 'create',
      id,
      userId,
      payload: params.payload,
      ...freshMeta(),
    };
  }
  return {
    entity: 'transaction',
    operation: 'create',
    id,
    userId,
    payload: params.payload,
    ...freshMeta(),
  };
}

function newUpdateEntry(params: EnqueueUpdateParams): PendingEntry {
  const { userId, id } = params;
  if (params.entity === 'task') {
    return {
      entity: 'task',
      operation: 'update',
      id,
      userId,
      payload: params.payload,
      ...freshMeta(),
    };
  }
  return {
    entity: 'transaction',
    operation: 'update',
    id,
    userId,
    payload: params.payload,
    ...freshMeta(),
  };
}

// Coalesce edits into the queued entry so the server receives one final write
// instead of replaying every intermediate edit.
function mergeIntoEntry(
  entry: PendingEntry,
  params: EnqueueUpdateParams,
): PendingEntry {
  if (entry.entity === 'task' && params.entity === 'task') {
    return entry.operation === 'create'
      ? { ...entry, payload: { ...entry.payload, ...params.payload } }
      : { ...entry, payload: { ...entry.payload, ...params.payload } };
  }
  if (entry.entity === 'transaction' && params.entity === 'transaction') {
    return entry.operation === 'create'
      ? { ...entry, payload: { ...entry.payload, ...params.payload } }
      : { ...entry, payload: { ...entry.payload, ...params.payload } };
  }
  throw new Error(`Pending entry ${entry.id} belongs to another entity.`);
}

type V1Entry = Omit<
  Extract<PendingEntry, { entity: 'task' }>,
  'id' | 'entity'
> & {
  taskId: string;
};

// v1 only queued tasks and keyed them by `taskId`; keep them so nothing a user
// created offline before this upgrade is lost.
function migrateToV2(persisted: unknown): PersistedPendingSync {
  const entries = (persisted as { entries?: V1Entry[] } | null)?.entries ?? [];
  return {
    entries: entries.map(({ taskId, ...rest }) => ({
      ...rest,
      id: taskId,
      entity: 'task',
    })) as PendingEntry[],
  };
}

export const usePendingSyncStore = create<PendingSyncState>()(
  persist(
    set => ({
      entries: [],

      enqueueCreate: params =>
        set(state => ({ entries: [...state.entries, newCreateEntry(params)] })),

      enqueueUpdate: params =>
        set(state => {
          const existing = state.entries.find(entry => entry.id === params.id);
          if (!existing) {
            return { entries: [...state.entries, newUpdateEntry(params)] };
          }
          return {
            entries: state.entries.map(entry =>
              entry.id === params.id
                ? {
                    ...mergeIntoEntry(entry, params),
                    status: 'pending',
                    attempts: 0,
                    lastError: null,
                    revision: entry.revision + 1,
                  }
                : entry,
            ),
          };
        }),

      resolveEntry: (id, syncedRevision) =>
        set(state => {
          const entry = state.entries.find(item => item.id === id);
          if (!entry) {
            return state;
          }
          if (entry.revision === syncedRevision) {
            return { entries: state.entries.filter(item => item.id !== id) };
          }
          // Edited while the request was in flight: the row now exists on the
          // server, so the newer payload must go out as an update.
          return {
            entries: state.entries.map(item =>
              item.id === id
                ? {
                    ...item,
                    operation: 'update',
                    status: 'pending',
                    attempts: 0,
                    lastError: null,
                  }
                : item,
            ),
          };
        }),

      recordFailure: (id, message, maxAttempts) =>
        set(state => ({
          entries: state.entries.map(entry => {
            if (entry.id !== id) {
              return entry;
            }
            const attempts = entry.attempts + 1;
            return {
              ...entry,
              attempts,
              lastError: message,
              status: attempts >= maxAttempts ? 'failed' : 'pending',
            };
          }),
        })),

      retryEntry: id =>
        set(state => ({
          entries: state.entries.map(entry =>
            entry.id === id
              ? { ...entry, status: 'pending', attempts: 0, lastError: null }
              : entry,
          ),
        })),

      retryAllFailed: userId =>
        set(state => ({
          entries: state.entries.map(entry =>
            entry.userId === userId && entry.status === 'failed'
              ? { ...entry, status: 'pending', attempts: 0, lastError: null }
              : entry,
          ),
        })),

      discardEntry: id =>
        set(state => ({
          entries: state.entries.filter(entry => entry.id !== id),
        })),
    }),
    {
      name: 'lifeos-pending-sync',
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedPendingSync => ({ entries: state.entries }),
      migrate: (persisted, version) =>
        version < 2
          ? migrateToV2(persisted)
          : (persisted as PersistedPendingSync),
    },
  ),
);

export function hasPendingEntry(id: string): boolean {
  return usePendingSyncStore.getState().entries.some(entry => entry.id === id);
}

export function waitForPendingSyncHydration(): Promise<void> {
  if (usePendingSyncStore.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const unsubscribe = usePendingSyncStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}
