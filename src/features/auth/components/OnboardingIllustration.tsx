import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

// LifeOS tokens as hex: SVG paint props cannot take Tailwind classes.
const PRIMARY = '#6366F1';
const ACCENT = '#818CF8';
const TEXT = '#FFFFFF';
const MUTED = '#9494A1';

const WIDTH = 340;
const HEIGHT = 260;

export type OnboardingIllustrationVariant = 0 | 1 | 2;

type OnboardingIllustrationProps = {
  variant: OnboardingIllustrationVariant;
};

// Smooth-looking wave built from short segments.
function wavePath(
  baseY: number,
  amplitude: number,
  wavelength: number,
  phase: number,
): string {
  const points: string[] = [];
  for (let x = -10; x <= WIDTH + 10; x += 8) {
    const y =
      baseY +
      amplitude * Math.sin((x / wavelength) * 2 * Math.PI + phase) +
      amplitude *
        0.45 *
        Math.sin((x / (wavelength * 0.47)) * 2 * Math.PI - phase);
    points.push(`${points.length === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

type GlowProps = { id: string; cx: number; cy: number; r: number };

const Glow = ({ id, cx, cy, r }: GlowProps) => (
  <>
    <Defs>
      <RadialGradient id={id} cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor={PRIMARY} stopOpacity={0.38} />
        <Stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
  </>
);

// "Your life, organized": glass frame and orbit around a cluster of spheres.
const OrganizedArt = () => {
  const spheres: { cx: number; cy: number; r: number }[] = [
    { cx: 170, cy: 118, r: 28 },
    { cx: 136, cy: 92, r: 13 },
    { cx: 208, cy: 86, r: 11 },
    { cx: 132, cy: 146, r: 15 },
    { cx: 205, cy: 154, r: 10 },
    { cx: 176, cy: 66, r: 6 },
    { cx: 236, cy: 122, r: 8 },
    { cx: 104, cy: 116, r: 6 },
  ];
  return (
    <>
      <Glow id="org-glow" cx={170} cy={120} r={140} />
      <Defs>
        <LinearGradient id="org-frame" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.9} />
          <Stop offset="100%" stopColor={PRIMARY} stopOpacity={0.15} />
        </LinearGradient>
        <RadialGradient id="org-sphere" cx="35%" cy="30%" r="75%">
          <Stop offset="0%" stopColor={TEXT} stopOpacity={0.95} />
          <Stop offset="35%" stopColor={ACCENT} stopOpacity={0.95} />
          <Stop offset="100%" stopColor={PRIMARY} stopOpacity={0.85} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={170} cy={214} rx={78} ry={9} fill={PRIMARY} opacity={0.18} />
      <Rect
        x={108}
        y={52}
        width={124}
        height={124}
        rx={30}
        fill="none"
        stroke="url(#org-frame)"
        strokeWidth={2.5}
        transform="rotate(45 170 114)"
      />
      <Rect
        x={124}
        y={68}
        width={92}
        height={92}
        rx={24}
        fill={PRIMARY}
        opacity={0.06}
        stroke={ACCENT}
        strokeOpacity={0.35}
        strokeWidth={1}
        transform="rotate(45 170 114)"
      />
      <Ellipse
        cx={170}
        cy={118}
        rx={104}
        ry={34}
        fill="none"
        stroke={TEXT}
        strokeOpacity={0.55}
        strokeWidth={3}
        transform="rotate(-24 170 118)"
      />
      {spheres.map(sphere => (
        <Circle
          key={`${sphere.cx}-${sphere.cy}`}
          cx={sphere.cx}
          cy={sphere.cy}
          r={sphere.r}
          fill="url(#org-sphere)"
        />
      ))}
    </>
  );
};

// "AI plans your day": flowing light strands across the card.
const StrandsArt = () => {
  const strands = [
    { y: 130, a: 26, w: 190, p: 0, o: 0.95, s: 2.4 },
    { y: 132, a: 22, w: 170, p: 0.7, o: 0.8, s: 1.8 },
    { y: 128, a: 32, w: 220, p: 1.4, o: 0.65, s: 1.4 },
    { y: 136, a: 18, w: 150, p: 2.1, o: 0.55, s: 1.2 },
    { y: 124, a: 36, w: 250, p: 2.8, o: 0.45, s: 1.2 },
    { y: 140, a: 24, w: 200, p: 3.5, o: 0.4, s: 1 },
    { y: 120, a: 28, w: 180, p: 4.2, o: 0.35, s: 1 },
  ];
  const stars: [number, number, number][] = [
    [34, 60, 1.6],
    [82, 200, 1.2],
    [120, 44, 1],
    [168, 214, 1.6],
    [214, 52, 1.2],
    [262, 196, 1.6],
    [300, 74, 1],
    [316, 150, 1.2],
    [56, 156, 1],
    [244, 96, 1],
  ];
  return (
    <>
      <Glow id="str-glow" cx={170} cy={130} r={150} />
      <Defs>
        <LinearGradient id="str-line" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={PRIMARY} stopOpacity={0} />
          <Stop offset="30%" stopColor={ACCENT} stopOpacity={1} />
          <Stop offset="70%" stopColor={TEXT} stopOpacity={0.9} />
          <Stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {stars.map(([cx, cy, r]) => (
        <Circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={r}
          fill={TEXT}
          opacity={0.6}
        />
      ))}
      {strands.map(strand => (
        <Path
          key={strand.p}
          d={wavePath(strand.y, strand.a, strand.w, strand.p)}
          fill="none"
          stroke="url(#str-line)"
          strokeWidth={strand.s}
          strokeLinecap="round"
          opacity={strand.o}
        />
      ))}
    </>
  );
};

// "Understand your progress": a tilted analytics panel with a rising curve.
const AnalyticsArt = () => {
  const curve =
    'M64 168 C88 150 100 176 124 150 S158 108 182 132 S214 96 240 104 S262 84 274 74';
  const markers: [number, number][] = [
    [124, 150],
    [182, 132],
    [240, 104],
  ];
  return (
    <>
      <Glow id="ana-glow" cx={170} cy={130} r={150} />
      <Defs>
        <LinearGradient id="ana-panel" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={PRIMARY} stopOpacity={0.05} />
        </LinearGradient>
        <LinearGradient id="ana-area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="ana-line" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={PRIMARY} />
          <Stop offset="100%" stopColor={TEXT} />
        </LinearGradient>
      </Defs>
      <G transform="rotate(-5 170 130)">
        <Rect
          x={44}
          y={44}
          width={252}
          height={158}
          rx={18}
          fill="url(#ana-panel)"
          stroke={ACCENT}
          strokeOpacity={0.55}
          strokeWidth={1.5}
        />
        <SvgText x={62} y={68} fill={ACCENT} fontSize={9} letterSpacing={1.2}>
          PROGRESS ANALYTICS
        </SvgText>
        <SvgText x={62} y={190} fill={MUTED} fontSize={8} letterSpacing={1}>
          DATA FLOW
        </SvgText>
        {[100, 130, 160].map(y => (
          <Path
            key={y}
            d={`M62 ${y} H278`}
            stroke={TEXT}
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}
        <Path d={`${curve} L274 178 L64 178 Z`} fill="url(#ana-area)" />
        <Path
          d={curve}
          fill="none"
          stroke="url(#ana-line)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Circle cx={274} cy={74} r={9} fill={ACCENT} opacity={0.25} />
        <Circle cx={274} cy={74} r={4.5} fill={TEXT} />
        {markers.map(([cx, cy]) => (
          <Circle key={cx} cx={cx} cy={cy} r={3} fill={ACCENT} />
        ))}
      </G>
    </>
  );
};

const OnboardingIllustration = ({ variant }: OnboardingIllustrationProps) => (
  <Svg
    width="100%"
    height="100%"
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    preserveAspectRatio="xMidYMid slice"
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    {variant === 0 ? <OrganizedArt /> : null}
    {variant === 1 ? <StrandsArt /> : null}
    {variant === 2 ? <AnalyticsArt /> : null}
  </Svg>
);

export default OnboardingIllustration;
