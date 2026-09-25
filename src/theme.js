import { Platform } from 'react-native';

export const colors = {
  bg: '#f4f7f6',
  surface: '#ffffff',
  surfaceAlt: '#eef4f2',
  border: '#d5e0dc',
  text: '#10201c',
  textMuted: '#4a5b57',
  primary: '#0b6e62',
  primaryDark: '#07524a',
  primarySoft: '#d8eeea',
  onPrimary: '#ffffff',
  accent: '#f2a93b',
  accentSoft: '#fdf0da',
  coral: '#d9573b',
  success: '#0d7a44',
  successSoft: '#dcf3e6',
  warning: '#9a5b00',
  warningSoft: '#fff2d6',
  danger: '#b3261e',
  dangerSoft: '#fde7e5',
  focus: '#1d4ed8',
  example: '#6b3fa0',
  exampleSoft: '#efe7fa',
};

// Wheel segment palette: all pass 4.5:1 with dark text (#10201c).
export const wheelPalette = ['#8fd3c7', '#ffd08a', '#f7a996', '#b9c9f5', '#c7e59a', '#f3b8d8', '#9fd8f0', '#e8d3a8'];

// Cost category colours (used for bars and legends).
export const categoryColors = {
  transport: '#2f6fb3',
  accommodation: '#0b6e62',
  food: '#e08a1e',
  local: '#7a55b8',
  activities: '#cf4f6a',
};

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };
export const space = (n) => n * 4;

export const fontFamily = Platform.select({
  web: '"Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  default: undefined,
});

export const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(16,32,28,0.06), 0 6px 20px rgba(16,32,28,0.06)' },
  ios: { shadowColor: '#10201c', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  default: { elevation: 2 },
});

// Visible focus ring for keyboard users on web.
export const focusRing = Platform.OS === 'web' ? { outlineStyle: 'solid', outlineWidth: 3, outlineColor: colors.focus, outlineOffset: 2 } : {};
