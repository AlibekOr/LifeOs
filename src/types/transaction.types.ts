export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Education'
  | 'Entertainment'
  | 'Shopping'
  | 'Other';

export type IncomeCategory =
  | 'Salary'
  | 'Project'
  | 'Rent'
  | 'Business'
  | 'Gift'
  | 'Other';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  // Whole UZS.
  amount: number;
  // The DB requires a category matching the type; null only appears on rows
  // created before income categories existed.
  category: TransactionCategory | null;
  title: string | null;
  occurred_on: string;
  receipt_path: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTransactionInput = {
  type: TransactionType;
  amount: number;
  category: TransactionCategory | null;
  title?: string | null;
  occurred_on: string;
  receipt_path?: string | null;
};

export type UpdateTransactionInput = Partial<CreateTransactionInput>;
