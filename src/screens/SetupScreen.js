import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useI18n } from '../i18n';
import { COUNTRIES, sortedCountries } from '../data/countries';
import { CURRENCIES } from '../data/currencies';
import { MAX_TRAVELLERS, parsePositiveInt } from '../lib/validation';
import { addDays, todayISO } from '../lib/dates';
import { colors, fontFamily, radius, space } from '../theme';
import { Button, Card, ErrorText, Field, H1, Input, Notice, P, Segmented, Touchable } from '../components/ui';
import { SelectModal } from '../components/SelectModal';
import { DateField } from '../components/DateField';

export function SetupScreen({ state, dispatch, derived, onContinue }) {
  const { t, tp, lang } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
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

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <H1>{t('setup.title')}</H1>
        <P muted style={{ marginTop: space(1) }}>
          {t('setup.subtitle')}
        </P>
      </View>

      <Card>
        <View style={[styles.grid, wide && styles.gridWide]}>
          <Field label={t('setup.origin')} hint={t('setup.originHint')} error={err('origin')} style={wide ? styles.col : null}>
            <SelectModal
              label={t('setup.origin')}
              value={setup.origin}
              options={countryOptions}
              onChange={(v) => set({ origin: v })}
              searchable
              error={err('origin')}
            />
          </Field>

          <Field label={t('setup.travellers')} hint={t('setup.travellersHint')} error={err('travellers')} style={wide ? styles.col : null}>
            <View style={styles.stepper}>
              <Touchable
                accessibilityRole="button"
                accessibilityLabel={t('setup.decrease')}
                onPress={() => changePeople(-1)}
                disabled={(people || 1) <= 1}
                style={[styles.stepBtn, (people || 1) <= 1 && { opacity: 0.4 }]}
              >
                <Text style={styles.stepText}>−</Text>
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
                style={styles.stepBtn}
              >
                <Text style={styles.stepText}>+</Text>
              </Touchable>
            </View>
          </Field>
        </View>

        <Field label={t('setup.dates')}>
          <Segmented
            label={t('setup.dates')}
            value={setup.dateMode}
            onChange={(v) => set({ dateMode: v })}
            options={[
              { value: 'exact', label: t('setup.exact') },
              { value: 'flexible', label: t('setup.flexible') },
            ]}
          />
        </Field>

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
          <Notice tone="info" icon="ℹ">
            {exact ? t('setup.exactInfo', { days: tp('plural.days', span) }) : t('setup.flexibleInfo', { days: tp('plural.days', span) })}
          </Notice>
        ) : null}

        <View style={[styles.grid, wide && styles.gridWide, { marginTop: space(4) }]}>
          <Field label={t('setup.currency')} style={wide ? styles.col : null}>
            <SelectModal
              label={t('setup.currency')}
              value={setup.currency}
              options={currencyOptions}
              onChange={(code) => dispatch({ type: 'currency', code })}
            />
          </Field>
          <Field label={t('setup.rate')} hint={t('setup.rateHint')} error={err('rate')} style={wide ? styles.col : null}>
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
        </View>
        <Notice tone="warning" icon="€">
          {t('setup.budgetNote')}
        </Notice>
      </Card>

      {showErrors && !derived.setupCheck.valid ? <ErrorText>{t('setup.fixErrors')}</ErrorText> : null}
      <Button label={`${t('setup.continue')} →`} onPress={continueNext} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(4) },
  intro: { marginTop: space(2) },
  grid: { flexDirection: 'column' },
  gridWide: { flexDirection: 'row', gap: space(4) },
  col: { flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontFamily, fontSize: 24, fontWeight: '800', color: colors.primaryDark },
  stepInput: { flex: 1, minWidth: 0, width: '100%', textAlign: 'center', fontSize: 18, fontWeight: '700' },
  cta: { alignSelf: 'stretch' },
});
