import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import PriorityBadge from '../../../shared/components/PriorityBadge/PriorityBadge.tsx';
import SyncStatusBadge from '../../../shared/components/SyncStatusBadge/SyncStatusBadge.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import { formatDuration, formatTime } from '../utils/taskFormatting.ts';
import { isTaskOverdue } from '../utils/taskStatus.ts';

type TaskListItemProps = {
  task: DisplayTask;
  // Current time from useNow(), so Home and Tasks agree on what is overdue.
  now: Date;
  onToggleComplete: (task: DisplayTask) => void;
  onPress?: (task: DisplayTask) => void;
};

// The checkbox is drawn 24pt wide; this grows its touch target to 44×44pt.
const CHECKBOX_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const TaskListItem = ({
  task,
  now,
  onToggleComplete,
  onPress,
}: TaskListItemProps) => {
  const overdue = isTaskOverdue(task, now);
  const rowClassName = `flex-row items-center justify-between gap-life-3 rounded-life-lg border border-life-border bg-life-surface p-life-4 ${
    task.is_completed ? 'opacity-50' : ''
  }`;

  const content = (
    <View className="flex-1 flex-row items-center gap-life-3">
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.is_completed }}
        accessibilityLabel={`Complete task: ${task.title}`}
        hitSlop={CHECKBOX_HIT_SLOP}
        onPress={() => onToggleComplete(task)}
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          task.is_completed
            ? 'border-life-primary bg-life-primary'
            : 'border-life-border'
        }`}
      >
        {task.is_completed && (
          <LifeIcon name="check" size={14} strokeWidth={3} />
        )}
      </TouchableOpacity>
      <LifeText
        variant="bodySm"
        color={overdue ? 'text-life-danger' : 'text-life-accent'}
        className="w-12 font-semibold"
      >
        {formatTime(task.scheduled_time)}
      </LifeText>
      <View className="flex-1">
        <LifeText
          variant="body"
          className={`font-medium ${task.is_completed ? 'line-through' : ''}`}
        >
          {task.title}
        </LifeText>
        <View className="flex-row items-center gap-life-1">
          <LifeText variant="caption" color="text-life-muted">
            {formatDuration(task.duration_minutes)}
          </LifeText>
          {task.attachment_path ? (
            <LifeIcon name="paperclip" size={12} color="#9494A1" />
          ) : null}
          {overdue ? (
            <LifeText
              variant="caption"
              color="text-life-danger"
              className="font-semibold"
            >
              · Overdue
            </LifeText>
          ) : null}
        </View>
      </View>
    </View>
  );

  const badges = (
    <View className="items-end gap-life-1">
      {task.priority ? <PriorityBadge priority={task.priority} /> : null}
      <SyncStatusBadge status={task.syncStatus} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onPress(task)}
        className={rowClassName}
      >
        {content}
        {badges}
      </TouchableOpacity>
    );
  }

  return (
    <View className={rowClassName}>
      {content}
      {badges}
    </View>
  );
};

export default TaskListItem;
