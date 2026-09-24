import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import PriorityBadge from '../../../shared/components/PriorityBadge/PriorityBadge.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import type { TaskTimeInfo } from '../../tasks/utils/taskStatus.ts';
import { formatTimeRange } from '../../tasks/utils/taskFormatting.ts';
import type { NowCardAction } from '../hooks/useNowCardActions.ts';
import {
  pickCelebration,
  type Celebration,
} from '../utils/celebrationMessages.ts';
import { getNowCardView } from '../utils/nowCardView.ts';
import CountdownBlock from './CountdownBlock.tsx';
import { CurrentActions, StartAction } from './NowCardActions.tsx';
import NowFocusModal, { type FocusView } from './NowFocusModal.tsx';
import PulsingDot from './PulsingDot.tsx';

type NowCardProps = {
  tasks: readonly DisplayTask[];
  // Refreshed about once a minute by the screen; the card re-reads the clock
  // itself the moment a countdown finishes.
  now: Date;
  pendingAction: NowCardAction | null;
  onEditTask: (task: DisplayTask) => void;
  onStart: (task: DisplayTask) => void;
  // Resolves to whether the task was really completed.
  onComplete: (task: DisplayTask) => Promise<boolean>;
  onExtend: (task: DisplayTask) => void;
};

type CardProps = Omit<NowCardProps, 'tasks' | 'now'> & {
  task: DisplayTask;
  info: TaskTimeInfo;
  onExpand: () => void;
  onFinished: () => void;
};

const EDIT_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

type CardHeaderProps = {
  task: DisplayTask;
  onEditTask: (task: DisplayTask) => void;
  children: ReactNode;
};

// The pencil is the only way to edit from the card; tapping the rest of it
// opens the full screen timer.
const CardHeader = ({ task, onEditTask, children }: CardHeaderProps) => (
  <View className="flex-row items-center justify-between">
    <View className="flex-row items-center gap-life-2">{children}</View>
    <View className="flex-row items-center gap-life-3">
      {task.priority ? <PriorityBadge priority={task.priority} /> : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Edit task: ${task.title}`}
        hitSlop={EDIT_HIT_SLOP}
        onPress={() => onEditTask(task)}
      >
        <LifeIcon name="pencil" size={18} color="#9494A1" />
      </TouchableOpacity>
    </View>
  </View>
);

const CurrentCard = ({
  task,
  info,
  otherInProgressCount,
  pendingAction,
  onEditTask,
  onComplete,
  onExtend,
  onExpand,
  onFinished,
}: CardProps & { otherInProgressCount: number }) => {
  const isTimeUp = info.status === 'overdue';

  return (
    <View
      className={`gap-life-4 rounded-life-xl border bg-life-surface p-life-5 ${
        isTimeUp ? 'border-life-warning/40' : 'border-life-primary/30'
      }`}
    >
      <CardHeader task={task} onEditTask={onEditTask}>
        {isTimeUp ? (
          <View className="h-2 w-2 rounded-full bg-life-warning" />
        ) : (
          <PulsingDot />
        )}
        <LifeText
          variant="caption"
          color={isTimeUp ? 'text-life-warning' : 'text-life-primary'}
          className="font-bold"
        >
          NOW
        </LifeText>
      </CardHeader>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Open full screen timer: ${task.title}`}
        onPress={onExpand}
        className="gap-life-4"
      >
        <View className="gap-life-1">
          <LifeText variant="h2" numberOfLines={2} className="font-bold">
            {task.title}
          </LifeText>
          <LifeText variant="bodySm" color="text-life-muted">
            {formatTimeRange(info.start, info.end)}
          </LifeText>
        </View>
        {isTimeUp ? (
          <LifeText
            variant="display"
            color="text-life-warning"
            className="font-bold"
          >
            Time's up
          </LifeText>
        ) : (
          <CountdownBlock
            variant="large"
            target={info.end}
            progressFrom={info.start}
            caption="remaining"
            onFinished={onFinished}
          />
        )}
      </TouchableOpacity>

      <CurrentActions
        task={task}
        pendingAction={pendingAction}
        onComplete={onComplete}
        onExtend={onExtend}
      />

      {otherInProgressCount > 0 ? (
        <LifeText variant="caption" color="text-life-muted">
          +{otherInProgressCount} more{' '}
          {otherInProgressCount === 1 ? 'task' : 'tasks'} in progress
        </LifeText>
      ) : null}
    </View>
  );
};

