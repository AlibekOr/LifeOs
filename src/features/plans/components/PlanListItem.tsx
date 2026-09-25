import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import SyncStatusBadge from '../../../shared/components/SyncStatusBadge/SyncStatusBadge.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import type { DisplayPlan } from '../../../types/pendingSync.types.ts';
import type { PlanListEntry } from '../utils/groupPlansByDate.ts';
import {
  formatPlanDateRange,
  formatTimeShort,
} from '../utils/planFormatting.ts';

type PlanListItemProps = {
  entry: PlanListEntry<DisplayPlan>;
  // "Tomorrow", "Sat, Oct 10": for lists that are not already grouped by day.
  dayLabel?: string | null;
  onPress: (plan: DisplayPlan) => void;
  onLongPress?: (plan: DisplayPlan) => void;
};

const STATUS_OPACITY = {
  planned: '',
  done: 'opacity-50',
  cancelled: 'opacity-60',
} as const;

function buildAccessibilityLabel(
  plan: DisplayPlan,
  timeText: string,
  dateRange: string | null,
): string {
  const parts = [plan.title, timeText];
  if (dateRange) {
    parts.push(dateRange);
  }
  if (plan.location) {
    parts.push(plan.location);
  }
  if (plan.status !== 'planned') {
    parts.push(plan.status);
  }
  return parts.join(', ');
}

const PlanListItem = ({
  entry,
  dayLabel,
  onPress,
  onLongPress,
}: PlanListItemProps) => {
  const { plan, progress } = entry;
  const isCancelled = plan.status === 'cancelled';
  // Later days of a multi-day plan have no start time of their own.
  const isContinuation = progress !== null && progress.day > 1;
  const showTime = plan.plan_time !== null && !isContinuation;
  const dateRange = formatPlanDateRange(plan);
  const timeText =
    showTime && plan.plan_time ? formatTimeShort(plan.plan_time) : 'All day';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={buildAccessibilityLabel(
        plan,
        dayLabel ? `${dayLabel}, ${timeText}` : timeText,
        dateRange,
      )}
      onPress={() => onPress(plan)}
      onLongPress={onLongPress ? () => onLongPress(plan) : undefined}
      className={`flex-row items-center gap-life-3 rounded-life-lg border border-life-border bg-life-surface p-life-4 ${
        STATUS_OPACITY[plan.status]
      }`}
    >
      <View className="w-14">
        <LifeText
          variant={showTime ? 'bodySm' : 'caption'}
          color={showTime ? 'text-life-text' : 'text-life-muted'}
          className="font-semibold"
        >
          {timeText}
        </LifeText>
        {showTime && plan.plan_end_time ? (
          <LifeText variant="caption" color="text-life-muted">
            {formatTimeShort(plan.plan_end_time)}
          </LifeText>
        ) : null}
      </View>

      <View className="flex-1 gap-life-1">
        <LifeText
          variant="body"
          className={`font-medium ${isCancelled ? 'line-through' : ''}`}
        >
          {plan.title}
        </LifeText>
        {plan.location ? (
          <View className="flex-row items-center gap-life-1">
            <LifeIcon name="map-pin" size={12} color="#9494A1" />
            <LifeText
              variant="caption"
              color="text-life-muted"
              numberOfLines={1}
              className="flex-1"
            >
              {plan.location}
            </LifeText>
          </View>
        ) : null}
        {dayLabel || dateRange || progress || isCancelled ? (
          <View className="flex-row flex-wrap items-center gap-life-2">
            {dayLabel ? (
              <LifeText variant="caption" color="text-life-muted">
                {dayLabel}
              </LifeText>
            ) : null}
            {dateRange ? (
              <LifeText variant="caption" color="text-life-muted">
                {dateRange}
              </LifeText>
            ) : null}
            {progress ? (
              <LifeText
                variant="caption"
                color="text-life-primary"
                className="font-semibold"
              >
                Day {progress.day} of {progress.total}
              </LifeText>
            ) : null}
            {isCancelled ? (
              <LifeText
                variant="caption"
                color="text-life-danger"
                className="font-semibold"
              >
                Cancelled
              </LifeText>
            ) : null}
          </View>
        ) : null}
      </View>

      <SyncStatusBadge status={plan.syncStatus} />
    </TouchableOpacity>
  );
};

export default PlanListItem;
