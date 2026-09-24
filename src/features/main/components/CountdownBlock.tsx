import { useEffect } from 'react';
import { View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeProgressRing from '../../../shared/components/ProgressRing/LifeProgressRing.tsx';
import { useCountdown } from '../../../hooks/useCountdown.ts';
import {
  formatCountdown,
  formatCountdownSpoken,
} from '../../../utils/formatCountdown.ts';

type CommonProps = {
  target: Date;
  // Called once the target is reached, so the parent can move to the next state.
  onFinished?: () => void;
};

type LargeProps = CommonProps & {
  variant: 'large';
  caption: string;
  // The progress bar is only drawn when the start of the span is known.
  progressFrom?: Date;
};

type InlineProps = CommonProps & {
  variant: 'inline';
  prefix: string;
};

// The time inside a progress ring, for the full screen timer.
type RingProps = CommonProps & {
  variant: 'ring';
  caption: string;
  size: number;
  // Without a start the ring stays empty, e.g. while counting down to a start.
  progressFrom?: Date;
};

type CountdownBlockProps = LargeProps | InlineProps | RingProps;

const RING_STROKE_WIDTH = 12;

// 0 when the start of the span is unknown, otherwise how much of it has passed.
function getProgress(
  target: Date,
  from: Date | undefined,
  remainingMs: number,
): number {
  if (!from) {
    return 0;
  }
  const totalMs = target.getTime() - from.getTime();
  return totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 1;
}

// Owns the once-per-second ticking, so only this block re-renders every second
// and not the card or the screen around it.
const CountdownBlock = (props: CountdownBlockProps) => {
  const { target, onFinished } = props;
  const { remainingMs, isFinished } = useCountdown(target);

  useEffect(() => {
    if (isFinished) {
      onFinished?.();
    }
  }, [isFinished, onFinished]);

  const time = formatCountdown(remainingMs);
  // Whole minutes only, so a screen reader is not updated every second.
  const spoken = formatCountdownSpoken(remainingMs);

  if (props.variant === 'inline') {
    return (
      <LifeText
        variant="bodySm"
        color="text-life-muted"
        accessibilityRole="timer"
        accessibilityLabel={`${props.prefix} ${spoken}`}
      >
        {props.prefix}{' '}
        <LifeText variant="bodySm" className="font-semibold tabular-nums">
          {time}
        </LifeText>
      </LifeText>
    );
  }

  const progress = getProgress(target, props.progressFrom, remainingMs);

  if (props.variant === 'ring') {
    return (
      <LifeProgressRing
        progress={progress * 100}
        size={props.size}
        strokeWidth={RING_STROKE_WIDTH}
        showEmptyDot
      >
        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`${spoken} ${props.caption}`}
          className="items-center gap-life-1"
        >
          <LifeText variant="display" className="font-bold tabular-nums">
            {time}
          </LifeText>
          <LifeText variant="caption" color="text-life-muted">
            {props.caption}
          </LifeText>
        </View>
      </LifeProgressRing>
    );
  }

  return (
    <View className="gap-life-2">
      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={`${spoken} remaining`}
        className="gap-life-1"
      >
        <LifeText variant="display" className="font-bold tabular-nums">
          {time}
        </LifeText>
        <LifeText variant="caption" color="text-life-muted">
          {props.caption}
        </LifeText>
      </View>
      {props.progressFrom ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-1 overflow-hidden rounded-full bg-life-border"
        >
          <View
            className="h-full rounded-full bg-life-primary"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      ) : null}
    </View>
  );
};

export default CountdownBlock;
