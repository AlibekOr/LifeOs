import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeProgressRing from '../../../shared/components/ProgressRing/LifeProgressRing.tsx';
import type { Goal } from '../../../types/goal.types.ts';
import { categoryBadgeLabel } from '../utils/goalCategories.ts';
import { formatMonthYear, type Progress } from '../utils/goalProgress.ts';

type FeaturedGoalCardProps = {
  goal: Goal;
  progress: Progress;
  milestoneCount: number;
  completedMilestones: number;
  onPress: (goal: Goal) => void;
};

function describeProgress(
  progress: Progress,
  milestoneCount: number,
  completedMilestones: number,
): string {
  if (milestoneCount > 0) {
    return `${completedMilestones} of ${milestoneCount} milestones completed`;
  }
  if (progress.total > 0) {
    return `${progress.completed} of ${progress.total} tasks done`;
  }
  return 'No tasks linked yet';
}

// The goal closest to being finished, shown large at the top of the list.
const FeaturedGoalCard = ({
  goal,
  progress,
  milestoneCount,
  completedMilestones,
  onPress,
}: FeaturedGoalCardProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`${goal.title}, ${progress.percent} percent`}
    onPress={() => onPress(goal)}
    className="gap-life-4 rounded-life-2xl border border-life-border bg-life-surface p-life-5"
  >
    <View className="flex-row items-center justify-between">
      <View className="rounded-life-sm bg-life-primary/15 px-life-3 py-life-1">
        <LifeText
          variant="caption"
          color="text-life-accent"
          className="font-semibold"
        >
          {categoryBadgeLabel(goal.category)}
        </LifeText>
      </View>
      {goal.deadline ? (
        <LifeText variant="caption" color="text-life-muted">
          Deadline: {formatMonthYear(goal.deadline)}
        </LifeText>
      ) : null}
    </View>

    <View className="flex-row items-center gap-life-4">
      <LifeProgressRing
        progress={progress.percent}
        size={72}
        strokeWidth={6}
        showEmptyDot
      >
        <LifeText variant="h3" className="font-bold">
          {progress.percent}%
        </LifeText>
      </LifeProgressRing>
      <View className="flex-1 gap-life-1">
        <LifeText variant="h3" className="font-bold" numberOfLines={2}>
          {goal.title}
        </LifeText>
        <LifeText variant="bodySm" color="text-life-muted">
          {describeProgress(progress, milestoneCount, completedMilestones)}
        </LifeText>
      </View>
    </View>
  </TouchableOpacity>
);

export default FeaturedGoalCard;
