import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import SyncStatusBadge from '../../../shared/components/SyncStatusBadge/SyncStatusBadge.tsx';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import {
  formatDuration,
  formatTime,
  priorityStyles,
} from '../utils/taskFormatting.ts';

type TaskListItemProps = {
  task: DisplayTask;
  onToggleComplete: (task: DisplayTask) => void;
  onPress?: (task: DisplayTask) => void;
};

const TaskListItem = ({
  task,
  onToggleComplete,
  onPress,
}: TaskListItemProps) => {
  const rowClassName = `flex-row items-center justify-between rounded-life-lg border border-life-border bg-life-surface p-life-4 ${
    task.is_completed ? 'opacity-50' : ''
  }`;

  const content = (
    <View className="flex-row items-center gap-life-3">
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.is_completed }}
        onPress={() => onToggleComplete(task)}
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          task.is_completed
            ? 'border-life-primary bg-life-primary'
            : 'border-life-border'
        }`}
      >
        {task.is_completed && (
          <LifeText variant="caption" className="font-bold">
            ✓
          </LifeText>
        )}
      </TouchableOpacity>
      <LifeText
        variant="bodySm"
        className="w-12 font-semibold text-life-accent"
      >
        {formatTime(task.scheduled_time)}
      </LifeText>
      <View>
        <LifeText
          variant="body"
          className={`font-medium ${task.is_completed ? 'line-through' : ''}`}
        >
          {task.title}
        </LifeText>
        <LifeText variant="caption" color="text-life-muted">
          {formatDuration(task.duration_minutes)}
          {task.attachment_path ? ' • 📎' : ''}
        </LifeText>
      </View>
    </View>
  );

  const badges = (
    <View className="items-end gap-life-1">
      {task.priority ? (
        <View
          className={`rounded-full px-life-3 py-life-1 ${
            priorityStyles[task.priority]
          }`}
        >
          <LifeText variant="caption" className="font-semibold">
            {task.priority}
          </LifeText>
        </View>
      ) : null}
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
