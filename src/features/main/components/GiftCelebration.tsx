import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import { notificationService } from '../../../services/notification.service.ts';
import type { Celebration } from '../utils/celebrationMessages.ts';

type GiftCelebrationProps = {
  celebration: Celebration;
  onDone: () => void;
};

// Design system colours only: primary, accent, success, warning and text.
const CONFETTI_COLORS = ['#6366F1', '#818CF8', '#22C55E', '#F59E0B', '#FFFFFF'];
const CONFETTI_COUNT = 28;
const GIFT_SIZE = 140;
const GLOW_SIZE = 280;
const WORD_WIDTH = 120;
const BOX = '#6366F1';
const LID = '#818CF8';
const RIBBON = '#F59E0B';

// Absolute layout on Animated views cannot be expressed as NativeWind classes,
// so the static parts live here.
const styles = StyleSheet.create({
  gift: { width: GIFT_SIZE, height: GIFT_SIZE },
  layer: { position: 'absolute', top: 0, left: 0 },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  piece: { position: 'absolute' },
  // Fixed width so a word can be centred on its spot whatever its length.
  word: { position: 'absolute', width: WORD_WIDTH, alignItems: 'center' },
});

// Where the praise words pop up, relative to the centre of the gift.
const WORD_SPOTS = [
  { x: -105, y: -70 },
  { x: 105, y: -90 },
  { x: 0, y: -160 },
];

type Piece = {
  color: string;
  size: number;
  dx: number;
  dyPeak: number;
  dyEnd: number;
  height: number;
  radius: number;
  rotate: number;
};

function createPieces(): Piece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, index) => {
    // Fans upwards with some spread to the sides, then falls back down.
    const angle = (-160 + Math.random() * 140) * (Math.PI / 180);
    const distance = 110 + Math.random() * 150;
    const dyPeak = Math.sin(angle) * distance;
    const size = 6 + Math.random() * 5;
    // Every third piece is a dot, the rest are small strips.
    const round = index % 3 === 0;
    return {
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      size,
      dx: Math.cos(angle) * distance,
      dyPeak,
      dyEnd: dyPeak + 120 + Math.random() * 120,
      height: round ? size : size * 0.5,
      radius: round ? size / 2 : 1,
      rotate: 180 + Math.random() * 540,
    };
  });
}

const wobbleStep = (value: Animated.Value, toValue: number) =>
  Animated.timing(value, { toValue, duration: 90, useNativeDriver: true });

