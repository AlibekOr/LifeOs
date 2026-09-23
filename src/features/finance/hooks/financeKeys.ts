export const financeKeys = {
  all: ['transactions'] as const,
  month: (yearMonth: string) => ['transactions', yearMonth] as const,
};
