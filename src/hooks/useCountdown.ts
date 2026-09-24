import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const TICK_MS = 1000;

export type Countdown = {
  remainingMs: number;
  isFinished: boolean;
};

// Time left until `target`. Every tick recomputes from the clock instead of
// decrementing a counter, so late or skipped ticks cannot make it drift. It only
// ticks while mounted and the app is in the foreground; on return it recomputes
// at once, and it stops by itself when the target is reached.
export function useCountdown(target: Date): Countdown {
  const targetMs = target.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };

    const start = () => {
      stop();
      const current = Date.now();
      setNow(current);
      if (current >= targetMs) {
        return;
      }
      interval = setInterval(() => {
        const tick = Date.now();
        setNow(tick);
        if (tick >= targetMs) {
          stop();
        }
      }, TICK_MS);
    };

    if (AppState.currentState === 'active') {
      start();
    } else {
      setNow(Date.now());
    }

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [targetMs]);

  const remainingMs = Number.isNaN(targetMs) ? 0 : Math.max(0, targetMs - now);
  return { remainingMs, isFinished: remainingMs === 0 };
}