const GiftCelebration = ({ celebration, onDone }: GiftCelebrationProps) => {
  const pieces = useMemo(createPieces, []);
  const appear = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const open = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // The gift appears and shakes, then the lid flies off.
    const intro = Animated.sequence([
      Animated.spring(appear, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.sequence([
        wobbleStep(wobble, 1),
        wobbleStep(wobble, -1),
        wobbleStep(wobble, 1),
        wobbleStep(wobble, 0),
      ]),
    ]);
    const opening = Animated.parallel([
      Animated.timing(open, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
      Animated.timing(burst, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(reveal, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]);

    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (cancelled) {
        return;
      }
      if (reduceMotion) {
        // Straight to the finished state, without any movement.
        [appear, open, burst, reveal].forEach(value => value.setValue(1));
        notificationService.playCelebrationSound();
        setCanContinue(true);
        return;
      }
      intro.start(({ finished: introFinished }) => {
        if (!introFinished || cancelled) {
          return;
        }
        // The "congratulations" sound goes with the lid flying off.
        notificationService.playCelebrationSound();
        opening.start(({ finished }) => {
          if (finished && !cancelled) {
            setCanContinue(true);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      intro.stop();
      opening.stop();
    };
  }, [appear, wobble, open, burst, reveal]);

  const giftScale = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  const giftOpacity = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const giftRotate = wobble.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });
  const lidY = open.interpolate({ inputRange: [0, 1], outputRange: [0, -56] });
  const lidRotate = open.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-24deg'],
  });
  const lidOpacity = open.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });
  const glowScale = burst.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1.4],
  });
  const glowOpacity = burst.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 0.5, 0],
  });
  const textY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <SafeAreaView className="flex-1 bg-life-bg">
      <View className="flex-1 items-center justify-center gap-life-8 px-life-5">
        <View className="items-center justify-center" style={styles.gift}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              { opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          >
            <View className="h-full w-full rounded-full bg-life-accent" />
          </Animated.View>

          {pieces.map((piece, index) => (
            <Animated.View
              key={index}
              pointerEvents="none"
              style={[
                styles.piece,
                {
                  width: piece.size,
                  height: piece.height,
                  left: GIFT_SIZE / 2 - piece.size / 2,
                  top: GIFT_SIZE / 2,
                  borderRadius: piece.radius,
                  backgroundColor: piece.color,
                  opacity: burst.interpolate({
                    inputRange: [0, 0.08, 0.8, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateX: burst.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, piece.dx],
                      }),
                    },
                    {
                      translateY: burst.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, piece.dyPeak, piece.dyEnd],
                      }),
                    },
                    {
                      rotate: burst.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${piece.rotate}deg`],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}

          {celebration.words.map((word, index) => {
            const spot = WORD_SPOTS[index % WORD_SPOTS.length];
            // Each word pops in a little after the previous one.
            const popAt = 0.1 + index * 0.14;
            return (
              <Animated.View
                key={word}
                pointerEvents="none"
                style={[
                  styles.word,
                  {
                    left: GIFT_SIZE / 2 + spot.x - WORD_WIDTH / 2,
                    top: GIFT_SIZE / 2 + spot.y,
                    opacity: burst.interpolate({
                      inputRange: [0, popAt, popAt + 0.1, 0.85, 1],
                      outputRange: [0, 0, 1, 1, 0],
                    }),
                    transform: [
                      {
                        scale: burst.interpolate({
                          inputRange: [0, popAt, popAt + 0.12, 1],
                          outputRange: [0.3, 0.3, 1, 1.1],
                        }),
                      },
                      {
                        translateY: burst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -20],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View className="rounded-full border border-life-primary/40 bg-life-surface px-life-3 py-life-1">
                  <LifeText
                    variant="bodySm"
                    color="text-life-accent"
                    className="font-bold"
                  >
                    {word}
                  </LifeText>
                </View>
              </Animated.View>
            );
          })}

          <Animated.View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.gift,
              {
                opacity: giftOpacity,
                transform: [{ scale: giftScale }, { rotate: giftRotate }],
              },
            ]}
          >
            <Svg
              width={GIFT_SIZE}
              height={GIFT_SIZE}
              viewBox="0 0 120 120"
              style={styles.layer}
            >
              <Rect x={16} y={52} width={88} height={60} rx={8} fill={BOX} />
              <Rect x={54} y={52} width={12} height={60} fill={RIBBON} />
            </Svg>
            <Animated.View
              style={[
                styles.layer,
                styles.gift,
                {
                  opacity: lidOpacity,
                  transform: [{ translateY: lidY }, { rotate: lidRotate }],
                },
              ]}
            >
              <Svg width={GIFT_SIZE} height={GIFT_SIZE} viewBox="0 0 120 120">
                <Rect x={10} y={34} width={100} height={22} rx={6} fill={LID} />
                <Rect x={54} y={34} width={12} height={22} fill={RIBBON} />
                <Path
                  d="M60 34C48 12 28 18 38 32C44 36 54 36 60 34Z"
                  fill={RIBBON}
                />
                <Path
                  d="M60 34C72 12 92 18 82 32C76 36 66 36 60 34Z"
                  fill={RIBBON}
                />
                <Circle cx={60} cy={34} r={6} fill={RIBBON} />
              </Svg>
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View
          accessibilityLiveRegion="polite"
          style={{ opacity: reveal, transform: [{ translateY: textY }] }}
          className="items-center gap-life-2"
        >
          <LifeText variant="h1" className="text-center font-bold">
            {celebration.headline}
          </LifeText>
          <LifeText
            variant="body"
            color="text-life-muted"
            className="text-center"
          >
            {celebration.message}
          </LifeText>
        </Animated.View>
      </View>

      <View className="px-life-5 pb-life-5">
        {canContinue ? (
          <LifeButton fullWidth title="Continue" onPress={onDone} />
        ) : (
          <View className="h-[52px]" />
        )}
      </View>
    </SafeAreaView>
  );
};

export default GiftCelebration;