const NextCard = ({
  task,
  info,
  pendingAction,
  onEditTask,
  onStart,
  onExpand,
  onFinished,
}: CardProps) => {
  // The scheduled time has come but the task was not started yet.
  const isDue = info.status === 'awaiting-start';

  return (
    <View className="gap-life-3 rounded-life-xl border border-life-border bg-life-surface p-life-4">
      <CardHeader task={task} onEditTask={onEditTask}>
        <LifeText
          variant="caption"
          color="text-life-accent"
          className="font-bold"
        >
          UP NEXT
        </LifeText>
      </CardHeader>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Open full screen timer: ${task.title}`}
        onPress={onExpand}
        className="gap-life-3"
      >
        <View className="gap-life-1">
          <LifeText variant="h3" numberOfLines={2} className="font-bold">
            {task.title}
          </LifeText>
          <LifeText variant="bodySm" color="text-life-muted">
            {formatTimeRange(info.start, info.end)}
          </LifeText>
        </View>
        {isDue ? (
          <LifeText
            variant="bodySm"
            color="text-life-accent"
            className="font-semibold"
          >
            Time to start
          </LifeText>
        ) : (
          <CountdownBlock
            variant="inline"
            prefix="starts in"
            target={info.start}
            onFinished={onFinished}
          />
        )}
      </TouchableOpacity>

      <StartAction
        task={task}
        isDue={isDue}
        pendingAction={pendingAction}
        onStart={onStart}
      />
    </View>
  );
};

const AllDoneCard = () => (
  <View className="flex-row items-center gap-life-3 rounded-life-xl border border-life-border bg-life-surface p-life-4">
    <LifeIcon name="check" size={20} color="#22C55E" />
    <LifeText variant="bodySm" color="text-life-muted" className="flex-1">
      All of today's tasks are done. Nice work!
    </LifeText>
  </View>
);

const NowCard = ({
  tasks,
  now,
  pendingAction,
  onEditTask,
  onStart,
  onComplete,
  onExtend,
}: NowCardProps) => {
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const lastCelebration = useRef<Celebration | null>(null);
  const handleFinished = useCallback(() => setRefreshedAt(new Date()), []);
  const handleClose = useCallback(() => setExpandedTaskId(null), []);
  const handleCelebrationDone = useCallback(() => {
    setCelebration(null);
    setExpandedTaskId(null);
  }, []);

  // Completing a task, from the card or the full screen, ends in a celebration.
  // It is shown at once (the completion itself is optimistic) and taken back if
  // saving fails.
  const handleComplete = useCallback(
    async (task: DisplayTask) => {
      const next = pickCelebration(lastCelebration.current);
      lastCelebration.current = next;
      setCelebration(next);
      const completed = await onComplete(task);
      if (!completed) {
        setCelebration(null);
      }
      return completed;
    },
    [onComplete],
  );

  // A finished countdown re-reads the clock at once instead of waiting for the
  // next tick of `now`.
  const cardNow =
    refreshedAt && refreshedAt.getTime() > now.getTime() ? refreshedAt : now;
  const view = useMemo(() => getNowCardView(tasks, cardNow), [tasks, cardNow]);

  // The full screen view follows the task it was opened for: once that task is
  // no longer current or next (e.g. it was completed) it closes by itself.
  const focusView: FocusView | null =
    (view.kind === 'current' || view.kind === 'next') &&
    view.task.id === expandedTaskId
      ? view
      : null;

  useEffect(() => {
    if (expandedTaskId !== null && focusView === null && celebration === null) {
      setExpandedTaskId(null);
    }
  }, [expandedTaskId, focusView, celebration]);

  const cardProps = {
    pendingAction,
    onEditTask,
    onStart,
    onComplete: handleComplete,
    onExtend,
  };

  let card: ReactNode = null;
  if (view.kind === 'current') {
    card = (
      <CurrentCard
        {...cardProps}
        task={view.task}
        info={view.info}
        otherInProgressCount={view.otherInProgressCount}
        onExpand={() => setExpandedTaskId(view.task.id)}
        onFinished={handleFinished}
      />
    );
  } else if (view.kind === 'next') {
    card = (
      <NextCard
        {...cardProps}
        task={view.task}
        info={view.info}
        onExpand={() => setExpandedTaskId(view.task.id)}
        onFinished={handleFinished}
      />
    );
  } else if (view.kind === 'all-done') {
    card = <AllDoneCard />;
  }

  return (
    <>
      {card}
      <NowFocusModal
        view={focusView}
        celebration={celebration}
        pendingAction={pendingAction}
        onClose={handleClose}
        onCelebrationDone={handleCelebrationDone}
        onStart={onStart}
        onComplete={handleComplete}
        onExtend={onExtend}
        onFinished={handleFinished}
      />
    </>
  );
};

export default NowCard;
