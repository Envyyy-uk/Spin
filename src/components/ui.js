import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors, focusRing, fontFamily, radius, shadow, space, type, webTransition } from '../theme';
import { Icon, ICON_NAMES } from './Icon';

export function Card({ style, children, raised, ...rest }) {
  return (
    <View style={[styles.card, raised && styles.cardRaised, style]} {...rest}>
      {children}
    </View>
  );
}

export function Eyebrow({ children, style, color }) {
  return <Text style={[type.eyebrow, { color: color || colors.accentDark }, style]}>{children}</Text>;
}

export function H1({ children, style }) {
  return (
    <Text accessibilityRole="header" aria-level={1} style={[styles.h1, style]}>
      {children}
    </Text>
  );
}

export function H2({ children, style }) {
  return (
    <Text accessibilityRole="header" aria-level={2} style={[styles.h2, style]}>
      {children}
    </Text>
  );
}

export function H3({ children, style }) {
  return (
    <Text accessibilityRole="header" aria-level={3} style={[styles.h3, style]}>
      {children}
    </Text>
  );
}

export function P({ children, style, muted, ...rest }) {
  return (
    <Text style={[styles.p, muted && styles.muted, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Section heading block used across screens: eyebrow + title + optional lead text. */
export function SectionHeader({ eyebrow, title, lead, level = 2, style, light }) {
  const Title = level === 1 ? H1 : H2;
  return (
    <View style={[{ gap: space(1.5) }, style]}>
      {eyebrow ? <Eyebrow color={light ? colors.sun : undefined}>{eyebrow}</Eyebrow> : null}
      <Title style={light ? { color: colors.onNight } : null}>{title}</Title>
      {lead ? <P style={[styles.lead, light && { color: colors.onNightMuted }]}>{lead}</P> : null}
    </View>
  );
}

// Show focus rings for keyboard navigation only (like :focus-visible).
let keyboardMode = Platform.OS !== 'web';
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Enter' || e.key === ' ') keyboardMode = true;
  }, true);
  window.addEventListener('pointerdown', () => {
    keyboardMode = false;
  }, true);
}

/**
 * Pressable with hover (web), pressed and keyboard-focus states.
 * `style` may be a function receiving { pressed, hovered, focused }.
 */
export function Touchable({ style, children, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...rest}
      onFocus={(e) => {
        setFocused(keyboardMode);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={(state) => [webTransition, typeof style === 'function' ? style({ ...state, focused }) : style, focused && focusRing]}
    >
      {typeof children === 'function' ? (state) => children({ ...state, focused }) : children}
    </Pressable>
  );
}

function renderIcon(icon, color, size) {
  if (!icon) return null;
  if (ICON_NAMES.includes(icon)) return <Icon name={icon} color={color} size={size} />;
  return (
    <Text style={[styles.buttonIconText, { color }]} aria-hidden>
      {icon}
    </Text>
  );
}

export function Button({ label, onPress, variant = 'primary', disabled, icon, iconRight, style, small, large, accessibilityLabel, accessibilityHint }) {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const iconSize = small ? 16 : 18;
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      aria-disabled={!!disabled}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.button,
        small && styles.buttonSmall,
        large && styles.buttonLarge,
        { backgroundColor: v.bg, borderColor: v.border },
        hovered && !disabled && { backgroundColor: v.hover, borderColor: v.hoverBorder || v.border },
        pressed && !disabled && { backgroundColor: v.pressed, transform: [{ scale: 0.98 }] },
        disabled && styles.disabled,
        style,
      ]}
    >
      {renderIcon(icon, v.fg, iconSize)}
      {label ? <Text style={[styles.buttonText, small && styles.buttonTextSmall, large && styles.buttonTextLarge, { color: v.fg }]}>{label}</Text> : null}
      {renderIcon(iconRight, v.fg, iconSize)}
    </Touchable>
  );
}

const BUTTON_VARIANTS = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary, hover: colors.primaryDark, pressed: colors.primaryDark },
  accent: { bg: colors.accent, fg: colors.night, border: colors.accent, hover: '#f47f53', pressed: '#e0602f' },
  dark: { bg: colors.night, fg: colors.onNight, border: colors.night, hover: colors.nightSoft, pressed: colors.nightSoft },
  secondary: { bg: colors.surface, fg: colors.primaryDark, border: colors.borderStrong, hover: colors.primarySoft, hoverBorder: colors.primary, pressed: colors.primarySoft },
  light: { bg: 'rgba(255,255,255,0.08)', fg: colors.onNight, border: 'rgba(255,255,255,0.35)', hover: 'rgba(255,255,255,0.16)', pressed: 'rgba(255,255,255,0.2)' },
  ghost: { bg: 'transparent', fg: colors.primaryDark, border: 'transparent', hover: colors.primarySoft, pressed: colors.primarySoft },
};

