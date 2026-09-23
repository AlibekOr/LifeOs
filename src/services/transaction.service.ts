import { supabase } from '../shared/utils/supabase.ts';
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '../types/transaction.types.ts';

const UNIQUE_VIOLATION = '23505';

// "2026-09" → ["2026-09-01", "2026-10-01"): half-open so the last day is
// included without depending on month length.
function monthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split('-').map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    start: `${yearMonth}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
  };
}

async function getTransactionsForMonth(
  yearMonth: string,
): Promise<Transaction[]> {
  const { start, end } = monthRange(yearMonth);
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('occurred_on', start)
    .lt('occurred_on', end)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function getTransactionById(id: string): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function createTransaction(
  input: CreateTransactionInput,
  id?: string,
): Promise<Transaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? 'Not authenticated');
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...(id ? { id } : {}),
      user_id: userData.user.id,
      type: input.type,
      amount: input.amount,
      category: input.category,
      title: input.title ?? null,
      occurred_on: input.occurred_on,
      receipt_path: input.receipt_path ?? null,
    })
    .select()
    .single();

  // A retried offline insert whose first attempt reached the server but whose
  // response was lost: the row already exists, so treat it as saved.
  if (error && id && error.code === UNIQUE_VIOLATION) {
    return getTransactionById(id);
  }
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export const transactionService = {
  getTransactionsForMonth,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
