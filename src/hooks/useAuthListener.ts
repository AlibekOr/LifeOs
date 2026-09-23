import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../shared/utils/supabase.ts';
import { useAuthStore } from '../services/storage/authStore.ts';
import { notificationService } from '../services/notification.service.ts';

export function useAuthListener() {
  const setSession = useAuthStore(state => state.setSession);
  const setInitialized = useAuthStore(state => state.setInitialized);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialized(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // The query cache is persisted to disk; drop it so the next account on
        // this device never sees the previous user's data. Pending offline
        // entries are kept (scoped by userId) and sync on that user's return.
        if (event === 'SIGNED_OUT') {
          queryClient.clear();
          notificationService.cancelAllTaskReminders();
        }
        setSession(session);
      },
    );

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [setSession, setInitialized, queryClient]);
}
