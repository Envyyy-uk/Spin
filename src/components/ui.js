import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors, focusRing, fontFamily, radius, shadow, space } from '../theme';

export function Card({ style, children, ...rest }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
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

/** Pressable with a visible keyboard focus ring on web. */
export function Touchable({ style, children, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={(state) => [typeof style === 'function' ? style(state) : style, focused && focusRing]}
    >
      {children}
    </Pressable>
  );
}

export function Button({ label, onPress, variant = 'primary', disabled, icon, style, small, accessibilityLabel, accessibilityHint }) {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !disabled && { backgroundColor: v.pressed },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Text style={[styles.buttonIcon, { color: v.fg }]} aria-hidden>{icon}</Text> : null}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: v.fg }]}>{label}</Text>
    </Touchable>
  );
}

const BUTTON_VARIANTS = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary, pressed: colors.primaryDark },
  accent: { bg: colors.accent, fg: colors.text, border: colors.accent, pressed: '#e0952a' },
  secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary, pressed: colors.primarySoft },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent', pressed: colors.primarySoft },
};

export function Field({ label, hint, error, children, nativeID, style }) {
  return (
    <View style={[styles.field, style]}>
      {label ? (
        <Text nativeID={nativeID ? `${nativeID}-label` : undefined} style={styles.label}>
          {label}
        </Text>
      ) : null}
      {children}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}

export function ErrorText({ children }) {
  return (
    <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
      ⚠ {children}
    </Text>
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
      style={[styles.input, focused && styles.inputFocused, error && styles.inputError, style]}
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
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]} numberOfLines={2}>
              {o.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

export function Chip({ label, selected, onPress, accessibilityLabel }) {
  return (
    <Touchable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      aria-checked={!!selected}
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextOn : styles.chipTextOff]}>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Touchable>
  );
}

export function Badge({ label, tone = 'example' }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.example;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const BADGE_TONES = {
  example: { bg: colors.exampleSoft, fg: colors.example },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.primarySoft, fg: colors.primaryDark },
};

export function Notice({ tone = 'info', children, icon }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.info;
  return (
    <View style={[styles.notice, { backgroundColor: t.bg, borderColor: t.fg }]}>
      {icon ? <Text style={[styles.noticeIcon, { color: t.fg }]} aria-hidden>{icon}</Text> : null}
      <Text style={[styles.noticeText, { color: colors.text }]}>{children}</Text>
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
        trackColor={{ true: colors.primary, false: '#b8c6c2' }}
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
  h1: { fontFamily, fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  h2: { fontFamily, fontSize: 21, fontWeight: '800', color: colors.text, marginBottom: space(2) },
  h3: { fontFamily, fontSize: 17, fontWeight: '700', color: colors.text },
  p: { fontFamily, fontSize: 15, lineHeight: 22, color: colors.text },
  muted: { color: colors.textMuted },
  button: {
    minHeight: 48,
    paddingHorizontal: space(5),
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space(2),
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: space(3) },
  buttonText: { fontFamily, fontSize: 16, fontWeight: '700' },
  buttonTextSmall: { fontSize: 14 },
  buttonIcon: { fontSize: 18, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  field: { marginBottom: space(4) },
  label: { fontFamily, fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: space(1.5) },
  hint: { fontFamily, fontSize: 13, color: colors.textMuted, marginTop: space(1.5), lineHeight: 18 },
  error: { fontFamily, fontSize: 13, color: colors.danger, marginTop: space(1.5), fontWeight: '600', lineHeight: 18 },
  input: {
    fontFamily,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space(3.5),
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.focus, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  inputError: { borderColor: colors.danger, backgroundColor: '#fffafa' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(2),
  },
  segmentSelected: { backgroundColor: colors.surface, ...shadow },
  segmentText: { fontFamily, fontSize: 13.5, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  segmentTextSelected: { color: colors.primaryDark, fontWeight: '800' },
  chip: { borderRadius: radius.pill, paddingHorizontal: space(3), minHeight: 36, justifyContent: 'center', borderWidth: 1.5 },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.border },
  chipText: { fontFamily, fontSize: 14, fontWeight: '600' },
  chipTextOn: { color: colors.primaryDark },
  chipTextOff: { color: colors.textMuted, textDecorationLine: 'line-through' },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space(2.5), paddingVertical: 3 },
  badgeText: { fontFamily, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  notice: { flexDirection: 'row', gap: space(2), padding: space(3), borderRadius: radius.md, borderLeftWidth: 4, alignItems: 'flex-start' },
  noticeIcon: { fontSize: 16, fontWeight: '800', lineHeight: 20 },
  noticeText: { flex: 1, fontFamily, fontSize: 14, lineHeight: 20 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(3) },
});
