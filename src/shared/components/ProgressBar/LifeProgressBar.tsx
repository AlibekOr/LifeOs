import { View } from 'react-native';

type LifeProgressBarProps = {
  // 0 to 100
  percent: number;
};

const LifeProgressBar = ({ percent }: LifeProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      className="h-2 overflow-hidden rounded-full bg-life-border"
    >
      <View
        className="h-full rounded-full bg-life-accent"
        style={{ width: `${clamped}%` }}
      />
    </View>
  );
};

export default LifeProgressBar;
