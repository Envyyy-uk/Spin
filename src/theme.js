import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Spin design system
// Palette: deep ocean (primary), warm sunset (accent), sand (background).
// Every text colour below passes WCAG AA (4.5:1) on `bg` and `surface`.
// ---------------------------------------------------------------------------

export const colors = {
  bg: '#f6f4ef', // sand
  surface: '#ffffff',
  surfaceAlt: '#efece5',
  border: '#e2ddd3',
  borderStrong: '#cbc4b6',
  text: '#0e1a24', // ink
  textMuted: '#4b5b68',
  primary: '#0f5c6e', // ocean
  primaryDark: '#0a4150',
  primarySoft: '#dcedf0',
  onPrimary: '#ffffff',
  accent: '#f26b3a', // sunset (decor, large text, buttons with dark text)
  accentDark: '#a83d14', // sunset for small text
  accentSoft: '#fde8dd',
  sun: '#f5b041',
  night: '#0b1b2b', // hero background
  nightSoft: '#16324a',
  onNight: '#ffffff',
  onNightMuted: '#c3d3df',
  coral: '#c9472b',
  success: '#0d7a44',
  successSoft: '#dcf3e6',
  warning: '#8f5300',
  warningSoft: '#fff1d2',
  danger: '#b3261e',
  dangerSoft: '#fde7e5',
  focus: '#1d5fd8',
  example: '#6b3fa0',
  exampleSoft: '#efe7fa',
  overlay: 'rgba(11,27,43,0.55)',
};

// Wheel segment palette: all pass 4.5:1 with ink text (#0e1a24).
export const wheelPalette = ['#9fd6d2', '#ffd199', '#f9b29a', '#bccdf5', '#cfe6a3', '#f4bfd8', '#a9dcef', '#ead6ad'];

// Cost category colours (bars and legends; always paired with a text label).
export const categoryColors = {
  transport: '#2f6fb3',
  accommodation: '#0f5c6e',
  food: '#d9821a',
  local: '#7a55b8',
  activities: '#c9476a',
};

export const radius = { sm: 10, md: 14, lg: 22, xl: 30, pill: 999 };
export const space = (n) => n * 4;

// Breakpoints (dp / CSS px).
export const breakpoints = { tablet: 600, desktop: 1024 };
export const maxContentWidth = 1160;

export const fontFamily = Platform.select({
  web: '"Manrope", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, system-ui, sans-serif',
  default: undefined, // SF Pro on iOS, Roboto on Android
});

// Type scale. `display` sizes are tuned per breakpoint in components.
export const type = {
  display: { fontFamily, fontWeight: '800', letterSpacing: -1.2 },
  h1: { fontFamily, fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 },
  h2: { fontFamily, fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.3 },
  h3: { fontFamily, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  body: { fontFamily, fontSize: 15, lineHeight: 22 },
  small: { fontFamily, fontSize: 13, lineHeight: 18 },
  eyebrow: { fontFamily, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
};

export const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(14,26,36,0.05), 0 8px 24px rgba(14,26,36,0.06)' },
  ios: { shadowColor: '#0e1a24', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } },
  default: { elevation: 2 },
});

export const shadowRaised = Platform.select({
  web: { boxShadow: '0 2px 4px rgba(14,26,36,0.06), 0 18px 40px rgba(14,26,36,0.12)' },
  ios: { shadowColor: '#0e1a24', shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } },
  default: { elevation: 6 },
});

// Motion tokens (ms). Components shorten or skip these when reduce-motion is on.
export const motion = { fast: 160, base: 280, slow: 520, spin: 3800 };

// Visible focus ring for keyboard users on web.
export const focusRing = Platform.OS === 'web' ? { outlineStyle: 'solid', outlineWidth: 3, outlineColor: colors.focus, outlineOffset: 2 } : {};

// Smooth colour/transform changes for hover states on web (no effect on native).
export const webTransition = Platform.OS === 'web' ? { transitionProperty: 'background-color, border-color, box-shadow, transform, opacity', transitionDuration: '160ms' } : {};
