import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LifeText from '../Typography/LifeText.tsx';
import LifeFab from './LifeFab.tsx';
import LifeIcon, {
  type LifeIconName,
} from '../../../assets/icons/LifeIcon.tsx';

export type LifeSpeedDialAction = {
  label: string;
  icon: LifeIconName;
  onPress: () => void;
};

type LifeSpeedDialProps = {
  accessibilityLabel: string;
  // Listed top to bottom; the last one sits closest to the button.
  actions: LifeSpeedDialAction[];
};

const OPEN_MS = 240;
// Each action starts a little after the one below it, so they rise in turn.
const STAGGER = 0.12;
const ACTION_SPAN = 0.6;
const RISE_PX = 24;

// The FAB is 56pt tall and sits 20pt above the bottom edge (see LifeFab); the
// actions start 12pt above it.
const ACTIONS_BOTTOM = 88;
const SCREEN_EDGE = 20;

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  actions: { position: 'absolute', right: SCREEN_EDGE, bottom: ACTIONS_BOTTOM },
});

// A floating "+" that, when tapped, lets a few choices rise above it. Used
// instead of a modal, so the screen stays visible behind the choices.
const LifeSpeedDial = ({ accessibilityLabel, actions }: LifeSpeedDialProps) => {
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: OPEN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [open, progress]);

  // Tabs stay mounted, so switching away with the menu open would bring it back
  // open. Close it when the screen loses focus.
  useFocusEffect(
    useCallback(() => {
      return () => setOpen(false);
    }, []),
  );

  const handleActionPress = (action: LifeSpeedDialAction) => {
    setOpen(false);
    action.onPress();
  };

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.backdrop, { opacity: progress }]}
      >
        <Pressable
          accessibilityLabel="Close menu"
          onPress={() => setOpen(false)}
          className="flex-1 bg-life-bg/70"
        />
      </Animated.View>

      <View
        pointerEvents={open ? 'box-none' : 'none'}
        style={styles.actions}
        className="items-end gap-life-3 pr-life-1"
      >
        {actions.map((action, index) => {
          // The action nearest the button rises first.
          const order = actions.length - 1 - index;
          const start = Math.min(order * STAGGER, 1 - ACTION_SPAN);
          const range = [start, start + ACTION_SPAN];
          const opacity = progress.interpolate({
            inputRange: range,
            outputRange: [0, 1],
            extrapolate: 'clamp',
          });
          const translateY = progress.interpolate({
            inputRange: range,
            outputRange: [RISE_PX, 0],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={action.label}
              style={{ opacity, transform: [{ translateY }] }}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => handleActionPress(action)}
                className="flex-row items-center gap-life-3"
              >
                <View className="rounded-full border border-life-border bg-life-surface px-life-4 py-life-2">
                  <LifeText variant="bodySm" className="font-semibold">
                    {action.label}
                  </LifeText>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-life-primary">
                  <LifeIcon name={action.icon} size={22} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <LifeFab
        accessibilityLabel={accessibilityLabel}
        expanded={open}
        onPress={() => setOpen(previous => !previous)}
        icon={
          <Animated.View style={{ transform: [{ rotate }] }}>
            <LifeIcon name="plus" size={28} strokeWidth={2.5} />
          </Animated.View>
        }
      />
    </>
  );
};

export default LifeSpeedDial;
