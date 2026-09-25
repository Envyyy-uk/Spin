import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Small, consistent 24×24 stroke icon set drawn for Spin.
const PATHS = {
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  arrowLeft: ['M19 12H5', 'M11 6l-6 6 6 6'],
  globe: ['M3 12h18', 'M12 3c2.8 3 4 6 4 9s-1.2 6-4 9c-2.8-3-4-6-4-9s1.2-6 4-9z'],
  calendar: ['M3 10h18', 'M8 3v4', 'M16 3v4'],
  users: ['M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6', 'M16 14.2c3 .3 5.5 2.4 5.5 5.8'],
  wallet: ['M3 10h18', 'M16 15h2'],
  pin: ['M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z'],
  plane: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4z'],
  spin: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  alert: ['M12 3.5l9.5 17h-19z', 'M12 10v4.5', 'M12 17.5v.01'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z'],
  bed: ['M3 18V7', 'M3 14h18v4', 'M21 14v-2a3 3 0 0 0-3-3h-7v5'],
  ticket: ['M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z', 'M14 8v2', 'M14 12v2', 'M14 16v.5'],
  food: ['M7 3v18', 'M4 3v5a3 3 0 0 0 6 0V3', 'M17 21V3c-2.5 1-4 3.5-4 7h4'],
  sliders: ['M4 7h9', 'M19 7h1', 'M4 17h3', 'M13 17h7'],
  lock: ['M8 11V8a4 4 0 0 1 8 0v3'],
  share: ['M12 3v12', 'M7 8l5-5 5 5', 'M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  info: ['M12 11v6', 'M12 7.5v.01'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronUp: ['M6 15l6-6 6 6'],
  chevronLeft: ['M15 6l-6 6 6 6'],
  chevronRight: ['M9 6l6 6-6 6'],
  minus: ['M5 12h14'],
  plus: ['M12 5v14', 'M5 12h14'],
  map: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14', 'M15 6v14'],
  bus: ['M4 11h16', 'M8 14.5v.01', 'M16 14.5v.01', 'M7 18v2', 'M17 18v2', 'M8 7h8'],
  train: ['M5 10h14', 'M9 13.5v.01', 'M15 13.5v.01', 'M9 17l-2 4', 'M15 17l2 4'],
  car: ['M3 17v-4l2.2-5h13.6L21 13v4z', 'M3 13h18', 'M7 17v2', 'M17 17v2', 'M7 15v.01', 'M17 15v.01'],
  bulb: ['M9 18h6', 'M10 21h4', 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z'],
  // holiday styles
  sea: ['M2 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2', 'M2 19c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2', 'M12 4a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z'],
  culture: ['M3 21h18', 'M5 10v8', 'M9.5 10v8', 'M14.5 10v8', 'M19 10v8', 'M2 10l10-6 10 6z'],
  nature: ['M3 20l6-10 4 6 3-4 5 8z'],
  adventure: ['M15.5 8.5l-2 5-5 2 2-5z'],
  relax: ['M5 19c0-8 6-14 15-14 0 9-6 15-14 15', 'M5 19l7-7'],
};

// Extra non-path primitives for a few icons.
const EXTRAS = {
  globe: (c, w) => <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={w} fill="none" />,
  calendar: (c, w) => <Rect x={3} y={5} width={18} height={16} rx={3} stroke={c} strokeWidth={w} fill="none" />,
  users: (c, w) => (
    <>
      <Circle cx={9} cy={8} r={3.5} stroke={c} strokeWidth={w} fill="none" />
      <Circle cx={17} cy={9} r={2.5} stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  wallet: (c, w) => <Rect x={3} y={6} width={18} height={14} rx={3} stroke={c} strokeWidth={w} fill="none" />,
  pin: (c, w) => <Circle cx={12} cy={9.5} r={2.5} stroke={c} strokeWidth={w} fill="none" />,
  bed: (c, w) => <Circle cx={7} cy={11} r={2} stroke={c} strokeWidth={w} fill="none" />,
  sliders: (c, w) => (
    <>
      <Circle cx={16} cy={7} r={2.3} stroke={c} strokeWidth={w} fill="none" />
      <Circle cx={10} cy={17} r={2.3} stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  bus: (c, w) => <Rect x={4} y={4} width={16} height={14} rx={3} stroke={c} strokeWidth={w} fill="none" />,
  train: (c, w) => <Rect x={5} y={3} width={14} height={14} rx={3.5} stroke={c} strokeWidth={w} fill="none" />,
  lock: (c, w) => <Rect x={5} y={11} width={14} height={10} rx={2.5} stroke={c} strokeWidth={w} fill="none" />,
  info: (c, w) => <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={w} fill="none" />,
  adventure: (c, w) => <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={w} fill="none" />,
};

export const ICON_NAMES = Object.keys(PATHS);

export function Icon({ name, size = 20, color = colors.text, strokeWidth = 2, style }) {
  const paths = PATHS[name];
  if (!paths) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {EXTRAS[name]?.(color, strokeWidth)}
      {paths.map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </Svg>
  );
}
