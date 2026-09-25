// Used until the profile has loaded, and matches the database default.
export const DEFAULT_WORK_START_TIME = '09:00:00';

// The choices offered in Profile; the user can also pick any other time.
export const WORK_START_PRESETS = [
  '07:00:00',
  '08:00:00',
  '09:00:00',
  '10:00:00',
] as const;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// The work start time ("HH:MM:SS") if it is still ahead of `now` today, else
// null. New tasks and plans default to it, but a start time that has already
// passed would make a new task "missed" at once, so it is not offered then.
export function workStartIfAhead(
  now: Date,
  workStart: string | null | undefined,
): string | null {
  if (!workStart) {
    return null;
  }
  const time = workStart.length === 5 ? `${workStart}:00` : workStart;
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
  return time > nowTime ? time : null;
}
