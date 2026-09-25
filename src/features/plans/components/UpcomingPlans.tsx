import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import type { DisplayPlan } from '../../../types/pendingSync.types.ts';
import type { UpcomingPlanEntry } from '../utils/upcomingPlans.ts';
import PlanListItem from './PlanListItem.tsx';

type UpcomingPlansProps = {
  entries: UpcomingPlanEntry<DisplayPlan>[];
  // Show a message instead of hiding the block, for when Home is filtered to
  // Plans and an empty screen would look broken.
  showEmpty?: boolean;
  onSeeAll: () => void;
  onPressPlan: (plan: DisplayPlan) => void;
};

const UpcomingPlans = ({
  entries,
  showEmpty = false,
  onSeeAll,
  onPressPlan,
}: UpcomingPlansProps) => {
  if (entries.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <View className="gap-life-3">
      <View className="flex-row items-center justify-between">
        <LifeText variant="h3" className="font-bold">
          Upcoming plans
        </LifeText>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="See all plans"
          onPress={onSeeAll}
        >
          <LifeText variant="bodySm" className="font-semibold text-life-accent">
            See all
          </LifeText>
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View className="items-center rounded-life-lg border border-life-border bg-life-surface p-life-6">
          <LifeText variant="bodySm" color="text-life-muted">
            No upcoming plans.
          </LifeText>
        </View>
      ) : (
        <View className="gap-life-3">
          {entries.map(entry => (
            <PlanListItem
              key={entry.plan.id}
              entry={entry}
              dayLabel={entry.dayLabel}
              onPress={onPressPlan}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default UpcomingPlans;
