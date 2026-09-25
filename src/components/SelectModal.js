import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { colors, fontFamily, radius, space } from '../theme';
import { Button, Input, Touchable } from './ui';
import { Icon } from './Icon';

/**
 * Accessible single-choice picker: a field-like button that opens a searchable
 * list in a modal. Works identically on web, iOS and Android.
 */
export function SelectModal({ label, value, options, onChange, placeholder, error, searchable, title, disabled, triggerLabel }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const dialog = width >= 600; // centred dialog on tablet/desktop, bottom sheet on phones
  const [query, setQuery] = useState('');
  const current = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.searchText || ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current ? current.label : placeholder || t('common.select')}`}
        aria-haspopup="dialog"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ hovered }) => [styles.trigger, hovered && !disabled && styles.triggerHover, error && styles.triggerError, disabled && { opacity: 0.5 }]}
      >
        <Text style={[styles.triggerText, !current && styles.placeholder]} numberOfLines={1}>
          {triggerLabel || (current ? current.label : placeholder || t('common.select'))}
        </Text>
        <Icon name="chevronDown" size={18} color={colors.textMuted} />
      </Touchable>
      <Modal visible={open} animationType={dialog ? 'fade' : 'slide'} transparent onRequestClose={close}>
        <View style={[styles.backdrop, dialog && styles.backdropDialog]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={t('common.close')} />
          <SafeAreaView style={[styles.sheet, dialog && styles.sheetDialog]} edges={['bottom']} accessibilityViewIsModal aria-modal role="dialog" aria-label={title || label}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} accessibilityRole="header">
                {title || label}
              </Text>
              <Button small variant="ghost" label={t('common.close')} onPress={close} />
            </View>
            {searchable ? (
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder={t('common.search')}
                label={t('common.search')}
                autoFocus
                style={{ marginBottom: space(2) }}
              />
            ) : null}
            <FlatList
              data={filtered}
              keyExtractor={(o) => String(o.value)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>{t('common.noMatches')}</Text>}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Touchable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, selected }}
                    aria-checked={selected}
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                    style={({ pressed, hovered }) => [styles.option, (pressed || hovered) && styles.optionPressed, selected && styles.optionSelected]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.label}</Text>
                    {item.detail ? <Text style={styles.optionDetail}>{item.detail}</Text> : null}
                    {selected ? <Icon name="check" size={18} color={colors.primary} strokeWidth={2.6} /> : null}
                  </Touchable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space(3.5),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  triggerHover: { borderColor: colors.primary },
  triggerError: { borderColor: colors.danger },
  triggerText: { flex: 1, fontFamily, fontSize: 16, color: colors.text },
  placeholder: { color: colors.textMuted },
  chevron: { fontSize: 16, color: colors.textMuted, marginLeft: space(2) },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space(4),
  },
  backdropDialog: { justifyContent: 'center', padding: space(6) },
  sheetDialog: { borderRadius: radius.lg, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space(2) },
  sheetTitle: { fontFamily, fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 },
  option: {
    minHeight: 48,
    paddingHorizontal: space(3),
    paddingVertical: space(2.5),
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
  },
  optionSelected: { backgroundColor: colors.primarySoft },
  optionPressed: { backgroundColor: colors.surfaceAlt },
  optionText: { flex: 1, fontFamily, fontSize: 16, color: colors.text },
  optionTextSelected: { fontWeight: '800', color: colors.primaryDark },
  optionDetail: { fontFamily, fontSize: 13, color: colors.textMuted },
  check: { fontSize: 16, color: colors.primary, fontWeight: '800' },
  empty: { fontFamily, padding: space(4), textAlign: 'center', color: colors.textMuted },
});
