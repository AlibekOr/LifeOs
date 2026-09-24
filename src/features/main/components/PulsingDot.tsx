import { useEffect, useRef } from 'react';
import { Animated, AppState, Easing, View } from 'react-native';

type PulsingDotProps = {
  // Full class name so NativeWind can see it at build time, e.g. "bg-life-primary".
  colorClassName?: string;
};

const PULSE_MS = 900;
const DIM_OPACITY = 0.3;

const PulsingDot = ({
  colorClassName = 'bg-life-primary',
}: PulsingDotProps) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: DIM_OPACITY,
          duration: PULSE_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: PULSE_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const run = () => {
      pulse.reset();
      pulse.start();
    };
    const halt = () => {
      pulse.stop();
      opacity.setValue(1);
    };

    if (AppState.currentState === 'active') {
      run();
    }
    // No animation work while the app is in the background.
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        run();
      } else {
        halt();
      }
    });
    return () => {
      subscription.remove();
      pulse.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ opacity }}
    >
      <View className={`h-2 w-2 rounded-full ${colorClassName}`} />
    </Animated.View>
  );
};

export default PulsingDot;
