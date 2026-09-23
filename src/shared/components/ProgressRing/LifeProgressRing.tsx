import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type LifeProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  // At 0% the arc has no length; draw a small dot at the start so the ring
  // reads as "ready" rather than broken.
  showEmptyDot?: boolean;
  children?: React.ReactNode;
};

const LifeProgressRing = ({
  progress,
  size = 72,
  strokeWidth = 6,
  color = '#6366F1',
  trackColor = '#2C2C35',
  showEmptyDot = false,
  children,
}: LifeProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference * (1 - clamped / 100);

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
        {showEmptyDot && clamped === 0 ? (
          <Circle
            cx={size / 2}
            cy={strokeWidth / 2}
            r={strokeWidth / 2}
            fill={color}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
};

export default LifeProgressRing;
