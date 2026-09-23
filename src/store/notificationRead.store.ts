import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand/react';
import { createJSONStorage, persist } from 'zustand/middleware';

// Notifications are derived from live data, so only which ones the user has
// seen is stored. Keyed by user so accounts on one device don't share state.
const MAX_READ_IDS_PER_USER = 300;

type NotificationReadState = {
  readByUser: Record<string, string[]>;
  markRead: (userId: string, id: string) => void;
  markAllRead: (userId: string, ids: string[]) => void;
};

function withIds(existing: string[], added: string[]): string[] {
  const merged = [...existing];
  added.forEach(id => {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  });
  // Old ids belong to alerts that no longer exist; drop the oldest.
  return merged.slice(-MAX_READ_IDS_PER_USER);
}

export const useNotificationReadStore = create<NotificationReadState>()(
  persist(
    set => ({
      readByUser: {},

      markRead: (userId, id) =>
        set(state => ({
          readByUser: {
            ...state.readByUser,
            [userId]: withIds(state.readByUser[userId] ?? [], [id]),
          },
        })),

      markAllRead: (userId, ids) =>
        set(state => ({
          readByUser: {
            ...state.readByUser,
            [userId]: withIds(state.readByUser[userId] ?? [], ids),
          },
        })),
    }),
    {
      name: 'lifeos-notification-read',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ readByUser: state.readByUser }),
    },
  ),
);
