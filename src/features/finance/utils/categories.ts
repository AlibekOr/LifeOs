import type {
  ExpenseCategory,
  IncomeCategory,
  TransactionCategory,
  TransactionType,
} from '../../../types/transaction.types.ts';

// Must stay in sync with the transactions_category_matches_type constraint.
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Education',
  'Entertainment',
  'Shopping',
  'Other',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Project',
  'Rent',
  'Business',
  'Gift',
  'Other',
];

// A chart only ever shows one type, so income and expense categories may reuse
// the same colors.
export const categoryBarClassNames: Record<TransactionCategory, string> = {
  Food: 'bg-life-primary',
  Transport: 'bg-life-accent',
  Education: 'bg-life-success',
  Entertainment: 'bg-life-warning',
  Shopping: 'bg-life-danger',
  Salary: 'bg-life-success',
  Project: 'bg-life-primary',
  Rent: 'bg-life-accent',
  Business: 'bg-life-warning',
  Gift: 'bg-life-subtle',
  Other: 'bg-life-muted',
};

export const categoryEmoji: Record<TransactionCategory, string> = {
  Food: '🍔',
  Transport: '🚌',
  Education: '📚',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Salary: '💼',
  Project: '🛠️',
  Rent: '🏠',
  Business: '🏢',
  Gift: '🎁',
  Other: '📦',
};

export const TYPE_EMOJI: Record<TransactionType, string> = {
  expense: '💸',
  income: '💰',
};

export function defaultCategoryFor(type: TransactionType): TransactionCategory {
  return type === 'expense' ? 'Food' : 'Salary';
}

export function isExpenseCategory(
  category: TransactionCategory | null,
): category is ExpenseCategory {
  return (
    category !== null &&
    (EXPENSE_CATEGORIES as TransactionCategory[]).includes(category)
  );
}

// Rows saved before income categories existed have none; show them as "Other".
export function emojiFor(
  category: TransactionCategory | null,
  type: TransactionType,
): string {
  return category ? categoryEmoji[category] : TYPE_EMOJI[type];
}
