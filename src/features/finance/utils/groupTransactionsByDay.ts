import { todayDateString } from '../../../services/task.service.ts';
import type { DisplayTransaction } from '../../../types/pendingSync.types.ts';

export type TransactionDaySection = {
  key: string;
  label: string;
  // Income minus expenses for the day.
  net: number;
  data: DisplayTransaction[];
};

function yesterdayDateString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString('en-CA');
}

function dayLabel(isoDate: string, today: string, yesterday: string) {
  if (isoDate === today) {
    return 'Today';
  }
  if (isoDate === yesterday) {
    return 'Yesterday';
  }
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Expects transactions already sorted newest first, so same-day items are
// adjacent.
export function groupTransactionsByDay(
  transactions: DisplayTransaction[],
): TransactionDaySection[] {
  const today = todayDateString();
  const yesterday = yesterdayDateString();
  const sections: TransactionDaySection[] = [];

  transactions.forEach(item => {
    const last = sections[sections.length - 1];
    const signed = item.type === 'income' ? item.amount : -item.amount;
    if (last && last.key === item.occurred_on) {
      last.data.push(item);
      last.net += signed;
      return;
    }
    sections.push({
      key: item.occurred_on,
      label: dayLabel(item.occurred_on, today, yesterday),
      net: signed,
      data: [item],
    });
  });

  return sections;
}
