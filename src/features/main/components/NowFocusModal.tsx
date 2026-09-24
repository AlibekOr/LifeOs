import type { ReactNode } from 'react';
import {
  Modal,
  StatusBar,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeProgressRing from '../../../shared/components/ProgressRing/LifeProgressRing.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import { formatTimeRange } from '../../tasks/utils/taskFormatting.ts';
import type { NowCardAction } from '../hooks/useNowCardActions.ts';
import type { Celebration } from '../utils/celebrationMessages.ts';
import type { NowCardView } from '../utils/nowCardView.ts';
import { CurrentActions, StartAction } from './NowCardActions.tsx';
import CountdownBlock from './CountdownBlock.tsx';
import GiftCelebration from './GiftCelebration.tsx';
import PulsingDot from './PulsingDot.tsx';

export type FocusView = Extract<
  NowCardView<DisplayTask>,
  { kind: 'current' | 'next' }
>;

type NowFocusModalProps = {
  // null keeps the timer closed; the modal still stays open for a celebration.
  view: FocusView | null;
  // Set right after a task was completed from this screen.
  celebration: Celebration | null;
  pendingAction: NowCardAction | null;
  onClose: () => void;
  onCelebrationDone: () => void;
  onStart: (task: DisplayTask) => void;
  onComplete: (task: DisplayTask) => void;
  onExtend: (task: DisplayTask) => void;
  onFinished: () => void;
};

const CLOSE_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };
const RING_MAX_SIZE = 280;
// Horizontal space kept free around the ring on narrow screens.
const RING_MARGIN = 64;
const RING_STROKE_WIDTH = 12;
// The soft glow reaches this far beyond the ring.
const GLOW_EXTRA = 32;
const WARNING = '#F59E0B';

type RingFrameProps = {
  size: number;
  isWarning: boolean;
  children: ReactNode;
};

const RingFrame = ({ size, isWarning, children }: RingFrameProps) => (
  <View
    className="items-center justify-center"
    style={{ width: size + GLOW_EXTRA, height: size + GLOW_EXTRA }}
  >
    <View
      className={`absolute h-full w-full rounded-full ${
        isWarning ? 'bg-life-warning/10' : 'bg-life-primary/10'
      }`}
    />
    {children}
  </View>
);

type StaticRingProps = {
  size: number;
  progress: number;
  color?: string;
  title: string;
  titleColor: 'text-life-warning' | 'text-life-accent';
  caption: string;
};

// For states without a live countdown (time is up, or time to start).
const StaticRing = ({
  size,
  progress,
  color,
  title,
  titleColor,
  caption,
}: StaticRingProps) => (
  <LifeProgressRing
    progress={progress}
    size={size}
    strokeWidth={RING_STROKE_WIDTH}
    color={color}
    showEmptyDot
  >
    <View className="items-center gap-life-1 px-life-6">
      <LifeText
        variant="h2"
        color={titleColor}
        className="text-center font-bold"
      >
        {title}
      </LifeText>
      <LifeText
        variant="caption"
        color="text-life-muted"
        className="text-center"
      >
        {caption}
      </LifeText>
    </View>
  </LifeProgressRing>
);

type FocusContentProps = Omit<
  NowFocusModalProps,
  'view' | 'celebration' | 'onCelebrationDone'
> & {
  view: FocusView;
};

const FocusContent = ({
  view,
  pendingAction,
  onClose,
  onStart,
  onComplete,
  onExtend,
  onFinished,
}: FocusContentProps) => {
  const { width } = useWindowDimensions();
  const ringSize = Math.min(RING_MAX_SIZE, width - RING_MARGIN);
  const { task, info } = view;
  const isCurrent = view.kind === 'current';
  const isTimeUp = isCurrent && info.status === 'overdue';
  const isDue = !isCurrent && info.status === 'awaiting-start';

  const renderRing = () => {
    if (isTimeUp) {
      return (
        <StaticRing
          size={ringSize}
          progress={100}
          color={WARNING}
          title="Time's up"
          titleColor="text-life-warning"
          caption="Complete it or add more time"
        />
      );
    }
    if (isDue) {
      return (
        <StaticRing
          size={ringSize}
          progress={0}
          title="Time to start"
          titleColor="text-life-accent"
          caption="Press Start when you are ready"
        />
      );
    }
    return (
      <CountdownBlock
        variant="ring"
        size={ringSize}
        target={isCurrent ? info.end : info.start}
        progressFrom={isCurrent ? info.start : undefined}
        caption={isCurrent ? 'remaining' : 'until start'}
        onFinished={onFinished}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg">
      <View className="flex-row items-center justify-between px-life-5 pt-life-3">
        <View className="flex-row items-center gap-life-2">
          {isCurrent ? (
            isTimeUp ? (
              <View className="h-2 w-2 rounded-full bg-life-warning" />
            ) : (
              <PulsingDot />
            )
          ) : null}
          <LifeText
            variant="caption"
            color={
              isTimeUp
                ? 'text-life-warning'
                : isCurrent
                ? 'text-life-primary'
                : 'text-life-accent'
            }
            className="font-bold"
          >
            {isCurrent ? 'NOW' : 'UP NEXT'}
          </LifeText>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close full screen timer"
          hitSlop={CLOSE_HIT_SLOP}
          onPress={onClose}
          className="h-10 w-10 items-center justify-center rounded-full border border-life-border bg-life-surface"
        >
          <LifeIcon name="x" size={20} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center gap-life-8 px-life-5">
        <View className="items-center gap-life-2">
          <LifeText
            variant="h2"
            numberOfLines={3}
            className="text-center font-bold"
          >
            {task.title}
          </LifeText>
          <LifeText variant="bodySm" color="text-life-muted">
            {formatTimeRange(info.start, info.end)}
          </LifeText>
        </View>
        <RingFrame size={ringSize} isWarning={isTimeUp}>
          {renderRing()}
        </RingFrame>
      </View>

      <View className="gap-life-3 px-life-5 pb-life-5">
        {isCurrent ? (
          <>
            {view.otherInProgressCount > 0 ? (
              <LifeText
                variant="caption"
                color="text-life-muted"
                className="text-center"
              >
                +{view.otherInProgressCount} more{' '}
                {view.otherInProgressCount === 1 ? 'task' : 'tasks'} in progress
              </LifeText>
            ) : null}
            <CurrentActions
              task={task}
              pendingAction={pendingAction}
              onComplete={onComplete}
              onExtend={onExtend}
            />
          </>
        ) : (
          <StartAction
            task={task}
            isDue={isDue}
            pendingAction={pendingAction}
            onStart={onStart}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const NowFocusModal = ({
  view,
  celebration,
  onCelebrationDone,
  ...actions
}: NowFocusModalProps) => (
  <Modal
    visible={view !== null || celebration !== null}
    animationType="slide"
    presentationStyle="fullScreen"
    // Lets the screen extend under the (hidden) status bar on Android.
    statusBarTranslucent
    onRequestClose={celebration ? onCelebrationDone : actions.onClose}
  >
    {/* Full focus: no clock, battery or network icons while this is open. The
        previous status bar comes back when the modal unmounts. */}
    <StatusBar hidden />
    {celebration ? (
      <GiftCelebration celebration={celebration} onDone={onCelebrationDone} />
    ) : view ? (
      <FocusContent view={view} {...actions} />
    ) : null}
  </Modal>
);

export default NowFocusModal;
