import type {
  ExpenseCategory,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '../../../types/transaction.types.ts';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  isExpenseCategory,
} from './categories.ts';

export type CategoryTotal = {
  category: TransactionCategory;
  amount: number;
  // 0–1, relative to the largest category (drives the row's bar width).
  ratio: number;
  // Whole-number share of the month's total for this type (expenses or income).
  percent: number;
};

export type FinanceSummary = {
  income: number;
  expenses: number;
  savings: number;
  // Share of income that was kept; null when there is no income to compare to.
  savingsRate: number | null;
  // Sorted by amount, largest first.
  categories: CategoryTotal[];
  incomeCategories: CategoryTotal[];
};

export type SpendingInsight = {
  category: ExpenseCategory;
  percentChange: number;
  direction: 'more' | 'less';
};

function expenseTotalsByCategory(
  transactions: Transaction[],
): Map<ExpenseCategory, number> {
  const totals = new Map<ExpenseCategory, number>();
  transactions.forEach(item => {
    if (item.type === 'expense' && isExpenseCategory(item.category)) {
      totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
    }
  });
  return totals;
}

function categoryTotals(
  transactions: Transaction[],
  type: TransactionType,
  order: TransactionCategory[],
  grandTotal: number,
): CategoryTotal[] {
  const totals = new Map<TransactionCategory, number>();
  transactions.forEach(item => {
    if (item.type === type && item.category) {
      totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
    }
  });
  const largest = Math.max(0, ...totals.values());
  return order
    .filter(category => (totals.get(category) ?? 0) > 0)
    .map(category => {
      const amount = totals.get(category) ?? 0;
      return {
        category,
        amount,
        ratio: largest === 0 ? 0 : amount / largest,
        percent: grandTotal === 0 ? 0 : Math.round((amount / grandTotal) * 100),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function summarizeMonth(transactions: Transaction[]): FinanceSummary {
  let income = 0;
  let expenses = 0;
  transactions.forEach(item => {
    if (item.type === 'income') {
      income += item.amount;
    } else {
      expenses += item.amount;
    }
  });

  const savings = income - expenses;
  return {
    income,
    expenses,
    savings,
    savingsRate: income === 0 ? null : Math.round((savings / income) * 100),
    categories: categoryTotals(
      transactions,
      'expense',
      EXPENSE_CATEGORIES,
      expenses,
    ),
    incomeCategories: categoryTotals(
      transactions,
      'income',
      INCOME_CATEGORIES,
      income,
    ),
  };
}

// Change from `previous` to `current` as a whole percent; null when there is no
// previous value to compare against.
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

// The category whose spending changed the most (relative to last month) among
// categories with spending in both months. Null when nothing is comparable.
export function findSpendingInsight(
  current: Transaction[],
  previous: Transaction[],
): SpendingInsight | null {
  const currentTotals = expenseTotalsByCategory(current);
  const previousTotals = expenseTotalsByCategory(previous);

  let best: SpendingInsight | null = null;
  currentTotals.forEach((amount, category) => {
    const previousAmount = previousTotals.get(category);
    if (!previousAmount) {
      return;
    }
    const change = ((amount - previousAmount) / previousAmount) * 100;
    const percent = Math.round(Math.abs(change));
    if (percent === 0) {
      return;
    }
    if (!best || percent > best.percentChange) {
      best = {
        category,
        percentChange: percent,
        direction: change > 0 ? 'more' : 'less',
      };
    }
  });
  return best;
}
