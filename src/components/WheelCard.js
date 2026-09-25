import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n';
import { colors, space } from '../theme';
import { Badge, Button, Card, ErrorText, H2, P } from './ui';
import { Wheel } from './Wheel';

/**
 * Shell for one wheel: title, the wheel, a manual-choice control and a
 * collapsible settings panel.
 */
export function WheelCard({
  title,
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
  const [open, setOpen] = useState(false);
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <H2 style={{ marginBottom: 0 }}>{title}</H2>
          {!disabled ? (
            <P muted style={styles.count}>
              {countText || tp('plural.options', options.length)}
            </P>
          ) : null}
        </View>
        {badge ? <Badge label={badge} tone="info" /> : null}
      </View>
      {headerExtra}
      {!disabled ? (
        <>
          <Wheel
            title={title}
            options={options}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            spinSignal={spinSignal}
            size={size}
            disabled={disabled || options.length === 0}
          />
          {note ? <P muted style={styles.note}>{note}</P> : null}
          {error ? <ErrorText>{error}</ErrorText> : null}
          {options.length === 0 && !error ? <ErrorText>{t('wheels.noOptions')}</ErrorText> : null}
          <View style={styles.manual}>
            <P style={styles.manualLabel}>{t('wheels.manual')}</P>
            {manual}
          </View>
          {settings ? (
            <>
              <Button
                variant="ghost"
                small
                label={`${open ? '▴' : '▾'} ${open ? t('wheels.hideSettings') : t('wheels.settings')}`}
                accessibilityLabel={`${open ? t('wheels.hideSettings') : t('wheels.settings')}: ${title}`}
                onPress={() => setOpen((v) => !v)}
                style={styles.settingsToggle}
              />
              {open ? <View style={styles.settings}>{settings}</View> : null}
            </>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space(3) },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space(2) },
  count: { fontSize: 13, marginTop: 2 },
  note: { fontSize: 13, textAlign: 'center' },
  manual: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space(3) },
  manualLabel: { fontWeight: '700', fontSize: 14, marginBottom: space(1.5) },
  settingsToggle: { alignSelf: 'flex-start' },
  settings: { backgroundColor: colors.surfaceAlt, borderRadius: 14, padding: space(3), gap: space(2) },
});
