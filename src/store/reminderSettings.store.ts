import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand/react';
import { createJSONStorage, persist } from 'zustand/middleware';

// Minutes before a task starts. null = reminders off, 0 = at the start time.
export type ReminderLeadMinutes = number | null;

export const DEFAULT_REMINDER_LEAD_MINUTES = 10;

export const REMINDER_OPTIONS: { label: string; value: ReminderLeadMinutes }[] =
  [
    { label: 'Off', value: null },
    { label: 'At start', value: 0 },
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
  ];

type ReminderSettingsState = {
  leadMinutes: ReminderLeadMinutes;
  setLeadMinutes: (leadMinutes: ReminderLeadMinutes) => void;
};

export const useReminderSettingsStore = create<ReminderSettingsState>()(
  persist(
    set => ({
      leadMinutes: DEFAULT_REMINDER_LEAD_MINUTES,
      setLeadMinutes: leadMinutes => set({ leadMinutes }),
    }),
    {
      name: 'lifeos-reminder-settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ leadMinutes: state.leadMinutes }),
    },
  ),
);

// Until the saved value is loaded the store holds the default; acting on it
// would briefly schedule reminders the user had turned off.
export function useReminderSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useReminderSettingsStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useReminderSettingsStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useReminderSettingsStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
  }, []);

  return hydrated;
}
