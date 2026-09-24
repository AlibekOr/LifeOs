import Svg, { Circle, Path } from 'react-native-svg';

/*
 * Icon shapes are copied from Lucide (https://lucide.dev), lucide-static 1.47.0.
 *
 * ISC License
 * Copyright (c) 2026 Lucide Icons and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS.
 */

export type LifeIconName =
  | 'home'
  | 'list-checks'
  | 'target'
  | 'wallet'
  | 'user'
  | 'sparkles'
  | 'plus'
  | 'check'
  | 'paperclip'
  | 'bell'
  | 'circle-alert'
  | 'clock'
  | 'circle-check'
  | 'refresh-cw'
  | 'check-check'
  | 'chevron-left'
  | 'trending-up'
  | 'pencil'
  | 'x';

type IconShape =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: number; cy: number; r: number };

const path = (d: string): IconShape => ({ type: 'path', d });
const circle = (cx: number, cy: number, r: number): IconShape => ({
  type: 'circle',
  cx,
  cy,
  r,
});

const ICONS: Record<LifeIconName, IconShape[]> = {
  home: [
    path('M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'),
    path(
      'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ),
  ],
  'list-checks': [
    path('M13 5h8'),
    path('M13 12h8'),
    path('M13 19h8'),
    path('m3 17 2 2 4-4'),
    path('m3 7 2 2 4-4'),
  ],
  target: [circle(12, 12, 10), circle(12, 12, 6), circle(12, 12, 2)],
  wallet: [
    path(
      'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1',
    ),
    path('M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'),
  ],
  user: [path('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'), circle(12, 7, 4)],
  sparkles: [
    path(
      'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
    ),
    path('M20 2v4'),
    path('M22 4h-4'),
    circle(4, 20, 2),
  ],
  plus: [path('M5 12h14'), path('M12 5v14')],
  check: [path('M20 6 9 17l-5-5')],
  paperclip: [
    path(
      'm16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551',
    ),
  ],
  bell: [
    path('M10.268 21a2 2 0 0 0 3.464 0'),
    path(
      'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
    ),
  ],
  'circle-alert': [circle(12, 12, 10), path('M12 8v4'), path('M12 16h.01')],
  clock: [circle(12, 12, 10), path('M12 6v6l4 2')],
  'circle-check': [
    path('M21.801 10A10 10 0 1 1 17 3.335'),
    path('m9 11 3 3L22 4'),
  ],
  'refresh-cw': [
    path('M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'),
    path('M21 3v5h-5'),
    path('M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'),
    path('M8 16H3v5'),
  ],
  'check-check': [path('M18 6 7 17l-5-5'), path('m22 10-7.5 7.5L13 16')],
  'chevron-left': [path('m15 18-6-6 6-6')],
  'trending-up': [path('M16 7h6v6'), path('m22 7-8.5 8.5-5-5L2 17')],
  pencil: [
    path(
      'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
    ),
    path('m15 5 4 4'),
  ],
  x: [path('M18 6 6 18'), path('m6 6 12 12')],
};

type LifeIconProps = {
  name: LifeIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

// Decorative by default: the control that contains the icon carries the
// accessibility label.
const LifeIcon = ({
  name,
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2,
}: LifeIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    {ICONS[name].map((shape, index) =>
      shape.type === 'path' ? (
        <Path key={index} d={shape.d} />
      ) : (
        <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />
      ),
    )}
  </Svg>
);

export default LifeIcon;
