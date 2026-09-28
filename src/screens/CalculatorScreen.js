import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { COUNTRIES, countryName, getCountry, sortedCountries } from '../data/countries';
import { CURRENCIES } from '../data/currencies';
import { addDays, todayISO } from '../lib/dates';
import { formatMoney, formatPercent } from '../lib/format';
import { calculateNeeds } from '../lib/calculator';
import { MAX_TRAVELLERS, parsePositiveInt, parsePositiveNumber, validateSetup } from '../lib/validation';
import { COST_CATEGORIES, STAY_LEVELS, distanceKm } from '../services/pricingService';
import { colors, fontFamily, radius, shadowRaised, space, type } from '../theme';
import { Badge, Button, Card, ErrorText, Eyebrow, Field, H3, Input, Notice, P, SectionHeader, Segmented, Touchable } from '../components/ui';
import { Icon } from '../components/Icon';
import { SelectModal } from '../components/SelectModal';
import { DateField } from '../components/DateField';
import { BudgetBar, STATUS_TONE } from '../components/BudgetBar';
import { RouteHeader } from '../components/RouteHeader';
import { TicketsSection } from '../components/TicketsSection';
import { AnimatedNumber, Reveal, useBreakpoint } from '../components/motion';
import { CategoryRow } from './PlanScreen';

function roundUpNice(x) {
  if (!(x > 0)) return x;
  const mag = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1);
  return Math.ceil(x / mag) * mag;
}

/** Validate the calculator form; errors are i18n keys. */
function validateCalc(calc, today) {
  const { errors } = validateSetup(
    { origin: calc.origin, dateMode: 'exact', startDate: calc.startDate, endDate: calc.endDate, travellers: calc.travellers, rate: calc.rate },
    today,
  );
  if (!calc.destination || !getCountry(calc.destination)) errors.destination = { key: 'calc.errors.destination' };
  if (calc.amount !== '' && parsePositiveNumber(calc.amount) === null) errors.amount = { key: 'errors.budgetPositive' };
  return errors;
}

