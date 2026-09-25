function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// "HH:MM[:SS]" as today's date at that local time, for the native time picker.
export function timeFromString(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// A picked time as "HH:MM:00", the shape of a Postgres `time` column.
export function timeToString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}
