import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export const MINUTE_MS = 60 * 1000;

// The current time, refreshed when the screen gains focus and when the app
// returns to the foreground. Without `tickMs` there are no timers: a screen left
// open across a boundary (greeting hour, midnight, a task's start time) updates
// the next time the user looks at it. With `tickMs` it also refreshes on that
// interval, but only while the app is in the foreground.
export function useNow(tickMs?: number): Date {
  const [now, setNow] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
    }, []),
  );

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
      if (tickMs) {
        interval = setInterval(() => setNow(new Date()), tickMs);
      }
    };

    if (AppState.currentState === 'active') {
      start();
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setNow(new Date());
        start();
      } else {
        stop();
      }
    });
    return () => {
      stop();
      subscription.remove();
    };
  }, [tickMs]);

  return now;
}
