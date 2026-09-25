import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Counts how many times the app has returned to the foreground. Put it in an
// effect's dependencies to run that effect again each time.
export function useForegroundCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setCount(previous => previous + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  return count;
}
