import { useLayoutEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const SLIDE_MS = 240;
const SLIDE_DISTANCE = 36;

// Style for a view whose content depends on `index` (which tab, which month).
// When the index changes, the view slides in from the side it moved towards: a
// higher index enters from the right, a lower one from the left.
export function useSlideTransition(index: number) {
  const progress = useRef(new Animated.Value(1)).current;
  const shownIndex = useRef(index);
  const direction = useRef(1);

  // Worked out while rendering, so the interpolation below is right on the very
  // frame the change is drawn and stays fixed until the next change.
  if (index !== shownIndex.current) {
    direction.current = index > shownIndex.current ? 1 : -1;
  }

  // Before the frame is painted, so new content never flashes at full opacity
  // before the animation starts.
  useLayoutEffect(() => {
    if (shownIndex.current === index) {
      return;
    }
    shownIndex.current = index;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [direction.current * SLIDE_DISTANCE, 0],
  });

  return { opacity: progress, transform: [{ translateX }] };
}
