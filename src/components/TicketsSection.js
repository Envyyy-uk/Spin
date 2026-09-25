import React, { useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { countryName } from '../data/countries';
import { formatDate, formatMoney, formatMoneyRange } from '../lib/format';
import { getTicketOptions } from '../services/ticketsService';
import { colors, fontFamily, radius, space, type } from '../theme';
import { Badge, Button, Card, Notice, P, SectionHeader, Segmented, Touchable } from './ui';
import { Icon } from './Icon';
import { Reveal } from './motion';

const KIND_ICONS = { flight: 'plane', bus: 'bus', train: 'train', car: 'car', all: 'map' };

function ProviderRow({ provider }) {
  const { t } = useI18n();
  const label = `${t('tickets.searchTickets')}: ${provider.name} — ${t(`tickets.kind.${provider.kind}`)}`;
  const body = (
    <>
      <View style={styles.providerIcon}>
        <Icon name={KIND_ICONS[provider.kind]} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.providerTitleRow}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Badge label={t(`tickets.kind.${provider.kind}`)} tone="info" />
        </View>
        <Text style={styles.providerDesc}>{t(`tickets.providers.${provider.id}`)}</Text>
      </View>
      <View style={styles.providerCta}>
        <Text style={styles.providerCtaText}>{t('tickets.searchTickets')}</Text>
        <Icon name="external" size={16} color={colors.primary} />
      </View>
    </>
  );
  if (Platform.OS === 'web') {
    // A real link so it opens in a new tab and works with middle-click / long-press.
    return (
      <Touchable
        accessibilityRole="link"
        href={provider.url}
        hrefAttrs={{ target: '_blank', rel: 'noopener noreferrer' }}
        aria-label={`${label} (${t('suggest.external')})`}
        style={({ hovered }) => [styles.provider, hovered && styles.providerHover]}
      >
        {body}
      </Touchable>
    );
  }
  return (
    <Touchable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => Linking.openURL(provider.url).catch(() => {})}
      style={({ pressed }) => [styles.provider, pressed && styles.providerHover]}
    >
      {body}
    </Touchable>
  );
}

/**
 * "Getting there and back": fare estimate per travel mode plus pre-filled
 * ticket searches for flights, buses, trains and rideshares.
 */
