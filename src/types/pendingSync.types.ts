import type { CreateTaskInput, Task, UpdateTaskInput } from './task.types.ts';
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from './transaction.types.ts';

export type PendingSyncStatus = 'pending' | 'failed';

export type PendingEntity = 'task' | 'transaction';

type PendingEntryBase = {
  // Client-generated UUID, identical to the row id once saved on the server.
  id: string;
  userId: string;
  status: PendingSyncStatus;
  attempts: number;
  lastError: string | null;
  // Bumped on every local change so a sync that finishes after a newer edit
  // does not discard that edit.
  revision: number;
  queuedAt: string;
};

export type PendingTaskEntry = PendingEntryBase & { entity: 'task' } & (
    | { operation: 'create'; payload: CreateTaskInput }
    | { operation: 'update'; payload: UpdateTaskInput }
  );

export type PendingTransactionEntry = PendingEntryBase & {
  entity: 'transaction';
} & (
    | { operation: 'create'; payload: CreateTransactionInput }
    | { operation: 'update'; payload: UpdateTransactionInput }
  );

export type PendingEntry = PendingTaskEntry | PendingTransactionEntry;

export type SyncStatus = 'synced' | PendingSyncStatus;

export type DisplayTask = Task & { syncStatus: SyncStatus };

export type DisplayTransaction = Transaction & { syncStatus: SyncStatus };
