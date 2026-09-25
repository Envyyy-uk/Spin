import React, { useMemo, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { COUNTRIES, countryName, sortedCountries } from '../data/countries';
import { formatDate, formatMoney } from '../lib/format';
import { parsePositiveInt, parsePositiveNumber } from '../lib/validation';
import { STYLE_KEYS } from '../state/store';
import { colors, fontFamily, maxContentWidth, radius, shadowRaised, space } from '../theme';
import { Button, Chip, ErrorText, Field, Input, Notice, P, SectionHeader, SwitchRow } from '../components/ui';
import { Icon } from '../components/Icon';
import { Reveal, useBreakpoint, usePop } from '../components/motion';
import { SelectModal } from '../components/SelectModal';
import { WheelCard } from '../components/WheelCard';

/** Text for a numeric input that follows external changes (e.g. a wheel spin) without clobbering typing. */
function useSyncedText(value) {
  const [text, setText] = useState(value != null ? String(value) : '');
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (parsePositiveNumber(text) !== value) setText(value != null ? String(value) : '');
  }
  return [text, setText];
}

export function WheelsScreen({ state, dispatch, derived }) {
  const { t, tp, lang } = useI18n();
  const { width, isPhone } = useBreakpoint();
  const wide = !isPhone;
  const containerW = Math.min(width - 32, maxContentWidth);
  const colW = wide ? (containerW - 20) / 2 : containerW;
  const wheelSize = Math.round(Math.max(210, Math.min(340, colW - 64)));
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

  const cardStyle = wide ? styles.half : null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.intro, wide && styles.introWide]}>
        <SectionHeader level={1} eyebrow={t('nav.stepOf', { n: 2, total: 3 })} title={t('wheels.title')} lead={`${t('wheels.subtitle')} ${t('wheels.tapHint')}`} style={{ flex: 1 }} />
        <Button large variant="accent" icon="sparkle" label={t('wheels.spinAll')} onPress={() => dispatch({ type: 'spinAll' })} style={!wide ? { alignSelf: 'stretch' } : null} />
      </View>

      <View style={[styles.grid, wide && styles.gridWide]}>
        {/* 1. Destination */}
        <Reveal style={cardStyle}>
        <WheelCard
          style={styles.fill}
          icon="globe"
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

        </Reveal>

        {/* 2. Duration */}
        <Reveal style={cardStyle} delay={wide ? 100 : 0}>
        <WheelCard
          style={styles.fill}
          icon="calendar"
          size={wheelSize}
          title={t('wheel.duration.title')}
          options={exact ? [] : durOptions}
          disabled={exact}
          headerExtra={
            exact ? (
              <>
                <Text style={styles.lockedValue}>{tp('plural.days', derived.span || 0)}</Text>
                <Notice tone="info" icon="lock">{t('wheel.duration.locked', { days: tp('plural.days', derived.span || 0) })}</Notice>
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

        </Reveal>

        {/* 3. Budget */}
        <Reveal style={cardStyle}>
        <WheelCard
          style={styles.fill}
          icon="wallet"
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

        </Reveal>

        {/* 4. Holiday style (optional) */}
        <Reveal style={cardStyle} delay={wide ? 100 : 0}>
        <WheelCard
          style={styles.fill}
          icon="sparkle"
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
                  <Chip key={k} icon={k} label={t(`styles.${k}`)} selected={state.styleSettings.options.includes(k)} onPress={() => toggleStyle(k)} />
                ))}
              </View>
            </>
          }
        />
        </Reveal>
      </View>
      {derived.tripErrors.tripStart ? (
        <ErrorText>
          {t(derived.tripErrors.tripStart.key, {
            from: formatDate(derived.tripErrors.tripStart.params.from, lang),
            to: formatDate(derived.tripErrors.tripStart.params.to, lang),
          })}
        </ErrorText>
      ) : null}
    </View>
  );
}

