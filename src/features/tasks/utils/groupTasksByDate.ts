import { todayDateString } from '../../../services/task.service.ts';
import type { Task } from '../../../types/task.types.ts';

export type TaskSection<T extends Task = Task> = {
  key: string;
  label: string;
  data: T[];
};

function tomorrowDateString() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString('en-CA');
}

function formatSectionLabel(dueDate: string) {
  const date = new Date(`${dueDate}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function groupTasksByDate<T extends Task>(tasks: T[]): TaskSection<T>[] {
  const today = todayDateString();
  const tomorrow = tomorrowDateString();

  const overdue: T[] = [];
  const archived: T[] = [];
  const todayTasks: T[] = [];
  const tomorrowTasks: T[] = [];
  const futureByDate = new Map<string, T[]>();

  tasks.forEach(task => {
    if (task.due_date < today) {
      // Past unfinished tasks need attention; finished ones are kept in the archive.
      (task.is_completed ? archived : overdue).push(task);
      return;
    }
    if (task.due_date === today) {
      todayTasks.push(task);
      return;
    }
    if (task.due_date === tomorrow) {
      tomorrowTasks.push(task);
      return;
    }
    const bucket = futureByDate.get(task.due_date) ?? [];
    bucket.push(task);
    futureByDate.set(task.due_date, bucket);
  });

  const sections: TaskSection<T>[] = [];
  if (overdue.length > 0) {
    sections.push({ key: 'overdue', label: 'Overdue', data: overdue });
  }
  if (todayTasks.length > 0) {
    sections.push({ key: 'today', label: 'Today', data: todayTasks });
  }
  if (tomorrowTasks.length > 0) {
    sections.push({ key: 'tomorrow', label: 'Tomorrow', data: tomorrowTasks });
  }
  [...futureByDate.keys()].sort().forEach(dueDate => {
    sections.push({
      key: dueDate,
      label: formatSectionLabel(dueDate),
      data: futureByDate.get(dueDate) ?? [],
    });
  });
  if (archived.length > 0) {
    // Most recent first, so yesterday's work is at the top of the archive.
    archived.sort((a, b) =>
      a.due_date === b.due_date
        ? b.scheduled_time.localeCompare(a.scheduled_time)
        : b.due_date.localeCompare(a.due_date),
    );
    sections.push({ key: 'archive', label: 'Archive', data: archived });
  }

  return sections;
}
