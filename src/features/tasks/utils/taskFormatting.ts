export function formatTime(time: string) {
  return time.slice(0, 5);
}

// "HH:mm" in local time, same shape as formatTime.
export function formatClock(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "14:00 – 16:00"
export function formatTimeRange(start: Date, end: Date) {
  return `${formatClock(start)} – ${formatClock(end)}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
