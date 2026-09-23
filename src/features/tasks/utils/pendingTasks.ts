import { todayDateString } from '../../../services/task.service.ts';
import type {
  DisplayTask,
  PendingEntry,
  PendingTaskEntry,
} from '../../../types/pendingSync.types.ts';
import type { Task } from '../../../types/task.types.ts';

type PendingTaskCreate = Extract<PendingTaskEntry, { operation: 'create' }>;

export function buildLocalTask(entry: PendingTaskCreate): Task {
  const { payload } = entry;
  return {
    id: entry.id,
    user_id: entry.userId,
    title: payload.title,
    scheduled_time: payload.scheduled_time,
    duration_minutes: payload.duration_minutes,
    priority: payload.priority ?? null,
    is_completed: payload.is_completed ?? false,
    due_date: payload.due_date ?? todayDateString(),
    attachment_path: payload.attachment_path ?? null,
    created_at: entry.queuedAt,
    updated_at: entry.queuedAt,
  };
}

function compareBySchedule(a: Task, b: Task) {
  if (a.due_date !== b.due_date) {
    return a.due_date < b.due_date ? -1 : 1;
  }
  if (a.scheduled_time !== b.scheduled_time) {
    return a.scheduled_time < b.scheduled_time ? -1 : 1;
  }
  return 0;
}

function isTaskEntry(entry: PendingEntry): entry is PendingTaskEntry {
  return entry.entity === 'task';
}

// Overlays unsynced local changes on top of confirmed server data. Every item
// keeps a syncStatus so the UI never presents a local entry as saved.
export function mergePendingTasks(
  serverTasks: Task[] | undefined,
  entries: PendingEntry[],
): DisplayTask[] {
  const taskEntries = entries.filter(isTaskEntry);
  const entriesById = new Map(taskEntries.map(entry => [entry.id, entry]));
  const serverIds = new Set<string>();

  const merged: DisplayTask[] = (serverTasks ?? []).map(task => {
    serverIds.add(task.id);
    const entry = entriesById.get(task.id);
    if (!entry) {
      return { ...task, syncStatus: 'synced' };
    }
    return { ...task, ...entry.payload, syncStatus: entry.status };
  });

  taskEntries.forEach(entry => {
    if (entry.operation === 'create' && !serverIds.has(entry.id)) {
      merged.push({ ...buildLocalTask(entry), syncStatus: entry.status });
    }
  });

  return merged.sort(compareBySchedule);
}
