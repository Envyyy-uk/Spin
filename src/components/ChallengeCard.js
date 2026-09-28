import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { formatMoney } from '../lib/format';
import { colors, fontFamily, radius, space, type } from '../theme';
import { Badge, Card } from './ui';
import { Icon } from './Icon';

const TIPS = [
  ['car', 'getThere'],
  ['bed', 'stay'],
  ['food', 'food'],
  ['ticket', 'fun'],
  ['alert', 'safety'],
];

/** "Challenge mode" survival tips for a pot that barely covers the trip (or not at all). */
export function ChallengeCard({ pot, currency = 'EUR' }) {
  const { t, lang } = useI18n();
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Badge label={t('roulette.challengeBadge')} tone="danger" icon="sparkle" />
      </View>
      <Text style={styles.title} accessibilityRole="header" aria-level={3}>
        {t('roulette.challengeTitle', { amount: formatMoney(pot, currency, lang) })}
      </Text>
      <Text style={styles.lead}>{t('roulette.challengeLead')}</Text>
      <View style={styles.tips}>
        {TIPS.map(([icon, key]) => (
          <View key={key} style={styles.tip}>
            <View style={styles.tipIcon}>
              <Icon name={icon} size={18} color={colors.coral} />
            </View>
            <Text style={styles.tipText}>{t(`roulette.challengeTips.${key}`)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space(3), borderColor: colors.coral, borderWidth: 1.5, backgroundColor: '#fff7f4' },
  head: { flexDirection: 'row' },
  title: { fontFamily, fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  lead: { ...type.body, color: colors.textMuted },
  tips: { gap: space(2.5) },
  tip: { flexDirection: 'row', gap: space(3), alignItems: 'flex-start' },
  tipIcon: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  tipText: { ...type.body, flex: 1, color: colors.text },
});