export function Field({ label, hint, error, children, nativeID, style, icon }) {
  return (
    <View style={[styles.field, style]}>
      {label ? (
        <View style={styles.labelRow}>
          {icon ? <Icon name={icon} size={16} color={colors.primary} /> : null}
          <Text nativeID={nativeID ? `${nativeID}-label` : undefined} style={styles.label}>
            {label}
          </Text>
        </View>
      ) : null}
      {children}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}

export function ErrorText({ children, style }) {
  return (
    <View style={[styles.errorRow, style]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="alert" size={15} color={colors.danger} />
      <Text style={styles.error}>{children}</Text>
    </View>
  );
}

export function Input({ value, onChangeText, error, style, label, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel={label}
      aria-invalid={!!error}
      placeholderTextColor={colors.textMuted}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.input, webTransition, focused && styles.inputFocused, error && styles.inputError, style]}
      {...rest}
    />
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segmented}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Touchable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected }}
            aria-checked={selected}
            onPress={() => onChange(o.value)}
            style={({ hovered }) => [styles.segment, hovered && !selected && styles.segmentHover, selected && styles.segmentSelected]}
          >
            {o.icon ? <Icon name={o.icon} size={15} color={selected ? colors.primaryDark : colors.textMuted} /> : null}
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]} numberOfLines={2}>
              {o.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

export function Chip({ label, selected, onPress, accessibilityLabel, icon }) {
  return (
    <Touchable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      aria-checked={!!selected}
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      style={({ hovered }) => [styles.chip, selected ? styles.chipOn : styles.chipOff, hovered && styles.chipHover]}
    >
      {selected ? <Icon name="check" size={14} color={colors.primaryDark} strokeWidth={2.6} /> : icon ? <Icon name={icon} size={14} color={colors.textMuted} /> : null}
      <Text style={[styles.chipText, selected ? styles.chipTextOn : styles.chipTextOff]}>{label}</Text>
    </Touchable>
  );
}

export function Badge({ label, tone = 'example', icon }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.example;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <Icon name={icon} size={12} color={t.fg} strokeWidth={2.6} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export const BADGE_TONES = {
  example: { bg: colors.exampleSoft, fg: colors.example },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.primarySoft, fg: colors.primaryDark },
  accent: { bg: colors.accentSoft, fg: colors.accentDark },
};

export function Notice({ tone = 'info', children, icon = 'info', style }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.info;
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }, style]}>
      {ICON_NAMES.includes(icon) ? <Icon name={icon} size={18} color={t.fg} /> : <Text style={[styles.noticeIconText, { color: t.fg }]}>{icon}</Text>}
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function SwitchRow({ label, value, onValueChange, description }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.hint}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: '#b9c2c7' }}
        thumbColor={Platform.OS === 'android' ? colors.surface : undefined}
        {...(Platform.OS === 'web' ? { activeThumbColor: colors.surface } : {})}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space(5),
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  cardRaised: { borderColor: 'transparent' },
  h1: { ...type.h1, color: colors.text },
  h2: { ...type.h2, color: colors.text },
  h3: { ...type.h3, color: colors.text },
  p: { ...type.body, color: colors.text },
  lead: { fontSize: 16.5, lineHeight: 25, color: colors.textMuted, maxWidth: 680 },
  muted: { color: colors.textMuted },
  button: {
    minHeight: 48,
    paddingHorizontal: space(5),
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space(2),
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: space(3.5) },
  buttonLarge: { minHeight: 56, paddingHorizontal: space(7) },
  buttonText: { fontFamily, fontSize: 16, fontWeight: '700', letterSpacing: -0.1 },
  buttonTextSmall: { fontSize: 14 },
  buttonTextLarge: { fontSize: 17 },
  buttonIconText: { fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.45, ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : null) },
  field: { marginBottom: space(4) },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), marginBottom: space(2) },
  label: { fontFamily, fontSize: 14, fontWeight: '700', color: colors.text },
  hint: { ...type.small, color: colors.textMuted, marginTop: space(1.5) },
  errorRow: { flexDirection: 'row', gap: space(1.5), alignItems: 'flex-start', marginTop: space(1.5) },
  error: { ...type.small, flex: 1, color: colors.danger, fontWeight: '700' },
  input: {
    fontFamily,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space(4),
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.focus, ...(Platform.OS === 'web' ? { outlineStyle: 'none', boxShadow: '0 0 0 4px rgba(29,95,216,0.15)' } : {}) },
  inputError: { borderColor: colors.danger, backgroundColor: '#fffafa' },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4, gap: 4 },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: space(2),
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  segmentHover: { backgroundColor: 'rgba(255,255,255,0.6)' },
  segmentSelected: { backgroundColor: colors.surface, ...shadow },
  segmentText: { fontFamily, fontSize: 13.5, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  segmentTextSelected: { color: colors.primaryDark, fontWeight: '800' },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: space(3),
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.border },
  chipHover: { borderColor: colors.primary },
  chipText: { fontFamily, fontSize: 14, fontWeight: '600' },
  chipTextOn: { color: colors.primaryDark },
  chipTextOff: { color: colors.textMuted, textDecorationLine: 'line-through' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space(2.5), paddingVertical: 3 },
  badgeText: { fontFamily, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  notice: { flexDirection: 'row', gap: space(2.5), padding: space(3.5), borderRadius: radius.md, alignItems: 'flex-start' },
  noticeIconText: { fontSize: 16, fontWeight: '800', lineHeight: 20 },
  noticeText: { flex: 1, ...type.body, fontSize: 14, lineHeight: 20, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(2) },
});
