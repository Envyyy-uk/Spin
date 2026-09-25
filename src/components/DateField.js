import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useI18n } from '../i18n';
import { parseISO, toISO } from '../lib/dates';
import { formatDate, LOCALE_TAGS } from '../lib/format';
import { colors, fontFamily, radius, space } from '../theme';
import { Button, Touchable } from './ui';

/**
 * Date input:
 *  - web: native <input type="date"> (keyboard accessible, localized by the browser)
 *  - Android: system date dialog
 *  - iOS: inline calendar in a bottom sheet
 * Value is always an ISO date string (YYYY-MM-DD) or ''.
 */
export function DateField({ value, onChange, label, error, min, max, nativeID }) {
  const { t, lang } = useI18n();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value: value || '',
      min: min || undefined,
      max: max || undefined,
      lang,
      id: nativeID,
      'aria-label': label,
      'aria-invalid': !!error,
      onChange: (e) => onChange(e.target.value),
      style: {
        fontFamily: 'inherit',
        fontSize: 16,
        minHeight: 48,
        boxSizing: 'border-box',
        width: '100%',
        padding: '0 14px',
        borderRadius: radius.md,
        border: `1.5px solid ${error ? colors.danger : colors.border}`,
        color: colors.text,
        background: colors.surface,
      },
    });
  }

  const current = parseISO(value) || parseISO(min) || new Date();
  const minDate = parseISO(min) || undefined;
  const maxDate = parseISO(max) || undefined;

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: minDate,
        maximumDate: maxDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toISO(date));
        },
      });
    } else {
      setDraft(current);
      setIosOpen(true);
    }
  };

  return (
    <>
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value, lang, 'long') : t('date.pick')}`}
        onPress={open}
        style={[styles.trigger, error && { borderColor: colors.danger }]}
      >
        <Text style={[styles.text, !value && { color: colors.textMuted }]}>
          {value ? formatDate(value, lang, 'long') : t('date.pick')}
        </Text>
        <Text aria-hidden style={styles.icon}>📅</Text>
      </Touchable>
      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <Text style={styles.title}>{label}</Text>
              <DateTimePicker
                value={draft || current}
                mode="date"
                display="inline"
                locale={LOCALE_TAGS[lang]}
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={(_, date) => date && setDraft(date)}
              />
              <Button
                label={t('common.done')}
                onPress={() => {
                  onChange(toISO(draft || current));
                  setIosOpen(false);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space(3.5),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  text: { flex: 1, fontFamily, fontSize: 16, color: colors.text },
  icon: { fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,18,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, padding: space(4), paddingBottom: space(8), borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  title: { fontFamily, fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: space(2) },
});
