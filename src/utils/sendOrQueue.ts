import { onlineManager } from '@tanstack/react-query';
import { isNetworkError } from './networkError.ts';

// Offline-capable mutations must run their mutationFn while offline (to queue
// the write) instead of being paused by TanStack's default 'online' mode.
export const OFFLINE_CAPABLE_MUTATION = { networkMode: 'always' } as const;

type SendOrQueueOptions<T> = {
  send: () => Promise<T>;
  queue: () => T;
  // Queue even when online, e.g. the record still has an unsynced local entry
  // and a direct API call would reach the server out of order.
  forceQueue?: boolean;
};

// Offline-first write: hit the API when possible, otherwise (or on a transport
// failure) record the write locally for the sync queue. Server-side
// rejections are rethrown so the user sees them.
export async function sendOrQueue<T>({
  send,
  queue,
  forceQueue = false,
}: SendOrQueueOptions<T>): Promise<T> {
  if (forceQueue || !onlineManager.isOnline()) {
    return queue();
  }
  try {
    return await send();
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error;
    }
    return queue();
  }
}