export function CalculatorScreen({ state, dispatch, onOpenPlan }) {
  const { t, tp, lang } = useI18n();
  const { isDesktop, isPhone } = useBreakpoint();
  const today = todayISO();
  const calc = state.calc;
  const set = (patch) => dispatch({ type: 'calc', patch });
  const errors = validateCalc(calc, today);
  const err = (f) => (errors[f] ? t(errors[f].key, errors[f].params) : null);
  const valid = Object.keys(errors).length === 0;
  const rate = parsePositiveNumber(calc.rate) || 1;
  const people = parsePositiveInt(calc.travellers) || 1;
  const amount = parsePositiveNumber(calc.amount);
  const fx = (eur) => eur * rate;
  const money = (eur) => formatMoney(fx(eur), calc.currency, lang);

  // Three cheap estimates; no memoisation needed.
  const result = valid
    ? calculateNeeds({
        origin: calc.origin,
        destination: calc.destination,
        startDate: calc.startDate,
        endDate: calc.endDate,
        travellers: people,
        transport: calc.transport,
        mode: calc.mode,
        today,
        amountEur: amount ? amount / rate : null,
      })
    : null;

  const countryOptions = useMemo(
    () => sortedCountries(lang, COUNTRIES).map((c) => ({ value: c.code, label: c.names[lang] || c.names.en, searchText: `${c.names.en} ${c.code}` })),
    [lang],
  );
  const destOptions = countryOptions.filter((o) => o.value !== calc.origin);
  const currencyOptions = CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${t(`currency.${c.code}`)}`, detail: c.symbol }));

  const selected = result ? result.levels[calc.stay] : null;
  const status = result && amount ? result.comparison[calc.stay].status : null;
  const tone = status ? STATUS_TONE[status] : null;
  const diffEur = result && amount ? result.comparison[calc.stay].diff : 0;

  // ---- form ------------------------------------------------------------------
  const form = (
    <Card style={styles.formCard}>
      <View style={styles.formRow}>
        <Field label={t('setup.origin')} icon="pin" error={err('origin')} style={styles.formCol}>
          <SelectModal label={t('setup.origin')} value={calc.origin} options={countryOptions} searchable onChange={(v) => set({ origin: v })} error={err('origin')} />
        </Field>
        <Field label={t('calc.destination')} icon="globe" error={err('destination')} style={styles.formCol}>
          <SelectModal label={t('calc.destination')} value={calc.destination} options={destOptions} searchable onChange={(v) => set({ destination: v })} error={err('destination')} />
        </Field>
      </View>
      <View style={styles.formRow}>
        <Field label={t('setup.start')} icon="calendar" error={err('startDate')} style={styles.formCol}>
          <DateField
            label={t('setup.start')}
            value={calc.startDate}
            min={today}
            error={err('startDate')}
            onChange={(v) => set(v && calc.endDate && calc.endDate < v ? { startDate: v, endDate: addDays(v, 6) } : { startDate: v })}
          />
        </Field>
        <Field label={t('setup.end')} icon="calendar" error={err('endDate')} style={styles.formCol}>
          <DateField label={t('setup.end')} value={calc.endDate} min={calc.startDate || today} error={err('endDate')} onChange={(v) => set({ endDate: v })} />
        </Field>
      </View>
      <View style={styles.formRow}>
        <Field label={t('setup.travellers')} icon="users" error={err('travellers')} style={styles.formCol}>
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
              value={calc.travellers}
              onChangeText={(v) => set({ travellers: v.replace(/[^\d]/g, '').slice(0, 3) })}
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
        <Field label={t('setup.currency')} icon="wallet" style={styles.formCol}>
          <SelectModal label={t('setup.currency')} value={calc.currency} options={currencyOptions} onChange={(code) => dispatch({ type: 'calcCurrency', code })} />
        </Field>
      </View>
      <Field label={t('calc.amount', { currency: calc.currency })} hint={t('calc.amountHint')} error={err('amount')} style={{ marginBottom: 0 }}>
        <Input
          value={calc.amount}
          onChangeText={(v) => set({ amount: v.replace(/[^\d.,\s]/g, '').slice(0, 12) })}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder={t('calc.amountPlaceholder')}
          label={t('calc.amount', { currency: calc.currency })}
          error={err('amount')}
        />
      </Field>
    </Card>
  );

  // ---- results ---------------------------------------------------------------
  const results = result ? (
    <View style={styles.results}>
      <Card style={styles.hero}>
        <Eyebrow color={colors.sun}>{t('calc.needTitle')}</Eyebrow>
        <RouteHeader
          origin={calc.origin}
          destination={calc.destination}
          km={distanceKm(getCountry(calc.origin), getCountry(calc.destination))}
          compact={isPhone}
        />
        <View style={{ gap: space(1) }}>
          <AnimatedNumber value={fx(selected.total.mid)} format={(v) => `≈ ${formatMoney(v, calc.currency, lang)}`} style={styles.heroValue} />
          <Text style={styles.heroSub}>
            {t('estimate.range', { min: money(selected.total.min), max: money(selected.total.max) })} · {t(`estimate.stay.${calc.stay}`)}
          </Text>
        </View>
        <View style={styles.heroFacts}>
          <View style={styles.heroFact}>
            <Text style={styles.heroFactLabel}>{t('summary.perPerson')}</Text>
            <Text style={styles.heroFactValue}>≈ {money(selected.total.mid / result.people)}</Text>
          </View>
          <View style={styles.heroFact}>
            <Text style={styles.heroFactLabel}>{t('calc.perDay')}</Text>
            <Text style={styles.heroFactValue}>≈ {money(selected.total.mid / result.days)}</Text>
          </View>
          <View style={styles.heroFact}>
            <Text style={styles.heroFactLabel}>{t('result.duration')}</Text>
            <Text style={styles.heroFactValue}>
              {tp('plural.days', result.days)} · {tp('plural.people', result.people)}
            </Text>
          </View>
        </View>
        <View style={styles.recommend}>
          <Icon name="wallet" size={18} color={colors.sun} />
          <Text style={styles.recommendText}>{t('calc.recommended', { amount: money(result.recommended) })}</Text>
        </View>
      </Card>

      {amount ? (
        <Card style={[styles.verdict, { borderColor: tone.fg }]} accessibilityLiveRegion="polite" aria-live="polite">
          <View style={styles.verdictHead}>
            <View style={[styles.verdictIcon, { borderColor: tone.fg }]}>
              <Icon name={tone.icon} size={20} color={tone.fg} strokeWidth={2.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verdictTitle, { color: tone.fg }]}>
                {diffEur >= 0 ? t('calc.enough', { amount: money(diffEur) }) : t('calc.short', { amount: money(-diffEur) })}
              </Text>
              <Text style={styles.verdictDesc}>{t(`estimate.statusDesc.${status}`)}</Text>
            </View>
          </View>
          <BudgetBar
            total={{ mid: fx(selected.total.mid), min: fx(selected.total.min), max: fx(selected.total.max) }}
            budget={amount}
            status={status}
            currency={calc.currency}
          />
          <P muted style={{ fontSize: 14 }}>
            {result.affordable
              ? t('calc.affordable', { level: t(`estimate.stay.${result.affordable}`) })
              : t('calc.notAffordable', { amount: money(result.levels.budget.total.mid) })}
          </P>
        </Card>
      ) : null}

      <View style={{ gap: space(3) }}>
        <H3>{t('calc.levelsTitle')}</H3>
        <View style={[styles.levels, !isPhone && styles.levelsRow]} accessibilityRole="radiogroup" accessibilityLabel={t('estimate.stayLevel')}>
          {STAY_LEVELS.map((lvl) => {
            const e = result.levels[lvl];
            const on = calc.stay === lvl;
            const c = amount ? result.comparison[lvl] : null;
            return (
              <Touchable
                key={lvl}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, selected: on }}
                aria-checked={on}
                onPress={() => set({ stay: lvl })}
                style={({ hovered }) => [styles.level, hovered && !on && styles.levelHover, on && styles.levelOn]}
              >
                <View style={styles.levelHead}>
                  <Icon name={lvl === 'budget' ? 'bed' : lvl === 'standard' ? 'check' : 'sparkle'} size={18} color={on ? colors.primaryDark : colors.textMuted} />
                  <Text style={[styles.levelName, on && { color: colors.primaryDark }]}>{t(`estimate.stay.${lvl}`)}</Text>
                  {on ? <Badge label={t('calc.selected')} tone="info" /> : null}
                </View>
                <Text style={styles.levelValue}>≈ {money(e.total.mid)}</Text>
                <Text style={styles.levelSub}>{t(`calc.levelDesc.${lvl}`)}</Text>
                {c ? (
                  <View style={styles.levelFit}>
                    <Icon name={c.diff >= 0 ? 'check' : 'x'} size={14} color={c.diff >= 0 ? colors.success : colors.danger} strokeWidth={2.8} />
                    <Text style={[styles.levelFitText, { color: c.diff >= 0 ? colors.success : colors.danger }]}>
                      {c.diff >= 0 ? t('calc.fits') : t('calc.missing', { amount: money(-c.diff) })}
                    </Text>
                  </View>
                ) : null}
              </Touchable>
            );
          })}
        </View>
      </View>

      <Card style={{ gap: space(4) }}>
        <H3>{t('calc.breakdownTitle')}</H3>
        <Segmented
          label={t('estimate.transportLevel')}
          value={calc.transport}
          onChange={(v) => set({ transport: v })}
          options={['economy', 'standard', 'flexible'].map((k) => ({ value: k, label: t(`estimate.transport.${k}`), icon: k === 'economy' ? 'plane' : undefined }))}
        />
        {COST_CATEGORIES.map((key) => {
          const c = selected.categories[key];
          const base = amount ? amount / rate : selected.total.mid;
          const share = base > 0 ? c.mid / base : 0;
          return (
            <CategoryRow
              key={key}
              catKey={key}
              name={t(`estimate.categories.${key}`)}
              amount={fx(c.mid)}
              currency={calc.currency}
              share={share}
              meta={`${amount ? t('estimate.shareOfBudget', { share: formatPercent(share, lang) }) : t('calc.shareOfTotal', { share: formatPercent(share, lang) })} · ${t('estimate.range', { min: money(c.min), max: money(c.max) })}`}
            />
          );
        })}
        <Notice tone="info" icon="info">
          {t('estimate.disclaimer')}
        </Notice>
        <Button
          icon="map"
          label={t('calc.openPlan')}
          iconRight="arrowRight"
          onPress={() => {
            dispatch({ type: 'calcToPlan', budget: amount || roundUpNice(fx(result.recommended)) });
            onOpenPlan();
          }}
          style={{ alignSelf: isPhone ? 'stretch' : 'flex-start' }}
        />
      </Card>
    </View>
  ) : (
    <Card style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name="wallet" size={26} color={colors.primary} />
      </View>
      <H3>{t('calc.emptyTitle')}</H3>
      <P muted style={{ textAlign: 'center' }}>{t('calc.emptyDesc')}</P>
      {Object.keys(errors).length ? <ErrorText>{t('setup.fixErrors')}</ErrorText> : null}
    </Card>
  );

  const ticketTrip =
    result && valid
      ? {
          origin: calc.origin,
          destination: calc.destination,
          startDate: calc.startDate,
          days: result.days,
          travellers: people,
          transport: calc.transport,
          currency: calc.currency,
        }
      : null;

  return (
    <View style={styles.wrap}>
      <Reveal>
        <SectionHeader level={1} eyebrow={t('calc.eyebrow')} title={t('calc.title')} lead={t('calc.lead')} />
      </Reveal>
      <View style={[styles.cols, isDesktop && styles.colsWide]}>
        <Reveal style={isDesktop ? { flex: 1 } : null}>{form}</Reveal>
        <Reveal delay={isDesktop ? 100 : 0} style={isDesktop ? { flex: 1.15 } : null}>
          {results}
        </Reveal>
      </View>
      {ticketTrip ? (
        <TicketsSection trip={ticketTrip} fx={fx} today={today} budgetMode={calc.mode} onUseMode={(mode) => set({ mode })} />
      ) : null}
      {valid && result ? (
        <Text style={styles.footnote}>
          {t('calc.footnote', { from: countryName(calc.origin, lang), to: countryName(calc.destination, lang) })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(7) },
  cols: { gap: space(5) },
  colsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  formCard: { gap: space(1) },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  formCol: { flexGrow: 1, flexBasis: 200 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  stepBtn: { width: 48, height: 50, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepBtnHover: { backgroundColor: '#c9e3e8' },
  stepInput: { flex: 1, minWidth: 0, width: '100%', textAlign: 'center', fontWeight: '800', fontSize: 18 },
  results: { gap: space(5) },
  hero: { backgroundColor: colors.night, borderColor: colors.night, gap: space(4), padding: space(6), borderRadius: radius.xl, ...shadowRaised },
  heroValue: { fontFamily, fontSize: 44, lineHeight: 50, fontWeight: '800', letterSpacing: -1.2, color: colors.onNight },
  heroSub: { ...type.small, color: colors.onNightMuted },
  heroFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  heroFact: { flexGrow: 1, flexBasis: 120, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: space(3) },
  heroFactLabel: { ...type.eyebrow, fontSize: 11, color: colors.onNightMuted },
  heroFactValue: { fontFamily, fontSize: 16, fontWeight: '800', color: colors.onNight, marginTop: 4 },
  recommend: { flexDirection: 'row', gap: space(2), alignItems: 'flex-start' },
  recommendText: { ...type.body, flex: 1, color: colors.onNight },
  verdict: { gap: space(4), borderWidth: 1.5 },
  verdictHead: { flexDirection: 'row', gap: space(3), alignItems: 'center' },
  verdictIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  verdictTitle: { fontFamily, fontSize: 18, fontWeight: '800' },
  verdictDesc: { ...type.small, color: colors.text, marginTop: 2 },
  levels: { gap: space(3) },
  levelsRow: { flexDirection: 'row' },
  level: { flex: 1, gap: space(1.5), padding: space(4), borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  levelHover: { borderColor: colors.primary },
  levelOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  levelName: { fontFamily, fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  levelValue: { fontFamily, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  levelSub: { ...type.small, color: colors.textMuted },
  levelFit: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  levelFitText: { ...type.small, fontWeight: '700' },
  empty: { alignItems: 'center', gap: space(2), padding: space(8) },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: space(1) },
  footnote: { ...type.small, color: colors.textMuted, textAlign: 'center' },
});
