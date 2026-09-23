import type { TaskPriority } from '../../../types/task.types.ts';

export const priorityStyles: Record<TaskPriority, string> = {
  High: 'bg-life-danger/15 text-life-danger',
  Medium: 'bg-life-warning/15 text-life-warning',
  Low: 'bg-life-muted/15 text-life-muted',
};

export function formatTime(time: string) {
  return time.slice(0, 5);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
