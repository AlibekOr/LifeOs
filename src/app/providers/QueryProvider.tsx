import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { PropsWithChildren } from 'react';

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

onlineManager.setEventListener(setOnline =>
  NetInfo.addEventListener(state => {
    // isInternetReachable is null until the first probe completes; only treat
    // an explicit `false` as offline to avoid flashing the offline banner.
    setOnline(
      Boolean(state.isConnected) && state.isInternetReachable !== false,
    );
  }),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      // Must be >= the persister maxAge or restored queries are GC'd immediately.
      gcTime: CACHE_MAX_AGE_MS,
      retry: 1,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'lifeos-query-cache',
});

const QueryProvider = ({ children }: PropsWithChildren) => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: CACHE_MAX_AGE_MS,
      dehydrateOptions: {
        // Offline writes live in the pending-sync store; paused mutations can't
        // be resumed after a restart without registered mutation defaults.
        shouldDehydrateMutation: () => false,
      },
    }}
  >
    {children}
  </PersistQueryClientProvider>
);

export default QueryProvider;
