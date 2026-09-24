const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;

const pad = (value: number) => String(value).padStart(2, '0');

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

// Screen-reader wording: "1 hour 12 minutes". Whole minutes only, so the text
// changes once a minute instead of every second.
export function formatCountdownSpoken(ms: number): string {
  const totalMinutes = Number.isFinite(ms)
    ? Math.max(0, Math.floor(ms / (SECONDS_PER_MINUTE * MS_PER_SECOND)))
    : 0;
  if (totalMinutes === 0) {
    return 'less than a minute';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [
    hours > 0 ? plural(hours, 'hour') : null,
    minutes > 0 ? plural(minutes, 'minute') : null,
  ]
    .filter(Boolean)
    .join(' ');
}

// "1:12:05" from one hour up, "12:05" below it. Rounded up so 00:00 only shows
// once the time has really run out.
export function formatCountdown(ms: number): string {
  const totalSeconds = Number.isFinite(ms)
    ? Math.max(0, Math.ceil(ms / MS_PER_SECOND))
    : 0;
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}
