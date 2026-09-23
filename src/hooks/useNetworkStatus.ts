import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

// Reads TanStack's onlineManager (fed by NetInfo in QueryProvider) so the UI
// and query pausing always agree on connectivity.
export function useNetworkStatus(): { isOnline: boolean } {
  const isOnline = useSyncExternalStore(
    onlineManager.subscribe.bind(onlineManager),
    () => onlineManager.isOnline(),
  );
  return { isOnline };
}
