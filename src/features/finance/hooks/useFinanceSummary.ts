import { useMemo } from 'react';
import {
  findSpendingInsight,
  summarizeMonth,
} from '../utils/financeSummary.ts';
import { shiftYearMonth } from '../utils/month.ts';
import { useMonthTransactionsWithPending } from './useTransactions.ts';

export function useFinanceSummary(yearMonth: string) {
  const current = useMonthTransactionsWithPending(yearMonth);
  const previous = useMonthTransactionsWithPending(
    shiftYearMonth(yearMonth, -1),
  );

  const summary = useMemo(
    () => summarizeMonth(current.transactions ?? []),
    [current.transactions],
  );

  const previousSummary = useMemo(
    () =>
      previous.transactions ? summarizeMonth(previous.transactions) : null,
    [previous.transactions],
  );

  const insight = useMemo(() => {
    if (!current.transactions || !previous.transactions) {
      return null;
    }
    return findSpendingInsight(current.transactions, previous.transactions);
  }, [current.transactions, previous.transactions]);

  return { ...current, summary, previousSummary, insight };
}
