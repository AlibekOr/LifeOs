import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import type { Goal } from '../../../types/goal.types.ts';
import { formatMonthYear } from '../utils/goalProgress.ts';

type CompletedGoalItemProps = {
  goal: Goal;
  onPress: (goal: Goal) => void;
};

const CompletedGoalItem = ({ goal, onPress }: CompletedGoalItemProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`${goal.title}, completed`}
    onPress={() => onPress(goal)}
    className="flex-row items-center gap-life-4 rounded-life-lg border border-life-border bg-life-surface p-life-4 opacity-70"
  >
    <View className="h-8 w-8 items-center justify-center rounded-full bg-life-success">
      <LifeIcon name="check" size={16} strokeWidth={3} />
    </View>
    <View className="flex-1 gap-life-1">
      <LifeText
        variant="body"
        color="text-life-muted"
        className="font-semibold line-through"
        numberOfLines={2}
      >
        {goal.title}
      </LifeText>
      {goal.completed_at ? (
        <LifeText variant="caption" color="text-life-subtle">
          Completed {formatMonthYear(goal.completed_at)}
        </LifeText>
      ) : null}
    </View>
  </TouchableOpacity>
);

export default CompletedGoalItem;
