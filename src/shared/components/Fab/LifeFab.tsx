import { useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';

type LifeFabProps = {
  accessibilityLabel: string;
  onPress: () => void;
  // Defaults to a plus icon.
  icon?: ReactNode;
  // For a button that opens a menu: tells screen readers whether it is open.
  expanded?: boolean;
};

const PRESSED_SCALE = 0.86;

// 20pt from the bottom and right edges (life-5).
const styles = StyleSheet.create({
  position: { position: 'absolute', bottom: 20, right: 20 },
});

// Floating "add" button pinned to the bottom-right of the nearest positioned
// parent (a screen's root view). Screens must leave enough bottom padding in
// their scrollable content so the last row can scroll clear of it.
// It shrinks while pressed and springs back with a small bounce; the default
// plus turns a quarter while it is held.
const LifeFab = ({
  accessibilityLabel,
  onPress,
  icon,
  expanded,
}: LifeFabProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      friction: 4,
      tension: 220,
      useNativeDriver: true,
    }).start();

  const rotate = scale.interpolate({
    inputRange: [PRESSED_SCALE, 1],
    outputRange: ['90deg', '0deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.position, { transform: [{ scale }] }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={expanded === undefined ? undefined : { expanded }}
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={() => animateTo(PRESSED_SCALE)}
        onPressOut={() => animateTo(1)}
        className="h-14 w-14 items-center justify-center rounded-full bg-life-primary"
      >
        {icon ?? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <LifeIcon name="plus" size={28} strokeWidth={2.5} />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default LifeFab;
