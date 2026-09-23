import type {
  DisplayTransaction,
  PendingEntry,
  PendingTransactionEntry,
} from '../../../types/pendingSync.types.ts';
import type { Transaction } from '../../../types/transaction.types.ts';
import { yearMonthOf } from './month.ts';

type PendingTransactionCreate = Extract<
  PendingTransactionEntry,
  { operation: 'create' }
>;

export function buildLocalTransaction(
  entry: PendingTransactionCreate,
): Transaction {
  const { payload } = entry;
  return {
    id: entry.id,
    user_id: entry.userId,
    type: payload.type,
    amount: payload.amount,
    category: payload.category,
    title: payload.title ?? null,
    occurred_on: payload.occurred_on,
    receipt_path: payload.receipt_path ?? null,
    created_at: entry.queuedAt,
    updated_at: entry.queuedAt,
  };
}

function isTransactionEntry(
  entry: PendingEntry,
): entry is PendingTransactionEntry {
  return entry.entity === 'transaction';
}

function newestFirst(a: Transaction, b: Transaction) {
  if (a.occurred_on !== b.occurred_on) {
    return a.occurred_on < b.occurred_on ? 1 : -1;
  }
  if (a.created_at !== b.created_at) {
    return a.created_at < b.created_at ? 1 : -1;
  }
  return 0;
}

// Overlays unsynced local changes on confirmed server data; every item keeps a
// syncStatus so the UI never presents a local entry as saved. With a
// yearMonth, only items dated in that month are returned.
export function mergePendingTransactions(
  serverTransactions: Transaction[] | undefined,
  entries: PendingEntry[],
  yearMonth?: string,
): DisplayTransaction[] {
  const transactionEntries = entries.filter(isTransactionEntry);
  const entriesById = new Map(
    transactionEntries.map(entry => [entry.id, entry]),
  );
  const serverIds = new Set<string>();

  const merged: DisplayTransaction[] = (serverTransactions ?? []).map(item => {
    serverIds.add(item.id);
    const entry = entriesById.get(item.id);
    if (!entry) {
      return { ...item, syncStatus: 'synced' };
    }
    return { ...item, ...entry.payload, syncStatus: entry.status };
  });

  transactionEntries.forEach(entry => {
    if (entry.operation === 'create' && !serverIds.has(entry.id)) {
      merged.push({
        ...buildLocalTransaction(entry),
        syncStatus: entry.status,
      });
    }
  });

  const inScope = yearMonth
    ? merged.filter(item => yearMonthOf(item.occurred_on) === yearMonth)
    : merged;

  return inScope.sort(newestFirst);
}