function TrayPill({ icon, label, value }) {
  const scale = usePop(value);
  const empty = value == null;
  return (
    <Animated.View style={[styles.pill, empty && styles.pillEmpty, { transform: [{ scale }] }]} accessible accessibilityLabel={`${label}: ${empty ? '—' : value}`}>
      <Icon name={icon} size={16} color={empty ? colors.textMuted : colors.primary} />
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.pillLabel} numberOfLines={1}>{label}</Text>
        <Text style={[styles.pillValue, empty && { color: colors.textMuted }]} numberOfLines={1}>{empty ? '—' : value}</Text>
      </View>
    </Animated.View>
  );
}

/** Sticky bottom bar on the wheels step: live selection + navigation. */
export function WheelsFooter({ state, derived, onBack, onShowPlan }) {
  const { t, tp, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { isPhone } = useBreakpoint();
  const { selection, setup } = state;
  const canPlan = derived.trip != null;
  const missingLabels = derived.missing.map((m) =>
    m === 'destination' ? t('wheel.destination.title') : m === 'duration' ? t('wheel.duration.title') : t('wheel.budget.title'),
  );
  const pills = [
    { key: 'destination', icon: 'globe', label: t('result.destination'), value: selection.destination ? countryName(selection.destination, lang) : null },
    { key: 'duration', icon: 'calendar', label: t('result.duration'), value: derived.days ? tp('plural.days', derived.days) : null },
    { key: 'budget', icon: 'wallet', label: t('result.budget'), value: selection.budget > 0 ? formatMoney(selection.budget, setup.currency, lang) : null },
  ];
  if (state.styleSettings.enabled) {
    pills.push({ key: 'style', icon: selection.style || 'sparkle', label: t('result.style'), value: selection.style ? t(`styles.${selection.style}`) : null });
  }
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space(3)) }]} accessibilityRole={Platform.OS === 'web' ? 'region' : undefined} aria-label={t('wheels.trayTitle')}>
      <View style={[styles.footerInner, !isPhone && styles.footerInnerWide]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tray} style={{ flexGrow: 1, flexShrink: 1 }}>
          {pills.map((p) => (
            <TrayPill key={p.key} icon={p.icon} label={p.label} value={p.value} />
          ))}
        </ScrollView>
        <View style={styles.footerActions}>
          <Button variant="secondary" icon="arrowLeft" label={isPhone ? '' : t('nav.back')} accessibilityLabel={t('nav.back')} onPress={onBack} style={isPhone ? styles.iconOnly : null} />
          <Button label={t('wheels.toPlan')} iconRight="arrowRight" onPress={onShowPlan} disabled={!canPlan} style={isPhone ? { flex: 1 } : null} />
        </View>
      </View>
      {!canPlan && missingLabels.length ? (
        <Text style={styles.missing} accessibilityLiveRegion="polite" aria-live="polite">
          {t('wheels.missing', { list: missingLabels.join(', ') })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(6) },
  intro: { gap: space(4) },
  introWide: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  grid: { gap: space(5) },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { flexBasis: '47%', flexGrow: 1 },
  fill: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  row3: { flexDirection: 'row', gap: space(2) },
  flex: { flex: 1 },
  chipBox: { maxHeight: 240, borderRadius: 12, backgroundColor: colors.surface, padding: space(2) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space(3),
    paddingHorizontal: space(4),
    ...shadowRaised,
  },
  footerInner: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', gap: space(3) },
  footerInnerWide: { flexDirection: 'row', alignItems: 'center' },
  footerActions: { flexDirection: 'row', gap: space(2), alignItems: 'center' },
  iconOnly: { paddingHorizontal: space(3.5), minWidth: 48 },
  tray: { gap: space(2), paddingRight: space(2) },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space(2), paddingHorizontal: space(3), paddingVertical: space(1.5), borderRadius: radius.md, backgroundColor: colors.primarySoft, maxWidth: 220 },
  pillEmpty: { backgroundColor: colors.surfaceAlt },
  pillLabel: { fontFamily, fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  pillValue: { fontFamily, fontSize: 14, fontWeight: '800', color: colors.text },
  missing: { fontFamily, fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: space(2), width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  lockedValue: { fontFamily, fontSize: 44, fontWeight: '800', letterSpacing: -1, color: colors.primaryDark, textAlign: 'center', marginVertical: space(6) },
});
