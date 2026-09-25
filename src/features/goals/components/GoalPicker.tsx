import { View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifePills from '../../../shared/components/Pills/LifePills.tsx';
import type { Goal, GoalMilestone } from '../../../types/goal.types.ts';

type GoalPickerProps = {
  // Goals that can be chosen; the parent includes the task's current goal even
  // if it is completed.
  goals: readonly Goal[];
  milestones: readonly GoalMilestone[];
  goalId: string | null;
  milestoneId: string | null;
  onChange: (goalId: string | null, milestoneId: string | null) => void;
};

const NONE = 'none';

// Links a task to a goal and, optionally, to one of that goal's milestones.
const GoalPicker = ({
  goals,
  milestones,
  goalId,
  milestoneId,
  onChange,
}: GoalPickerProps) => {
  const goalMilestones = milestones
    .filter(milestone => milestone.goal_id === goalId)
    .sort((a, b) => a.position - b.position);

  const labelFor = (id: string): string => {
    if (id === NONE) {
      return 'None';
    }
    return (
      goals.find(goal => goal.id === id)?.title ??
      milestones.find(milestone => milestone.id === id)?.title ??
      id
    );
  };

  return (
    <View className="gap-life-2">
      <LifeText variant="bodySm" className="font-medium text-life-muted">
        Goal
      </LifeText>
      <LifePills
        options={[NONE, ...goals.map(goal => goal.id)]}
        value={goalId ?? NONE}
        getLabel={labelFor}
        // Milestones belong to one goal, so changing the goal clears it.
        onChange={id => onChange(id === NONE ? null : id, null)}
      />
      {goalMilestones.length > 0 ? (
        <View className="gap-life-2 pt-life-2">
          <LifeText variant="bodySm" className="font-medium text-life-muted">
            Milestone
          </LifeText>
          <LifePills
            options={[NONE, ...goalMilestones.map(m => m.id)]}
            value={milestoneId ?? NONE}
            getLabel={labelFor}
            onChange={id => onChange(goalId, id === NONE ? null : id)}
          />
        </View>
      ) : null}
    </View>
  );
};

export default GoalPicker;
