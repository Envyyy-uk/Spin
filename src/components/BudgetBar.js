import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { formatMoney, formatPercent } from '../lib/format';
import { colors, fontFamily, radius, space } from '../theme';

export const STATUS_TONE = {
  comfortable: { fg: colors.success, bg: colors.successSoft, icon: '✓' },
  tight: { fg: colors.warning, bg: colors.warningSoft, icon: '!' },
  risky: { fg: colors.coral, bg: colors.dangerSoft, icon: '!' },
  insufficient: { fg: colors.danger, bg: colors.dangerSoft, icon: '✕' },
};

/**
 * Visual comparison of the estimated total (with its likely range) against
 * the budget. Values are in the display currency.
 */
export function BudgetBar({ total, budget, status, currency }) {
  const { t, lang } = useI18n();
  const scale = Math.max(budget, total.max) * 1.05;
  const pct = (v) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;
  const tone = STATUS_TONE[status] || STATUS_TONE.tight;
  const ratio = budget > 0 ? total.mid / budget : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('estimate.indicatorLabel')}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(ratio, 1) * 100), text: `${formatMoney(total.mid, currency, lang)} / ${formatMoney(budget, currency, lang)}` }}
      style={styles.wrap}
    >
      <View style={styles.track}>
        <View style={[styles.range, { left: pct(total.min), width: `${Math.max(0, ((total.max - total.min) / scale) * 100)}%`, backgroundColor: tone.bg, borderColor: tone.fg }]} />
        <View style={[styles.fill, { width: pct(total.mid), backgroundColor: tone.fg }]} />
        <View style={[styles.budgetLine, { left: pct(budget) }]} />
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          <Text style={[styles.dot, { color: tone.fg }]}>● </Text>
          {t('estimate.total')}: <Text style={styles.strong}>{formatMoney(total.mid, currency, lang)}</Text> ({formatPercent(ratio, lang)})
        </Text>
        <Text style={styles.legendText}>
          <Text style={styles.dot}>▎</Text>
          {t('estimate.budget')}: <Text style={styles.strong}>{formatMoney(budget, currency, lang)}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(2) },
  track: { height: 22, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'visible', position: 'relative' },
  range: { position: 'absolute', top: 0, bottom: 0, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed' },
  fill: { position: 'absolute', left: 0, top: 5, bottom: 5, borderRadius: radius.pill },
  budgetLine: { position: 'absolute', top: -5, bottom: -5, width: 3, marginLeft: -1.5, backgroundColor: colors.text, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space(2) },
  legendText: { fontFamily, fontSize: 14, color: colors.textMuted },
  strong: { color: colors.text, fontWeight: '800' },
  dot: { color: colors.text },
});
