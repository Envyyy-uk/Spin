import React, { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { COUNTRIES, countryName, sortedCountries } from '../data/countries';
import { todayISO } from '../lib/dates';
import { formatMoney } from '../lib/format';
import { MAX_TRAVELLERS, parsePositiveInt, validateSetup } from '../lib/validation';
import { ROULETTE_CONTRIBUTIONS, ROULETTE_DAYS, isChallengeAmount, rouletteDestinations } from '../lib/roulette';
import { colors, fontFamily, maxContentWidth, radius, shadowRaised, space, type } from '../theme';
import { Badge, Button, Card, ErrorText, Eyebrow, Field, Input, Notice, SectionHeader, Touchable } from '../components/ui';
import { Icon } from '../components/Icon';
import { SelectModal } from '../components/SelectModal';
import { CitySelect } from '../components/CitySelect';
import { DateField } from '../components/DateField';
import { WheelCard } from '../components/WheelCard';
import { ChallengeCard } from '../components/ChallengeCard';
import { Reveal, useBreakpoint, usePop } from '../components/motion';

// Challenge sectors get a warm coral tint (still 4.5:1 with ink text).
const CHALLENGE_COLOR = '#f7a58f';

export function RouletteScreen({ state, dispatch, onOpenPlan }) {
  const { t, tp, lang } = useI18n();
  const { width, isPhone, isDesktop } = useBreakpoint();
  const today = todayISO();
  const r = state.roulette;
  const set = (patch) => dispatch({ type: 'roulette', patch });

  // ---- start point ------------------------------------------------------------
  const { errors } = validateSetup(
    { origin: r.origin, dateMode: 'exact', startDate: r.startDate, endDate: r.startDate, travellers: r.travellers, rate: '1' },
    today,
  );
  const [showErrors, setShowErrors] = useState(false);
  const err = (f) => (showErrors && errors[f] ? t(errors[f].key, errors[f].params) : null);
  const startValid = Object.keys(errors).length === 0;
  const people = parsePositiveInt(r.travellers) || 1;
  const countryOptions = useMemo(
    () => sortedCountries(lang, COUNTRIES).map((c) => ({ value: c.code, label: c.names[lang] || c.names.en, searchText: `${c.names.en} ${c.code}` })),
    [lang],
  );

  // ---- wheels -------------------------------------------------------------------
  const dayOptions = ROULETTE_DAYS.map((d) => ({ value: d, label: tp('plural.days', d), short: String(d) }));
  const moneyOptions = ROULETTE_CONTRIBUTIONS.map((v) => ({
    value: v,
    label: `${formatMoney(v, 'EUR', lang)}${isChallengeAmount(v) ? ' ⚡' : ''}`,
    short: String(v),
    color: isChallengeAmount(v) ? CHALLENGE_COLOR : undefined,
  }));

  const ready = startValid && r.days != null && r.contribution != null;
  // ~60 cheap estimates; fast enough to compute on every render.
  const dest = ready
    ? rouletteDestinations({ origin: r.origin, originCity: r.originCity, startDate: r.startDate, days: r.days, travellers: people, contribution: r.contribution, today })
    : null;
  const destOptions = dest
    ? sortedCountries(lang, COUNTRIES.filter((c) => dest.codes.includes(c.code))).map((c) => ({ value: c.code, label: c.names[lang] || c.names.en, short: c.code }))
    : [];

  // Spin signals: "Spin the roulette" runs days → money → destination in sequence.
  const [signals, setSignals] = useState({ days: 0, money: 0, dest: 0 });
  const sequence = useRef(false);
  const bump = (key) => setSignals((s) => ({ ...s, [key]: s[key] + 1 }));
  const spinAll = () => {
    setShowErrors(true);
    if (!startValid) return;
    sequence.current = true;
    bump('days');
  };

  const onDays = (i) => {
    set({ days: ROULETTE_DAYS[i] });
    if (sequence.current) bump('money');
  };
  const onMoney = (i) => {
    set({ contribution: ROULETTE_CONTRIBUTIONS[i] });
    if (sequence.current) bump('dest');
  };
  const onDest = (i) => {
    sequence.current = false;
    if (destOptions[i]) set({ destination: destOptions[i].value });
  };

  const containerW = Math.min(width - 32, maxContentWidth);
  const cols = isDesktop ? 3 : isPhone ? 1 : 2;
  const wheelSize = Math.round(Math.max(200, Math.min(300, (containerW - 20 * (cols - 1)) / cols - 64)));

  // ---- result ---------------------------------------------------------------------
  const done = ready && r.destination && dest && dest.codes.includes(r.destination);
  const cost = done ? dest.costs[r.destination] : 0;
  const pop = usePop(r.destination);

  return (
    <View style={styles.wrap}>
      <Reveal style={[styles.intro, !isPhone && styles.introWide]}>
        <SectionHeader level={1} eyebrow={t('roulette.eyebrow')} title={t('roulette.title')} lead={t('roulette.lead')} style={{ flex: 1 }} />
      </Reveal>

      <Reveal>
        <Card style={styles.start}>
          <View style={styles.startHead}>
            <Icon name="pin" size={20} color={colors.primary} />
            <Text style={styles.startTitle}>{t('roulette.startTitle')}</Text>
          </View>
          <View style={styles.startRow}>
            <Field label={t('setup.origin')} error={err('origin')} style={styles.startCol}>
              <SelectModal label={t('setup.origin')} value={r.origin} options={countryOptions} searchable onChange={(v) => set({ origin: v })} error={err('origin')} />
            </Field>
            <Field label={t('city.origin')} style={styles.startCol}>
              <CitySelect countryCode={r.origin} value={r.originCity} onChange={(v) => set({ originCity: v })} label={t('city.origin')} disabled={!r.origin} />
            </Field>
            <Field label={t('roulette.startDate')} error={err('startDate')} style={styles.startCol}>
              <DateField label={t('roulette.startDate')} value={r.startDate} min={today} error={err('startDate')} onChange={(v) => set({ startDate: v })} />
            </Field>
            <Field label={t('setup.travellers')} error={err('travellers')} style={styles.startColSmall}>
              <View style={styles.stepper}>
                <Touchable
                  accessibilityRole="button"
                  accessibilityLabel={t('setup.decrease')}
                  disabled={people <= 1}
                  onPress={() => set({ travellers: String(Math.max(1, people - 1)) })}
                  style={({ hovered }) => [styles.stepBtn, hovered && styles.stepBtnHover, people <= 1 && { opacity: 0.4 }]}
                >
                  <Icon name="minus" size={18} color={colors.primaryDark} strokeWidth={2.6} />
                </Touchable>
                <Input
                  value={r.travellers}
                  onChangeText={(v) => set({ travellers: v.replace(/[^\d]/g, '').slice(0, 2) })}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  label={t('setup.travellers')}
                  error={err('travellers')}
                  style={styles.stepInput}
                />
                <Touchable
                  accessibilityRole="button"
                  accessibilityLabel={t('setup.increase')}
                  onPress={() => set({ travellers: String(Math.min(MAX_TRAVELLERS, people + 1)) })}
                  style={({ hovered }) => [styles.stepBtn, hovered && styles.stepBtnHover]}
                >
                  <Icon name="plus" size={18} color={colors.primaryDark} strokeWidth={2.6} />
                </Touchable>
              </View>
            </Field>
          </View>
          <Button large variant="accent" icon="sparkle" label={t('roulette.spinAll')} onPress={spinAll} style={isPhone ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }} />
          {showErrors && !startValid ? <ErrorText>{t('setup.fixErrors')}</ErrorText> : null}
        </Card>
      </Reveal>

      <View style={[styles.grid, !isPhone && styles.gridWide]}>
        <Reveal style={cols > 1 ? { flexBasis: cols === 3 ? '30%' : '45%', flexGrow: 1 } : null}>
          <WheelCard
            style={styles.fill}
            icon="calendar"
            badge="1"
            size={wheelSize}
            title={t('roulette.step1')}
            options={dayOptions}
            selectedIndex={ROULETTE_DAYS.indexOf(r.days)}
            onSelect={onDays}
            spinSignal={signals.days}
            disabled={!startValid}
            headerExtra={!startValid ? <Notice tone="info" icon="pin">{t('roulette.fillStart')}</Notice> : null}
          />
        </Reveal>
        <Reveal delay={cols > 1 ? 80 : 0} style={cols > 1 ? { flexBasis: cols === 3 ? '30%' : '45%', flexGrow: 1 } : null}>
          <WheelCard
            style={styles.fill}
            icon="wallet"
            badge="2"
            size={wheelSize}
            title={t('roulette.step2')}
            options={moneyOptions}
            selectedIndex={ROULETTE_CONTRIBUTIONS.indexOf(r.contribution)}
            onSelect={onMoney}
            spinSignal={signals.money}
            disabled={!startValid}
            note={t('roulette.challengeSegments')}
            headerExtra={
              r.contribution != null ? (
                <View style={styles.potBox}>
                  <Text style={styles.potLabel}>{t('roulette.potLabel')}</Text>
                  <Text style={styles.potValue}>
                    {t('roulette.pot', {
                      amount: formatMoney(r.contribution, 'EUR', lang),
                      people: tp('plural.people', people),
                      total: formatMoney(r.contribution * people, 'EUR', lang),
                    })}
                  </Text>
                  <Text style={styles.potHint}>{t('roulette.potHint')}</Text>
                </View>
              ) : null
            }
          />
        </Reveal>
        <Reveal delay={cols > 2 ? 160 : 0} style={cols > 1 ? { flexBasis: cols === 3 ? '30%' : '45%', flexGrow: 1 } : null}>
          <WheelCard
            style={styles.fill}
            icon="globe"
            badge="3"
            size={wheelSize}
            title={t('roulette.step3')}
            options={destOptions}
            selectedIndex={destOptions.findIndex((o) => o.value === r.destination)}
            onSelect={onDest}
            spinSignal={signals.dest}
            // Stays mounted (empty until ready) so the sequence's spin signal is never missed.
            disabled={!startValid}
            emptyText={t('roulette.waitDest')}
            countText={
              dest ? (dest.noneFit ? t('roulette.challengeOnly', { count: dest.codes.length }) : t('roulette.feasible', { count: dest.codes.length })) : t('wheels.notSpun')
            }
          />
        </Reveal>
      </View>

      {done ? (
        <Animated.View style={{ transform: [{ scale: pop }], gap: space(5) }}>
          <Card style={styles.result} accessibilityLiveRegion="polite" aria-live="polite">
            <View style={styles.resultHead}>
              <Eyebrow color={colors.sun}>{t('roulette.resultTitle')}</Eyebrow>
              {dest.challenge ? <Badge label={t('roulette.challengeBadge')} tone="danger" icon="sparkle" /> : null}
            </View>
            <Text style={styles.resultLine} accessibilityRole="header" aria-level={2}>
              {t('roulette.resultLine', { days: tp('plural.days', r.days), country: countryName(r.destination, lang) })}
            </Text>
            <View style={styles.resultFacts}>
              <View style={styles.resultFact}>
                <Text style={styles.resultFactLabel}>{t('roulette.potLabel')}</Text>
                <Text style={styles.resultFactValue}>{formatMoney(dest.pot, 'EUR', lang)}</Text>
                <Text style={styles.resultFactSub}>
                  {formatMoney(r.contribution, 'EUR', lang)} × {tp('plural.people', people)}
                </Text>
              </View>
              <View style={styles.resultFact}>
                <Text style={styles.resultFactLabel}>{t('roulette.cheapest')}</Text>
                <Text style={styles.resultFactValue}>≈ {formatMoney(cost, 'EUR', lang)}</Text>
                <View style={styles.fitRow}>
                  <Icon name={cost <= dest.pot ? 'check' : 'x'} size={14} color={cost <= dest.pot ? '#7fe0a6' : '#ffb4a2'} strokeWidth={2.8} />
                  <Text style={[styles.resultFactSub, { color: cost <= dest.pot ? '#7fe0a6' : '#ffb4a2' }]}>
                    {cost <= dest.pot ? t('roulette.fitsPot') : t('roulette.overPot', { amount: formatMoney(cost - dest.pot, 'EUR', lang) })}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.resultNote}>{t('estimate.disclaimer')}</Text>
            <View style={styles.resultActions}>
              <Button
                variant="accent"
                icon="map"
                iconRight="arrowRight"
                label={t('roulette.openPlan')}
                onPress={() => {
                  dispatch({ type: 'rouletteToPlan', challenge: dest.challenge });
                  onOpenPlan();
                }}
              />
              <Button variant="light" icon="spin" label={t('roulette.again')} onPress={spinAll} />
            </View>
          </Card>
          {dest.challenge ? <ChallengeCard pot={dest.pot} /> : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(6) },
  intro: { gap: space(4) },
  introWide: { flexDirection: 'row', alignItems: 'flex-end' },
  start: { gap: space(3) },
  startHead: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  startTitle: { fontFamily, fontSize: 17, fontWeight: '800', color: colors.text },
  startRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  startCol: { flexGrow: 1, flexBasis: 200, marginBottom: 0 },
  startColSmall: { flexGrow: 1, flexBasis: 170, marginBottom: 0 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  stepBtn: { width: 46, height: 50, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepBtnHover: { backgroundColor: '#c9e3e8' },
  stepInput: { flex: 1, minWidth: 0, width: '100%', textAlign: 'center', fontWeight: '800', fontSize: 18 },
  grid: { gap: space(5) },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  fill: { flex: 1 },
  potBox: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: space(3), gap: 2 },
  potLabel: { ...type.eyebrow, fontSize: 11, color: colors.accentDark },
  potValue: { fontFamily, fontSize: 17, fontWeight: '800', color: colors.text },
  potHint: { ...type.small, color: colors.textMuted },
  result: { backgroundColor: colors.night, borderColor: colors.night, padding: space(6), gap: space(4), borderRadius: radius.xl, ...shadowRaised },
  resultHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(2), flexWrap: 'wrap' },
  resultLine: { fontFamily, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1, color: colors.onNight },
  resultFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  resultFact: { flexGrow: 1, flexBasis: 180, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: space(3.5), gap: 2 },
  resultFactLabel: { ...type.eyebrow, fontSize: 11, color: colors.onNightMuted },
  resultFactValue: { fontFamily, fontSize: 22, fontWeight: '800', color: colors.onNight },
  resultFactSub: { ...type.small, color: colors.onNightMuted },
  fitRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultNote: { ...type.small, color: colors.onNightMuted },
  resultActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
});
