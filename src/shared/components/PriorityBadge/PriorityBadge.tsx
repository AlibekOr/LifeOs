import { View } from 'react-native';
import LifeText from '../Typography/LifeText.tsx';
import type { TaskPriority } from '../../../types/task.types.ts';

type PriorityBadgeProps = {
  priority: TaskPriority;
};

type BadgeStyle = {
  container: string;
  color: 'text-life-danger' | 'text-life-warning' | 'text-life-muted';
};

// Text/background pairs are contrast-checked against a life.surface card
// (WCAG AA needs 4.5:1): High 4.54, Medium 7.57, Low 4.62. The low-opacity
// borders keep the pill visible without lowering text contrast.
const badgeStyles: Record<TaskPriority, BadgeStyle> = {
  High: {
    container: 'border-life-danger/30 bg-life-danger/[0.08]',
    color: 'text-life-danger',
  },
  Medium: {
    container: 'border-life-warning/30 bg-life-warning/[0.08]',
    color: 'text-life-warning',
  },
  Low: {
    container: 'border-life-border bg-life-border',
    color: 'text-life-muted',
  },
};

const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const style = badgeStyles[priority];
  return (
    <View
      accessibilityLabel={`${priority} priority`}
      className={`rounded-full border px-life-3 py-life-1 ${style.container}`}
    >
      <LifeText variant="caption" color={style.color} className="font-semibold">
        {priority}
      </LifeText>
    </View>
  );
};

export default PriorityBadge;
