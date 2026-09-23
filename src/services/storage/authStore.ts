import { create } from 'zustand/react';
import type { Session, User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  session: null,
  initialized: false,
  setSession: session => set({ session, user: session?.user ?? null }),
  setInitialized: initialized => set({ initialized }),
  clearUser: () => set({ user: null, session: null }),
}));

export function requireCurrentUserId(): string {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('Not authenticated');
  }
  return userId;
}
