import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useI18n } from '../i18n';
import { COUNTRIES, sortedCountries } from '../data/countries';
import { formatDate, formatMoney } from '../lib/format';
import { parsePositiveInt, parsePositiveNumber } from '../lib/validation';
import { STYLE_KEYS } from '../state/store';
import { colors, space } from '../theme';
import { Button, Chip, ErrorText, Field, H1, Input, Notice, P, SwitchRow } from '../components/ui';
import { SelectModal } from '../components/SelectModal';
import { WheelCard } from '../components/WheelCard';

function useSyncedText(value) {
  const [text, setText] = useState(value != null ? String(value) : '');
  useEffect(() => {
    setText((prev) => {
      const parsed = parsePositiveNumber(prev);
      return parsed === value ? prev : value != null ? String(value) : '';
    });
  }, [value]);
  return [text, setText];
}

export function WheelsScreen({ state, dispatch, derived, onShowPlan, onBack }) {
  const { t, tp, lang } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const wheelSize = Math.max(220, Math.min(wide ? 300 : 320, (wide ? width / 2 : width) - 96));
  const { selection, setup } = state;
  const currency = setup.currency;
  const select = (patch) => dispatch({ type: 'select', patch });
  const errText = (e) => (e ? t(e.key, e.params) : null);

  // ---- destination --------------------------------------------------------
  const destOptions = useMemo(
    () =>
      sortedCountries(lang, COUNTRIES.filter((c) => derived.destinations.includes(c.code))).map((c) => ({
        value: c.code,
        label: c.names[lang] || c.names.en,
        short: c.code,
      })),
    [derived.destinations, lang],
  );
  const poolOptions = useMemo(
    () =>
      sortedCountries(lang, COUNTRIES.filter((c) => derived.destinationPool.includes(c.code))).map((c) => ({
        value: c.code,
        label: c.names[lang] || c.names.en,
        searchText: `${c.names.en} ${c.code}`,
      })),
    [derived.destinationPool, lang],
  );
  const [countryQuery, setCountryQuery] = useState('');
  const excluded = state.destSettings.excluded;
  const toggleCountry = (code) =>
    dispatch({
      type: 'destSettings',
      patch: { excluded: excluded.includes(code) ? excluded.filter((c) => c !== code) : [...excluded, code] },
    });
  const visiblePool = poolOptions.filter((o) => `${o.label} ${o.searchText}`.toLowerCase().includes(countryQuery.trim().toLowerCase()));
  const destTooFew = destOptions.length < 2;

  // ---- duration -------------------------------------------------------------
  const exact = setup.dateMode === 'exact';
  const durValues = derived.duration.values;
  const durOptions = durValues.map((d) => ({ value: d, label: tp('plural.days', d), short: String(d) }));
  const [durText, setDurText] = useSyncedText(exact ? derived.span : selection.duration);

  // ---- budget --------------------------------------------------------------
  const budgetValues = derived.budget.values;
  const budgetOptions = budgetValues.map((b) => ({ value: b, label: formatMoney(b, currency, lang), short: String(b) }));
  const [budgetText, setBudgetText] = useSyncedText(selection.budget);

  // ---- style ---------------------------------------------------------------
  const styleOn = state.styleSettings.enabled;
  const styleOptions = derived.styles.map((k) => ({ value: k, label: t(`styles.${k}`) }));
  const toggleStyle = (k) => {
    const opts = state.styleSettings.options;
    dispatch({ type: 'styleSettings', patch: { options: opts.includes(k) ? opts.filter((x) => x !== k) : STYLE_KEYS.filter((x) => x === k || opts.includes(x)) } });
  };

  const missingLabels = derived.missing.map((m) =>
    m === 'destination' ? t('wheel.destination.title') : m === 'duration' ? t('wheel.duration.title') : t('wheel.budget.title'),
  );
  const canPlan = derived.trip != null;

  const cardStyle = wide ? styles.half : null;

  return (
    <View style={styles.wrap}>
      <View>
        <H1>{t('wheels.title')}</H1>
        <P muted style={{ marginTop: space(1) }}>
          {t('wheels.subtitle')} {t('wheels.tapHint')}
        </P>
      </View>
      <Button
        variant="accent"
        icon="✦"
        label={t('wheels.spinAll')}
        onPress={() => dispatch({ type: 'spinAll' })}
        style={styles.spinAll}
      />

      <View style={[styles.grid, wide && styles.gridWide]}>
        {/* 1. Destination */}
        <WheelCard
          style={cardStyle}
          size={wheelSize}
          title={t('wheel.destination.title')}
          options={destOptions}
          selectedIndex={destOptions.findIndex((o) => o.value === selection.destination)}
          onSelect={(i) => destOptions[i] && select({ destination: destOptions[i].value })}
          spinSignal={state.spinCount}
          countText={t('wheel.destination.count', { count: destOptions.length, total: poolOptions.length })}
          error={destTooFew ? t('wheel.destination.tooFew') : null}
          manual={
            <SelectModal
              label={t('wheel.destination.title')}
              value={selection.destination}
              options={poolOptions}
              onChange={(v) => select({ destination: v })}
              searchable
            />
          }
          settings={
            <>
              <P muted style={{ fontSize: 13 }}>{t('wheel.destination.intro')}</P>
              <View style={styles.row}>
                <Button small variant="secondary" label={t('wheel.destination.includeAll')} onPress={() => dispatch({ type: 'destSettings', patch: { excluded: [] } })} />
                <Button small variant="secondary" label={t('wheel.destination.excludeAll')} onPress={() => dispatch({ type: 'destSettings', patch: { excluded: poolOptions.map((o) => o.value) } })} />
              </View>
              {styleOn ? (
                <SwitchRow
                  label={t('wheel.destination.byStyle')}
                  value={state.destSettings.byStyle}
                  onValueChange={(v) => dispatch({ type: 'destSettings', patch: { byStyle: v } })}
                />
              ) : null}
              <Input value={countryQuery} onChangeText={setCountryQuery} placeholder={t('wheel.destination.searchPlaceholder')} label={t('wheel.destination.searchPlaceholder')} />
              <ScrollView style={styles.chipBox} contentContainerStyle={styles.chips} nestedScrollEnabled>
                {visiblePool.map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    selected={!excluded.includes(o.value)}
                    accessibilityLabel={t('wheel.destination.include', { name: o.label })}
                    onPress={() => toggleCountry(o.value)}
                  />
                ))}
                {visiblePool.length === 0 ? <P muted>{t('common.noMatches')}</P> : null}
              </ScrollView>
            </>
          }
        />

        {/* 2. Duration */}
        <WheelCard
          style={cardStyle}
          size={wheelSize}
          title={t('wheel.duration.title')}
          options={exact ? [] : durOptions}
          disabled={exact}
          headerExtra={
            exact ? (
              <>
                <Text style={styles.lockedValue}>{tp('plural.days', derived.span || 0)}</Text>
                <Notice tone="info" icon="🔒">{t('wheel.duration.locked', { days: tp('plural.days', derived.span || 0) })}</Notice>
                <Button small variant="secondary" label={t('setup.flexible')} onPress={() => dispatch({ type: 'setup', patch: { dateMode: 'flexible' } })} style={{ alignSelf: 'flex-start' }} />
              </>
            ) : null
          }
          selectedIndex={durValues.indexOf(selection.duration)}
          onSelect={(i) => durValues[i] != null && select({ duration: durValues[i] })}
          spinSignal={exact ? 0 : state.spinCount}
          error={errText(derived.duration.error)}
          note={derived.duration.trimmed ? t('wheel.duration.trimmed', { days: tp('plural.days', derived.span) }) : null}
          manual={
            <Field error={errText(derived.tripErrors.duration)} style={{ marginBottom: 0 }}>
              <Input
                value={durText}
                onChangeText={(v) => {
                  const clean = v.replace(/[^\d]/g, '').slice(0, 3);
                  setDurText(clean);
                  select({ duration: parsePositiveInt(clean) });
                }}
                keyboardType="number-pad"
                inputMode="numeric"
                label={t('wheel.duration.title')}
                placeholder={t('wheel.duration.title')}
                error={derived.tripErrors.duration}
              />
            </Field>
          }
          settings={
            <View style={styles.row3}>
              {['min', 'max', 'step'].map((k) => (
                <Field key={k} label={t(`wheel.duration.${k}`)} style={styles.flex}>
                  <Input
                    value={String(state.durationSettings[k])}
                    onChangeText={(v) => dispatch({ type: 'durationSettings', patch: { [k]: v.replace(/[^\d]/g, '').slice(0, 3) } })}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    label={t(`wheel.duration.${k}`)}
                  />
                </Field>
              ))}
            </View>
          }
        />

        {/* 3. Budget */}
        <WheelCard
          style={cardStyle}
          size={wheelSize}
          title={t('wheel.budget.title')}
          badge={currency}
          options={budgetOptions}
          selectedIndex={budgetValues.indexOf(selection.budget)}
          onSelect={(i) => budgetValues[i] != null && select({ budget: budgetValues[i] })}
          spinSignal={state.spinCount}
          error={errText(derived.budget.error)}
          note={t('wheel.budget.totalFor', { people: tp('plural.travellers', derived.travellers || 1) })}
          manual={
            <Field error={errText(derived.tripErrors.budget)} style={{ marginBottom: 0 }}>
              <Input
                value={budgetText}
                onChangeText={(v) => {
                  const clean = v.replace(/[^\d.,]/g, '').slice(0, 9);
                  setBudgetText(clean);
                  select({ budget: parsePositiveNumber(clean) });
                }}
                keyboardType="decimal-pad"
                inputMode="decimal"
                label={`${t('wheel.budget.title')} (${currency})`}
                placeholder={`${t('wheel.budget.title')} (${currency})`}
              />
            </Field>
          }
          settings={
            <View style={styles.row3}>
              {['min', 'max', 'step'].map((k) => (
                <Field key={k} label={`${t(`wheel.budget.${k}`)} (${currency})`} style={styles.flex}>
                  <Input
                    value={String(state.budgetSettings[k])}
                    onChangeText={(v) => dispatch({ type: 'budgetSettings', patch: { [k]: v.replace(/[^\d.,]/g, '').slice(0, 9) } })}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    label={`${t(`wheel.budget.${k}`)} (${currency})`}
                  />
                </Field>
              ))}
            </View>
          }
        />

        {/* 4. Holiday style (optional) */}
        <WheelCard
          style={cardStyle}
          size={wheelSize}
          title={t('wheel.style.title')}
          badge={t('common.optional')}
          options={styleOptions}
          disabled={!styleOn}
          headerExtra={
            <SwitchRow
              label={t('wheel.style.enable')}
              description={styleOn ? null : t('wheel.style.disabled')}
              value={styleOn}
              onValueChange={(v) => dispatch({ type: 'styleSettings', patch: { enabled: v } })}
            />
          }
          selectedIndex={derived.styles.indexOf(selection.style)}
          onSelect={(i) => derived.styles[i] && select({ style: derived.styles[i] })}
          spinSignal={styleOn ? state.spinCount : 0}
          error={styleOn && styleOptions.length < 2 ? t('wheel.style.tooFew') : null}
          manual={
            <SelectModal
              label={t('wheel.style.title')}
              value={selection.style}
              options={STYLE_KEYS.map((k) => ({ value: k, label: t(`styles.${k}`) }))}
              onChange={(v) => select({ style: v })}
            />
          }
          settings={
            <>
              <P muted style={{ fontSize: 13 }}>{t('wheel.style.intro')}</P>
              <View style={styles.chips}>
                {STYLE_KEYS.map((k) => (
                  <Chip key={k} label={t(`styles.${k}`)} selected={state.styleSettings.options.includes(k)} onPress={() => toggleStyle(k)} />
                ))}
              </View>
            </>
          }
        />
      </View>

      {!canPlan && derived.missing.length ? (
        <P muted style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
          {t('wheels.missing', { list: missingLabels.join(', ') })}
        </P>
      ) : null}
      {derived.tripErrors.tripStart ? (
        <ErrorText>
          {t(derived.tripErrors.tripStart.key, {
            from: formatDate(derived.tripErrors.tripStart.params.from, lang),
            to: formatDate(derived.tripErrors.tripStart.params.to, lang),
          })}
        </ErrorText>
      ) : null}
      <View style={[styles.row, styles.navRow]}>
        <Button variant="secondary" label={`← ${t('nav.back')}`} onPress={onBack} />
        <Button label={`${t('wheels.toPlan')} →`} onPress={onShowPlan} disabled={!canPlan} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(4) },
  spinAll: { alignSelf: 'stretch' },
  grid: { gap: space(4) },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { flexBasis: '48%', flexGrow: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  row3: { flexDirection: 'row', gap: space(2) },
  flex: { flex: 1 },
  chipBox: { maxHeight: 240, borderRadius: 12, backgroundColor: colors.surface, padding: space(2) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  navRow: { flexWrap: 'nowrap' },
  lockedValue: { fontSize: 34, fontWeight: '800', color: colors.primaryDark, textAlign: 'center', marginVertical: space(4) },
});
