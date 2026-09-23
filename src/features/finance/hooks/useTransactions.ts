import { useMemo } from 'react';
import {
  QueryClient,
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { transactionService } from '../../../services/transaction.service.ts';
import { requireCurrentUserId } from '../../../services/storage/authStore.ts';
import {
  hasPendingEntry,
  usePendingSyncStore,
} from '../../../store/pendingSync.store.ts';
import {
  flushPendingEntriesIfOnline,
  useUserPendingEntries,
} from '../../../hooks/usePendingSync.ts';
import {
  OFFLINE_CAPABLE_MUTATION,
  sendOrQueue,
} from '../../../utils/sendOrQueue.ts';
import { generateUuid } from '../../../utils/uuid.ts';
import type { DisplayTransaction } from '../../../types/pendingSync.types.ts';
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '../../../types/transaction.types.ts';
import {
  buildLocalTransaction,
  mergePendingTransactions,
} from '../utils/pendingTransactions.ts';
import { financeKeys } from './financeKeys.ts';

function findCurrentTransaction(queryClient: QueryClient, id: string) {
  const cached = queryClient
    .getQueriesData<Transaction[]>({ queryKey: financeKeys.all })
    .flatMap(([, transactions]) => transactions ?? []);
  return mergePendingTransactions(
    cached,
    usePendingSyncStore.getState().entries,
  ).find(item => item.id === id);
}

function createOrQueue(input: CreateTransactionInput): Promise<Transaction> {
  const userId = requireCurrentUserId();
  // Generated up front so a queued retry of this insert stays idempotent.
  const id = generateUuid();

  return sendOrQueue({
    send: () => transactionService.createTransaction(input, id),
    queue: () => {
      usePendingSyncStore
        .getState()
        .enqueueCreate({ entity: 'transaction', userId, id, payload: input });
      const entry = usePendingSyncStore
        .getState()
        .entries.find(item => item.id === id);
      if (entry?.entity !== 'transaction' || entry.operation !== 'create') {
        throw new Error('Failed to queue transaction for sync.');
      }
      return buildLocalTransaction(entry);
    },
  });
}

function updateOrQueue(
  queryClient: QueryClient,
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const userId = requireCurrentUserId();

  return sendOrQueue({
    send: () => transactionService.updateTransaction(id, input),
    queue: () => {
      const base = findCurrentTransaction(queryClient, id);
      if (!base) {
        throw new Error('Transaction not found.');
      }
      usePendingSyncStore
        .getState()
        .enqueueUpdate({ entity: 'transaction', userId, id, payload: input });
      flushPendingEntriesIfOnline(
        queryClient,
        userId,
        onlineManager.isOnline(),
      );
      return { ...base, ...input };
    },
    // A transaction with a queued entry may not exist on the server yet, so
    // edits must merge into that entry rather than hit the API out of order.
    forceQueue: hasPendingEntry(id),
  });
}

export function useMonthTransactions(yearMonth: string) {
  return useQuery({
    queryKey: financeKeys.month(yearMonth),
    queryFn: () => transactionService.getTransactionsForMonth(yearMonth),
  });
}

export function useMonthTransactionsWithPending(yearMonth: string) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useMonthTransactions(yearMonth);
  const entries = useUserPendingEntries();

  const transactions = useMemo<DisplayTransaction[] | undefined>(() => {
    const hasEntries = entries.some(entry => entry.entity === 'transaction');
    if (!data && !hasEntries) {
      return undefined;
    }
    return mergePendingTransactions(data, entries, yearMonth);
  }, [data, entries, yearMonth]);

  return { transactions, isLoading, isError, error, refetch, isRefetching };
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    ...OFFLINE_CAPABLE_MUTATION,
    mutationFn: (input: CreateTransactionInput) => createOrQueue(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    ...OFFLINE_CAPABLE_MUTATION,
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTransactionInput;
    }) => updateOrQueue(queryClient, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: (_data, id) => {
      // Deleting is an explicit user action, so dropping any queued write for
      // this transaction is intentional, not a silent loss.
      usePendingSyncStore.getState().discardEntry(id);
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}
