import { View } from 'react-native';
import LifeText from '../Typography/LifeText.tsx';
import type { SyncStatus } from '../../../types/pendingSync.types.ts';

type SyncStatusBadgeProps = {
  status: SyncStatus;
};

const badges = {
  pending: {
    label: 'Pending sync',
    className: 'bg-life-warning/15',
    color: 'text-life-warning',
  },
  failed: {
    label: 'Sync failed',
    className: 'bg-life-danger/15',
    color: 'text-life-danger',
  },
} as const;

const SyncStatusBadge = ({ status }: SyncStatusBadgeProps) => {
  if (status === 'synced') {
    return null;
  }
  const badge = badges[status];
  return (
    <View
      accessibilityLabel={badge.label}
      className={`rounded-full px-life-3 py-life-1 ${badge.className}`}
    >
      <LifeText variant="caption" color={badge.color} className="font-semibold">
        {badge.label}
      </LifeText>
    </View>
  );
};

export default SyncStatusBadge;