export function TicketsSection({ trip, fx, today, budgetMode, onUseMode }) {
  const { t, tp, lang } = useI18n();
  const options = useMemo(() => getTicketOptions({ ...trip, today }), [trip, today]);
  const [mode, setMode] = useState(null);
  if (!options) return null;
  const active = mode || options.defaultMode;
  const m = options.modes[active];
  const est = m.estimate;
  const cur = trip.currency;
  const { route } = options;
  const isFlight = active === 'flight';
  const usedInBudget = (budgetMode || options.defaultMode) === active;

  return (
    <View style={styles.wrap}>
      <Reveal>
        <SectionHeader eyebrow={t('tickets.eyebrow')} title={t('tickets.title')} lead={t('tickets.lead')} />
      </Reveal>
      <Reveal>
        <Card style={styles.card}>
          <View style={styles.routeRow} accessible accessibilityLabel={`${countryName(route.from, lang)} → ${countryName(route.to, lang)}`}>
            <View style={styles.routeEnd}>
              <Text style={[styles.routeCode, !isFlight && styles.routeCodeCity]} numberOfLines={1}>{isFlight ? route.fromCode || route.from : route.fromCity}</Text>
              <Text style={styles.routeCity} numberOfLines={1}>{isFlight ? route.fromCity : countryName(route.from, lang)}</Text>
            </View>
            <View style={styles.routeLine}>
              <View style={styles.dash} />
              <Icon name={active === 'flight' ? 'plane' : 'bus'} size={20} color={colors.accentDark} />
              <View style={styles.dash} />
            </View>
            <View style={[styles.routeEnd, { alignItems: 'flex-end' }]}>
              <Text style={[styles.routeCode, !isFlight && styles.routeCodeCity]} numberOfLines={1}>{isFlight ? route.toCode || route.to : route.toCity}</Text>
              <Text style={styles.routeCity} numberOfLines={1}>{isFlight ? route.toCity : countryName(route.to, lang)}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="arrowRight" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {t('tickets.depart')}: <Text style={styles.metaStrong}>{formatDate(options.depart, lang)}</Text>
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="arrowLeft" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {t('tickets.return')}: <Text style={styles.metaStrong}>{formatDate(options.ret, lang)}</Text>
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="users" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>
                <Text style={styles.metaStrong}>{tp('plural.people', options.passengers)}</Text>
              </Text>
            </View>
          </View>

          <Segmented
            label={t('tickets.title')}
            value={active}
            onChange={setMode}
            options={[
              { value: 'flight', label: t('tickets.flight'), icon: 'plane' },
              { value: 'ground', label: t('tickets.ground'), icon: 'bus' },
            ]}
          />

          {est ? (
            <View style={styles.estimate}>
              <View style={styles.estimateHead}>
                <Text style={styles.estimateTitle}>{t('tickets.estimateTitle')}</Text>
                <Badge label={t('common.example')} tone="example" />
              </View>
              <Text style={styles.estimateValue}>
                ≈ {t('tickets.perPerson', { amount: formatMoneyRange(fx(est.perPerson.min), fx(est.perPerson.max), cur, lang) })}
              </Text>
              <Text style={styles.estimateSub}>
                {t('tickets.group', { amount: formatMoney(fx(est.group.mid), cur, lang), people: tp('plural.people', options.passengers) })}
              </Text>
              <Text style={styles.estimateNote}>{t('tickets.estimateNote')}</Text>
              {usedInBudget ? (
                <View style={styles.inBudget}>
                  <Icon name="check" size={16} color={colors.success} strokeWidth={2.6} />
                  <Text style={styles.inBudgetText}>{t('tickets.inBudget')}</Text>
                </View>
              ) : (
                <Button small variant="secondary" icon="wallet" label={t('tickets.useInBudget')} onPress={() => onUseMode(active)} style={{ alignSelf: 'flex-start' }} />
              )}
            </View>
          ) : (
            <Notice tone="warning" icon="alert">
              {t('tickets.groundUnavailable')}
            </Notice>
          )}

          <View style={styles.providers}>
            {m.providers.map((p) => (
              <ProviderRow key={p.id} provider={p} />
            ))}
          </View>

          <View style={styles.tips}>
            <View style={styles.tipsHead}>
              <Icon name="bulb" size={18} color={colors.accentDark} />
              <Text style={styles.tipsTitle}>{t('tickets.tipsTitle')}</Text>
            </View>
            {['tip1', 'tip2', 'tip3'].map((k) => (
              <P key={k} muted style={styles.tipLine}>
                • {t(`tickets.${k}`)}
              </P>
            ))}
          </View>
        </Card>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(4) },
  card: { gap: space(5) },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  routeEnd: { maxWidth: '35%' },
  routeCode: { fontFamily, fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8, color: colors.text },
  routeCodeCity: { fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  routeCity: { ...type.small, color: colors.textMuted, fontWeight: '700' },
  routeLine: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space(2) },
  dash: { flex: 1, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.borderStrong },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(5) },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
  metaText: { ...type.body, fontSize: 14, color: colors.textMuted },
  metaStrong: { color: colors.text, fontWeight: '700' },
  estimate: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: space(4), gap: space(1.5) },
  estimateHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(2) },
  estimateTitle: { ...type.eyebrow, color: colors.textMuted, flexShrink: 1 },
  estimateValue: { fontFamily, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  estimateSub: { ...type.body, color: colors.text, fontWeight: '600' },
  estimateNote: { ...type.small, color: colors.textMuted },
  inBudget: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), marginTop: space(1) },
  inBudgetText: { ...type.small, color: colors.success, fontWeight: '700' },
  providers: { gap: space(2.5) },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    padding: space(3.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', textDecorationLine: 'none' } : null),
  },
  providerHover: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  providerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  providerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  providerName: { fontFamily, fontSize: 16, fontWeight: '800', color: colors.text },
  providerDesc: { ...type.small, color: colors.textMuted },
  providerCta: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), marginLeft: 'auto' },
  providerCtaText: { fontFamily, fontSize: 14, fontWeight: '800', color: colors.primary },
  tips: { gap: space(1.5), borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space(4) },
  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  tipsTitle: { fontFamily, fontSize: 15, fontWeight: '800', color: colors.text },
  tipLine: { fontSize: 14 },
});
