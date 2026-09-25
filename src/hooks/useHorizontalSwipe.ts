import { useMemo, useRef } from 'react';
import { PanResponder, type GestureResponderHandlers } from 'react-native';

export type SwipeDirection = 'left' | 'right';

// The finger must first move this far, mostly sideways, before the swipe takes
// over from children (rows, scroll views).
const CLAIM_DISTANCE = 14;
// How much more sideways than up/down a drag must be. Keeps vertical scrolling
// and diagonal drags from switching anything.
const HORIZONTAL_DOMINANCE = 1.6;
// A swipe is either long enough or quick enough.
const MIN_DISTANCE = 56;
const MIN_VELOCITY = 0.35;

export function isHorizontalDrag(dx: number, dy: number): boolean {
  return (
    Math.abs(dx) > CLAIM_DISTANCE &&
    Math.abs(dx) > Math.abs(dy) * HORIZONTAL_DOMINANCE
  );
}

// `left` = the finger moved left. Null when the gesture was not a clear swipe.
export function resolveSwipe(
  dx: number,
  dy: number,
  vx: number,
): SwipeDirection | null {
  if (!isHorizontalDrag(dx, dy)) {
    return null;
  }
  const isLong = Math.abs(dx) >= MIN_DISTANCE;
  const isQuick = Math.abs(vx) >= MIN_VELOCITY;
  if (!isLong && !isQuick) {
    return null;
  }
  return dx < 0 ? 'left' : 'right';
}

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

// Spread the result on a View to react to sideways swipes over it. Built on
// PanResponder, so it needs no extra library.
export function useHorizontalSwipe(
  handlers: SwipeHandlers,
): GestureResponderHandlers {
  // The responder is created once; this keeps it calling the latest callbacks.
  const latest = useRef(handlers);
  latest.current = handlers;

  return useMemo(
    () =>
      PanResponder.create({
        // Capture, so a swipe that starts on a row still reaches us; only
        // clearly horizontal drags qualify, so taps and scrolling are untouched.
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          isHorizontalDrag(gesture.dx, gesture.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_event, gesture) => {
          const direction = resolveSwipe(gesture.dx, gesture.dy, gesture.vx);
          if (direction === 'left') {
            latest.current.onSwipeLeft?.();
          } else if (direction === 'right') {
            latest.current.onSwipeRight?.();
          }
        },
      }).panHandlers,
    [],
  );
}
