import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LANGUAGES, useI18n } from '../i18n';
import { colors, fontFamily, radius, space } from '../theme';
import { SelectModal } from './SelectModal';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const options = LANGUAGES.map((l) => ({ value: l.code, label: l.native, detail: l.code.toUpperCase() }));
  return (
    <View style={styles.wrap}>
      <Text style={styles.globe} aria-hidden>
        🌐
      </Text>
      <View style={compact ? styles.selectCompact : styles.select}>
        <SelectModal
          label={t('app.language')}
          title={t('app.chooseLanguage')}
          value={lang}
          options={options}
          onChange={setLang}
          triggerLabel={compact ? lang.toUpperCase() : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
  globe: { fontSize: 18 },
  select: { minWidth: 150, borderRadius: radius.pill },
  selectCompact: { minWidth: 76 },
  label: { fontFamily },
});
