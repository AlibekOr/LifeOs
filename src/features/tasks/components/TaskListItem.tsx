import type { ComponentProps } from 'react';
import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import PriorityBadge from '../../../shared/components/PriorityBadge/PriorityBadge.tsx';
import SyncStatusBadge from '../../../shared/components/SyncStatusBadge/SyncStatusBadge.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import { formatTimeRange } from '../utils/taskFormatting.ts';
import { getTaskTimeInfo, type TaskTimeStatus } from '../utils/taskStatus.ts';

type TaskListItemProps = {
  task: DisplayTask;
  // Current time from useNow(), so Home and Tasks agree on each task's status.
  // It moves about once a minute, so rows never tick every second.
  now: Date;
  onToggleComplete: (task: DisplayTask) => void;
  onPress?: (task: DisplayTask) => void;
};

type TextColor = NonNullable<ComponentProps<typeof LifeText>['color']>;

// Only the task in progress uses life.primary for its time; everything else
// stays neutral, or danger when it slipped.
const TIME_COLOR: Record<TaskTimeStatus, TextColor> = {
  upcoming: 'text-life-text',
  'awaiting-start': 'text-life-text',
  'in-progress': 'text-life-primary',
  overdue: 'text-life-danger',
  missed: 'text-life-danger',
  done: 'text-life-muted',
};

const STATUS_LABEL: Partial<
  Record<TaskTimeStatus, { text: string; color: TextColor }>
> = {
  'awaiting-start': { text: 'Time to start', color: 'text-life-accent' },
  'in-progress': { text: 'NOW', color: 'text-life-primary' },
  overdue: { text: 'Overdue', color: 'text-life-danger' },
  missed: { text: 'Missed', color: 'text-life-danger' },
};

// The checkbox is drawn 24pt wide; this grows its touch target to 44×44pt.
const CHECKBOX_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const TaskListItem = ({
  task,
  now,
  onToggleComplete,
  onPress,
}: TaskListItemProps) => {
  const info = getTaskTimeInfo(task, now);
  const isRunning = info.status === 'in-progress';
  const label = STATUS_LABEL[info.status];
  const rowClassName = `overflow-hidden rounded-life-lg border bg-life-surface ${
    isRunning ? 'border-life-primary/40' : 'border-life-border'
  } ${task.is_completed ? 'opacity-50' : ''}`;

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
      <View className="flex-1">
        <LifeText
          variant="body"
          className={`font-medium ${task.is_completed ? 'line-through' : ''}`}
        >
          {task.title}
        </LifeText>
        <View className="flex-row flex-wrap items-center gap-life-2">
          <LifeText
            variant="caption"
            color={TIME_COLOR[info.status]}
            className="font-semibold"
          >
            {formatTimeRange(info.start, info.end)}
          </LifeText>
          {task.attachment_path ? (
            <LifeIcon name="paperclip" size={12} color="#9494A1" />
          ) : null}
          {label ? (
            <LifeText
              variant="caption"
              color={label.color}
              className="font-semibold"
            >
              · {label.text}
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

  const body = (
    <>
      <View className="flex-row items-center justify-between gap-life-3 p-life-4">
        {content}
        {badges}
      </View>
      {isRunning ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-[3px] bg-life-border"
        >
          <View
            className="h-full bg-life-primary"
            style={{ width: `${Math.round(info.progress * 100)}%` }}
          />
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onPress(task)}
        className={rowClassName}
      >
        {body}
      </TouchableOpacity>
    );
  }

  return <View className={rowClassName}>{body}</View>;
};

export default TaskListItem;
