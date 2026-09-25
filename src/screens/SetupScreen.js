import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n';
import { COUNTRIES, sortedCountries } from '../data/countries';
import { CURRENCIES } from '../data/currencies';
import { MAX_TRAVELLERS, parsePositiveInt } from '../lib/validation';
import { addDays, todayISO } from '../lib/dates';
import { colors, fontFamily, radius, space, type } from '../theme';
import { Button, Card, ErrorText, Field, H3, Input, Notice, SectionHeader, Segmented, Touchable } from '../components/ui';
import { Icon } from '../components/Icon';
import { Reveal, useBreakpoint } from '../components/motion';
import { SelectModal } from '../components/SelectModal';
import { DateField } from '../components/DateField';

export function SetupScreen({ state, dispatch, derived, onContinue }) {
  const { t, tp, lang } = useI18n();
  const { isPhone, isDesktop } = useBreakpoint();
  const wide = !isPhone;
  const [showErrors, setShowErrors] = useState(false);
  const { setup } = state;
  const errors = derived.setupCheck.errors;
  const [touched, setTouched] = useState({});
  const err = (field) => ((showErrors || touched[field]) && errors[field] ? t(errors[field].key, errors[field].params) : null);
  const set = (patch) => {
    setTouched((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(patch).map((k) => [k, true])) }));
    dispatch({ type: 'setup', patch });
  };
  const today = todayISO();

  const countryOptions = useMemo(
    () => sortedCountries(lang, COUNTRIES).map((c) => ({ value: c.code, label: c.names[lang] || c.names.en, searchText: `${c.names.en} ${c.code}` })),
    [lang],
  );
  const currencyOptions = CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${t(`currency.${c.code}`)}`, detail: c.symbol }));

  const people = parsePositiveInt(setup.travellers);
  const changePeople = (delta) => {
    const next = Math.min(MAX_TRAVELLERS, Math.max(1, (people || 1) + delta));
    set({ travellers: String(next) });
  };

  const continueNext = () => {
    setShowErrors(true);
    if (derived.setupCheck.valid) onContinue();
  };

  const span = derived.span;
  const exact = setup.dateMode === 'exact';

  const cardTitle = (icon, title) => (
    <View style={styles.cardTitle}>
      <View style={styles.cardIcon}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <H3>{title}</H3>
    </View>
  );

  const routeCard = (
    <Card style={styles.card}>
      {cardTitle('pin', t('setup.groupRoute'))}
      <Field label={t('setup.origin')} hint={t('setup.originHint')} error={err('origin')}>
        <SelectModal
          label={t('setup.origin')}
          value={setup.origin}
          options={countryOptions}
          onChange={(v) => set({ origin: v })}
          searchable
          error={err('origin')}
        />
      </Field>
      <Field label={t('setup.travellers')} hint={t('setup.travellersHint')} error={err('travellers')} style={{ marginBottom: 0 }}>
        <View style={styles.stepper}>
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={t('setup.decrease')}
            onPress={() => changePeople(-1)}
            disabled={(people || 1) <= 1}
            style={({ hovered }) => [styles.stepBtn, hovered && styles.stepBtnHover, (people || 1) <= 1 && { opacity: 0.4 }]}
          >
            <Icon name="minus" size={20} color={colors.primaryDark} strokeWidth={2.6} />
          </Touchable>
          <Input
            value={setup.travellers}
            onChangeText={(v) => set({ travellers: v.replace(/[^\d]/g, '').slice(0, 3) })}
            keyboardType="number-pad"
            inputMode="numeric"
            label={t('setup.travellers')}
            error={err('travellers')}
            style={styles.stepInput}
            textAlign="center"
            maxLength={3}
          />
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={t('setup.increase')}
            onPress={() => changePeople(1)}
            style={({ hovered }) => [styles.stepBtn, hovered && styles.stepBtnHover]}
          >
            <Icon name="plus" size={20} color={colors.primaryDark} strokeWidth={2.6} />
          </Touchable>
        </View>
      </Field>
    </Card>
  );

  const datesCard = (
    <Card style={styles.card}>
      {cardTitle('calendar', t('setup.dates'))}
      <Segmented
        label={t('setup.dates')}
        value={setup.dateMode}
        onChange={(v) => set({ dateMode: v })}
        options={[
          { value: 'exact', label: t('setup.exact'), icon: 'calendar' },
          { value: 'flexible', label: t('setup.flexible'), icon: 'sliders' },
        ]}
      />
      <View style={[styles.grid, wide && styles.gridWide]}>
        <Field label={exact ? t('setup.start') : t('setup.windowStart')} error={err(exact ? 'startDate' : 'windowStart')} style={wide ? styles.col : null}>
          <DateField
            nativeID={exact ? 'startDate' : 'windowStart'}
            label={exact ? t('setup.start') : t('setup.windowStart')}
            value={exact ? setup.startDate : setup.windowStart}
            min={today}
            error={err(exact ? 'startDate' : 'windowStart')}
            onChange={(v) => {
              if (exact) {
                const patch = { startDate: v };
                if (setup.endDate && v && setup.endDate < v) patch.endDate = addDays(v, 6);
                set(patch);
              } else {
                const patch = { windowStart: v };
                if (setup.windowEnd && v && setup.windowEnd < v) patch.windowEnd = addDays(v, 13);
                set(patch);
              }
            }}
          />
        </Field>
        <Field label={exact ? t('setup.end') : t('setup.windowEnd')} error={err(exact ? 'endDate' : 'windowEnd')} style={wide ? styles.col : null}>
          <DateField
            nativeID={exact ? 'endDate' : 'windowEnd'}
            label={exact ? t('setup.end') : t('setup.windowEnd')}
            value={exact ? setup.endDate : setup.windowEnd}
            min={(exact ? setup.startDate : setup.windowStart) || today}
            error={err(exact ? 'endDate' : 'windowEnd')}
            onChange={(v) => set(exact ? { endDate: v } : { windowEnd: v })}
          />
        </Field>
      </View>
      {span && !errors.startDate && !errors.endDate && !errors.windowStart && !errors.windowEnd ? (
        <Notice tone="info" icon={exact ? 'calendar' : 'sliders'}>
          {exact ? t('setup.exactInfo', { days: tp('plural.days', span) }) : t('setup.flexibleInfo', { days: tp('plural.days', span) })}
        </Notice>
      ) : null}
    </Card>
  );

  const budgetCard = (
    <Card style={styles.card}>
      {cardTitle('wallet', t('setup.budgetTitle'))}
      <Field label={t('setup.currency')}>
        <SelectModal label={t('setup.currency')} value={setup.currency} options={currencyOptions} onChange={(code) => dispatch({ type: 'currency', code })} />
      </Field>
      <Field label={t('setup.rate')} hint={t('setup.rateHint')} error={err('rate')}>
        <Input
          value={setup.rate}
          onChangeText={(v) => set({ rate: v.replace(/[^\d.,]/g, '') })}
          keyboardType="decimal-pad"
          inputMode="decimal"
          label={t('setup.rate')}
          editable={setup.currency !== 'EUR'}
          error={err('rate')}
          style={setup.currency === 'EUR' ? { backgroundColor: colors.surfaceAlt, color: colors.textMuted } : null}
        />
      </Field>
      <Notice tone="accent" icon="users">
        {t('setup.budgetNote')}
      </Notice>
    </Card>
  );

  return (
    <View style={styles.wrap}>
      <Reveal>
        <SectionHeader level={1} eyebrow={t('nav.stepOf', { n: 1, total: 3 })} title={t('setup.title')} lead={t('setup.subtitle')} />
      </Reveal>
      <View style={[styles.cols, isDesktop && styles.colsWide]}>
        <View style={[styles.stack, isDesktop && { flex: 1 }]}>
          <Reveal>{routeCard}</Reveal>
          <Reveal delay={90}>{budgetCard}</Reveal>
        </View>
        <Reveal delay={isDesktop ? 60 : 180} style={isDesktop ? { flex: 1.2 } : null}>
          {datesCard}
        </Reveal>
      </View>
      {showErrors && !derived.setupCheck.valid ? <ErrorText>{t('setup.fixErrors')}</ErrorText> : null}
      <Reveal style={styles.ctaRow}>
        <Button large label={t('setup.continue')} iconRight="arrowRight" onPress={continueNext} style={!wide ? { alignSelf: 'stretch' } : null} />
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(6) },
  cols: { gap: space(5) },
  colsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  stack: { gap: space(5) },
  card: { gap: space(4) },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(1) },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'column' },
  gridWide: { flexDirection: 'row', gap: space(4) },
  col: { flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  stepBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnHover: { backgroundColor: '#c9e3e8' },
  stepInput: { flex: 1, minWidth: 0, width: '100%', textAlign: 'center', ...type.h2, fontFamily },
  ctaRow: { alignItems: 'flex-end' },
});
