import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus.ts';
import { useAuthStore } from '../../../services/storage/authStore.ts';
import { usePendingSyncStore } from '../../../store/pendingSync.store.ts';
import { useUserPendingEntries } from '../../../hooks/usePendingSync.ts';

function pluralizeChanges(count: number) {
  return `${count} change${count === 1 ? '' : 's'}`;
}

const SyncStatusBanner = () => {
  const { isOnline } = useNetworkStatus();
  const userId = useAuthStore(state => state.user?.id);
  const retryAllFailed = usePendingSyncStore(state => state.retryAllFailed);
  const entries = useUserPendingEntries();

  const pendingCount = entries.filter(e => e.status === 'pending').length;
  const failedCount = entries.filter(e => e.status === 'failed').length;

  if (!isOnline) {
    return (
      <View
        accessibilityRole="alert"
        className="gap-life-1 rounded-life-md border border-life-warning/40 bg-life-warning/15 px-life-4 py-life-3"
      >
        <LifeText
          variant="bodySm"
          color="text-life-warning"
          className="font-semibold"
        >
          You're offline
        </LifeText>
        <LifeText variant="caption" color="text-life-warning">
          {pendingCount > 0
            ? `${pluralizeChanges(pendingCount)} will sync when you reconnect.`
            : 'Showing your last synced tasks. New tasks will sync later.'}
        </LifeText>
      </View>
    );
  }

  if (failedCount > 0) {
    return (
      <View
        accessibilityRole="alert"
        className="flex-row items-center justify-between gap-life-3 rounded-life-md border border-life-danger/40 bg-life-danger/15 px-life-4 py-life-3"
      >
        <LifeText variant="bodySm" color="text-life-danger" className="flex-1">
          {pluralizeChanges(failedCount)} couldn't be synced.
        </LifeText>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Retry failed syncs"
          onPress={() => {
            if (userId) {
              retryAllFailed(userId);
            }
          }}
        >
          <LifeText
            variant="bodySm"
            color="text-life-danger"
            className="font-semibold"
          >
            Retry
          </LifeText>
        </TouchableOpacity>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <View className="rounded-life-md border border-life-warning/40 bg-life-warning/15 px-life-4 py-life-3">
        <LifeText variant="bodySm" color="text-life-warning">
          Syncing {pluralizeChanges(pendingCount)}…
        </LifeText>
      </View>
    );
  }

  return null;
};

export default SyncStatusBanner;
