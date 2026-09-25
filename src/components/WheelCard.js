import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { colors, fontFamily, radius, space } from '../theme';
import { Badge, Card, ErrorText, H2, P, Touchable } from './ui';
import { Icon } from './Icon';
import { Wheel } from './Wheel';
import { Reveal, animateNextLayout, useReducedMotion } from './motion';

/**
 * Shell for one wheel: icon + title, the wheel, a manual-choice control and a
 * disclosure panel with the wheel's settings.
 */
export function WheelCard({
  title,
  icon,
  badge,
  options,
  selectedIndex,
  onSelect,
  spinSignal,
  countText,
  manual,
  settings,
  error,
  note,
  disabled,
  size,
  style,
  headerExtra,
}) {
  const { t, tp } = useI18n();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const toggle = () => {
    animateNextLayout(reduced);
    setOpen((v) => !v);
  };
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Icon name={icon} size={22} color={colors.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <H2 style={{ marginBottom: 0 }}>{title}</H2>
          {!disabled ? <P muted style={styles.count}>{countText || tp('plural.options', options.length)}</P> : null}
        </View>
        {badge ? <Badge label={badge} tone="accent" /> : null}
      </View>
      {headerExtra}
      {!disabled ? (
        <>
          <Wheel title={title} options={options} selectedIndex={selectedIndex} onSelect={onSelect} spinSignal={spinSignal} size={size} disabled={options.length === 0} />
          {note ? <P muted style={styles.note}>{note}</P> : null}
          {error ? <ErrorText>{error}</ErrorText> : null}
          {options.length === 0 && !error ? <ErrorText>{t('wheels.noOptions')}</ErrorText> : null}
          <View style={styles.manual}>
            <Text style={styles.manualLabel}>{t('wheels.manual')}</Text>
            {manual}
          </View>
          {settings ? (
            <View style={styles.settingsBox}>
              <Touchable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                aria-expanded={open}
                accessibilityLabel={`${open ? t('wheels.hideSettings') : t('wheels.settings')}: ${title}`}
                onPress={toggle}
                style={({ hovered }) => [styles.settingsToggle, hovered && { backgroundColor: colors.surfaceAlt }]}
              >
                <Icon name="sliders" size={18} color={colors.primaryDark} />
                <Text style={styles.settingsToggleText}>{open ? t('wheels.hideSettings') : t('wheels.settings')}</Text>
                <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} color={colors.primaryDark} />
              </Touchable>
              {open ? (
                <Reveal distance={10} style={styles.settings}>
                  {settings}
                </Reveal>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space(4) },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  iconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 13, marginTop: 2 },
  note: { fontSize: 13, textAlign: 'center' },
  manual: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space(4), gap: space(2) },
  manualLabel: { fontFamily, fontWeight: '700', fontSize: 14, color: colors.text },
  settingsBox: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  settingsToggle: { flexDirection: 'row', alignItems: 'center', gap: space(2), minHeight: 46, paddingHorizontal: space(3.5) },
  settingsToggleText: { flex: 1, fontFamily, fontSize: 14.5, fontWeight: '700', color: colors.primaryDark },
  settings: { backgroundColor: colors.surfaceAlt, padding: space(4), gap: space(3) },
});
