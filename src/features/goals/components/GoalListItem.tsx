import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeProgressRing from '../../../shared/components/ProgressRing/LifeProgressRing.tsx';
import type { Goal } from '../../../types/goal.types.ts';
import { formatMonthYear, type Progress } from '../utils/goalProgress.ts';

type GoalListItemProps = {
  goal: Goal;
  progress: Progress;
  onPress: (goal: Goal) => void;
};

const GoalListItem = ({ goal, progress, onPress }: GoalListItemProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`${goal.title}, ${progress.percent} percent`}
    onPress={() => onPress(goal)}
    className="flex-row items-center gap-life-4 rounded-life-lg border border-life-border bg-life-surface p-life-4"
  >
    <LifeProgressRing
      progress={progress.percent}
      size={48}
      strokeWidth={5}
      color="#818CF8"
    >
      <LifeText variant="caption" className="font-bold">
        {progress.percent}%
      </LifeText>
    </LifeProgressRing>
    <View className="flex-1 gap-life-1">
      <LifeText variant="body" className="font-semibold" numberOfLines={2}>
        {goal.title}
      </LifeText>
      <LifeText variant="caption" color="text-life-muted">
        {goal.deadline
          ? `Deadline: ${formatMonthYear(goal.deadline)}`
          : 'No deadline'}
      </LifeText>
    </View>
  </TouchableOpacity>
);

export default GoalListItem;
