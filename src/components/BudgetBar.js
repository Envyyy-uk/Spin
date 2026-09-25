import React, { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { useI18n } from '../i18n';
import { formatMoney, formatPercent } from '../lib/format';
import { colors, fontFamily, radius, space } from '../theme';
import { Icon } from './Icon';
import { useAnimatedFraction } from './motion';

// Status never relies on colour alone: each has its own icon shape and text.
export const STATUS_TONE = {
  comfortable: { fg: colors.success, bg: colors.successSoft, icon: 'check' },
  tight: { fg: colors.warning, bg: colors.warningSoft, icon: 'alert' },
  risky: { fg: colors.coral, bg: colors.dangerSoft, icon: 'alert' },
  insufficient: { fg: colors.danger, bg: colors.dangerSoft, icon: 'x' },
};

/**
 * Estimated total (with its likely range) against the budget, in the display
 * currency. The part above the budget is hatched, the budget line is labelled
 * and the percentage is written out, so it reads without colour.
 */
export function BudgetBar({ total, budget, status, currency }) {
  const { t, lang } = useI18n();
  const [trackW, setTrackW] = useState(0);
  const scale = Math.max(budget, total.max) * 1.05;
  const frac = (v) => Math.max(0, Math.min(1, v / scale));
  const tone = STATUS_TONE[status] || STATUS_TONE.tight;
  const ratio = budget > 0 ? total.mid / budget : 0;
  const fillWidth = useAnimatedFraction(frac(total.mid));
  const budgetLeft = frac(budget);
  const over = total.mid - budget;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('estimate.indicatorLabel')}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(Math.min(ratio, 1) * 100),
        text: `${formatMoney(total.mid, currency, lang)} / ${formatMoney(budget, currency, lang)} (${formatPercent(ratio, lang)})`,
      }}
      style={styles.wrap}
    >
      <View
        style={[
          styles.markerLabelRow,
          budgetLeft > 0.7 ? { alignItems: 'flex-end', paddingRight: `${(1 - budgetLeft) * 100}%` } : { paddingLeft: `${budgetLeft * 100}%` },
        ]}
      >
        <Text style={[styles.markerLabel, budgetLeft > 0.7 && { marginLeft: 0, marginRight: -5 }]} numberOfLines={1}>
          {budgetLeft > 0.7 ? `${t('estimate.budgetMarker')} ▼` : `▼ ${t('estimate.budgetMarker')}`}
        </Text>
      </View>
      <View style={styles.track} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
        <View
          style={[
            styles.range,
            { left: `${frac(total.min) * 100}%`, width: `${Math.max(0, frac(total.max) - frac(total.min)) * 100}%`, borderColor: tone.fg },
          ]}
        />
        <Animated.View style={[styles.fill, { width: fillWidth, backgroundColor: tone.fg }]}>
          {over > 0 && trackW > 0 ? (
            <Svg style={{ position: 'absolute', left: budgetLeft * trackW, top: 0 }} width={trackW} height={14}>
              <Defs>
                <Pattern id="hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <Line x1={0} y1={0} x2={0} y2={6} stroke="#ffffff" strokeWidth={2.2} strokeOpacity={0.75} />
                </Pattern>
              </Defs>
              <Rect x={0} y={0} width={trackW} height={14} fill="url(#hatch)" />
            </Svg>
          ) : null}
        </Animated.View>
        <View style={[styles.budgetLine, { left: `${budgetLeft * 100}%` }]} />
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Icon name={tone.icon} size={16} color={tone.fg} strokeWidth={2.6} />
          <Text style={styles.legendText}>
            {t('estimate.total')}: <Text style={styles.strong}>{formatMoney(total.mid, currency, lang)}</Text>
            {' · '}
            {t('estimate.usedOfBudget', { pct: formatPercent(ratio, lang) })}
          </Text>
        </View>
        <Text style={styles.legendText}>
          {t('estimate.budget')}: <Text style={styles.strong}>{formatMoney(budget, currency, lang)}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(2) },
  markerLabelRow: { height: 16 },
  markerLabel: { fontFamily, fontSize: 11, fontWeight: '800', color: colors.text, marginLeft: -5, textTransform: 'uppercase', letterSpacing: 0.5 },
  track: { height: 24, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, position: 'relative', justifyContent: 'center' },
  range: { position: 'absolute', top: 0, bottom: 0, borderRadius: radius.pill, borderWidth: 1.5, borderStyle: 'dashed' },
  fill: { position: 'absolute', left: 0, top: 5, height: 14, borderRadius: radius.pill, overflow: 'hidden' },
  budgetLine: { position: 'absolute', top: -6, bottom: -6, width: 3, marginLeft: -1.5, backgroundColor: colors.text, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space(2), marginTop: space(1) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), flexShrink: 1 },
  legendText: { fontFamily, fontSize: 14, color: colors.textMuted, flexShrink: 1 },
  strong: { color: colors.text, fontWeight: '800' },
});
