import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useI18n } from '../i18n';
import { COUNTRIES, countryName, sortedCountries } from '../data/countries';
import { formatDate, formatMoney, formatMoneyRange, formatNumber, formatPercent } from '../lib/format';
import { todayISO, tripEnd } from '../lib/dates';
import { budgetStatus, costDrivers, savingTips } from '../lib/budget';
import { parsePositiveInt, parsePositiveNumber } from '../lib/validation';
import { COST_CATEGORIES, estimateTripCosts, STAY_LEVELS, TRANSPORT_LEVELS } from '../services/pricingService';
import { getSuggestions } from '../services/suggestionsService';
import { isDemoMode } from '../services/config';
import { STYLE_KEYS } from '../state/store';
import { categoryColors, colors, fontFamily, radius, space } from '../theme';
import { Badge, Button, Card, ErrorText, Field, H1, H2, H3, Input, Notice, P, Segmented, Touchable } from '../components/ui';
import { SelectModal } from '../components/SelectModal';
import { DateField } from '../components/DateField';
import { BudgetBar, STATUS_TONE } from '../components/BudgetBar';

function roundUpNice(x) {
  if (!(x > 0)) return x;
  const mag = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1);
  return Math.ceil(x / mag) * mag;
}

// ------------------------------------------------------------------------------
export function PlanScreen({ state, dispatch, derived, onRespin }) {
  const { t, lang } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const trip = derived.trip;
  const today = todayISO();

  const estimate = useMemo(() => (trip ? estimateTripCosts({ ...trip, today }) : null), [trip, today]);

  if (!trip || !estimate) {
    return (
      <View style={styles.wrap}>
        <H1>{t('nav.plan')}</H1>
        <Notice tone="warning" icon="!">{t('nav.locked')}</Notice>
        <Button label={t('result.respin')} onPress={onRespin} />
      </View>
    );
  }

  const fx = (eur) => eur * trip.rate;
  const status = budgetStatus(estimate, trip.budgetEur);

  return (
    <View style={styles.wrap}>
      <H1>{t('nav.plan')}</H1>
      <ResultCard state={state} dispatch={dispatch} derived={derived} onRespin={onRespin} />
      <View style={[styles.cols, wide && styles.colsWide]}>
        <View style={wide ? styles.colMain : null}>
          <EstimateCard trip={trip} estimate={estimate} status={status} fx={fx} dispatch={dispatch} state={state} derived={derived} today={today} />
        </View>
        <View style={wide ? styles.colSide : null}>
          <SummaryCard trip={trip} estimate={estimate} status={status} fx={fx} />
        </View>
      </View>
      <SuggestionsSection trip={trip} fx={fx} lang={lang} />
    </View>
  );
}

// ------------------------------------------------------------------------------
function Fact({ label, value, sub }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
      {sub ? <Text style={styles.factSub}>{sub}</Text> : null}
    </View>
  );
}

function ResultCard({ state, dispatch, derived, onRespin }) {
  const { t, tp, lang } = useI18n();
  const [editing, setEditing] = useState(false);
  const trip = derived.trip;
  const { setup } = state;
  const exact = setup.dateMode === 'exact';
  const [durText, setDurText] = useState(String(trip.days));
  const [peopleText, setPeopleText] = useState(String(trip.travellers));
  const [budgetText, setBudgetText] = useState(String(trip.budget));

  useEffect(() => {
    if (!editing) {
      setDurText(String(trip.days));
      setPeopleText(String(trip.travellers));
      setBudgetText(String(trip.budget));
    }
  }, [editing, trip.days, trip.travellers, trip.budget]);

  const countryOptions = useMemo(
    () =>
      sortedCountries(lang, COUNTRIES.filter((c) => c.code !== setup.origin)).map((c) => ({
        value: c.code,
        label: c.names[lang] || c.names.en,
        searchText: `${c.names.en} ${c.code}`,
      })),
    [lang, setup.origin],
  );

  const [localErrors, setLocalErrors] = useState({});
  const setDuration = (v) => {
    const clean = v.replace(/[^\d]/g, '').slice(0, 3);
    setDurText(clean);
    const d = parsePositiveInt(clean);
    if (!d) return setLocalErrors((e) => ({ ...e, duration: t('errors.durationPositive') }));
    setLocalErrors((e) => ({ ...e, duration: null }));
    if (exact) dispatch({ type: 'setup', patch: { endDate: tripEnd(setup.startDate, d) } });
    else if (derived.span && d > derived.span) setLocalErrors((e) => ({ ...e, duration: t('errors.durationTooLong', { days: tp('plural.days', derived.span) }) }));
    else dispatch({ type: 'select', patch: { duration: d } });
  };
  const setPeople = (v) => {
    const clean = v.replace(/[^\d]/g, '').slice(0, 3);
    setPeopleText(clean);
    const n = parsePositiveInt(clean);
    setLocalErrors((e) => ({ ...e, travellers: n ? null : t('errors.travellersMin') }));
    if (n) dispatch({ type: 'setup', patch: { travellers: String(n) } });
  };
  const setBudget = (v) => {
    const clean = v.replace(/[^\d.,]/g, '').slice(0, 9);
    setBudgetText(clean);
    const n = parsePositiveNumber(clean);
    setLocalErrors((e) => ({ ...e, budget: n ? null : t('errors.budgetPositive') }));
    if (n) dispatch({ type: 'select', patch: { budget: n } });
  };

  const perPerson = trip.budget / trip.travellers;
  const hasErrors = Object.values(localErrors).some(Boolean);

  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{t('result.title')}</Text>
          <Text style={styles.bigCountry} accessibilityRole="header" aria-level={2}>
            {countryName(setup.origin, lang)} → {countryName(trip.destination, lang)}
          </Text>
        </View>
      </View>
      {!editing ? (
        <View style={styles.facts}>
          <Fact label={t('result.dates')} value={`${formatDate(trip.startDate, lang, 'short')} – ${formatDate(trip.endDate, lang)}`} />
          <Fact label={t('result.duration')} value={tp('plural.days', trip.days)} sub={tp('plural.nights', Math.max(0, trip.days - 1))} />
          <Fact label={t('result.travellers')} value={tp('plural.travellers', trip.travellers)} />
          <Fact label={t('result.budget')} value={formatMoney(trip.budget, trip.currency, lang)} sub={t('result.perPerson', { amount: formatMoney(perPerson, trip.currency, lang) })} />
          {state.styleSettings.enabled ? (
            <Fact label={t('result.style')} value={trip.style ? t(`styles.${trip.style}`) : t('result.noStyle')} />
          ) : null}
        </View>
      ) : (
        <View style={styles.editGrid}>
          <Field label={t('result.destination')} style={styles.editField}>
            <SelectModal
              label={t('result.destination')}
              value={trip.destination}
              options={countryOptions}
              searchable
              onChange={(v) => dispatch({ type: 'select', patch: { destination: v } })}
            />
          </Field>
          {exact ? (
            <Field label={t('setup.start')} style={styles.editField}>
              <DateField
                label={t('setup.start')}
                value={setup.startDate}
                min={todayISO()}
                onChange={(v) => v && dispatch({ type: 'setup', patch: { startDate: v, endDate: tripEnd(v, trip.days) } })}
              />
            </Field>
          ) : (
            <Field
              label={t('result.tripStart')}
              hint={t('result.startHint', { from: formatDate(derived.earliest, lang), to: formatDate(derived.latestStart, lang) })}
              style={styles.editField}
            >
              <DateField
                label={t('result.tripStart')}
                value={derived.startDate}
                min={derived.earliest}
                max={derived.latestStart}
                onChange={(v) => v && dispatch({ type: 'select', patch: { tripStart: v } })}
              />
            </Field>
          )}
          <Field label={t('result.duration')} error={localErrors.duration} style={styles.editField}>
            <Input value={durText} onChangeText={setDuration} keyboardType="number-pad" inputMode="numeric" label={t('result.duration')} error={localErrors.duration} />
          </Field>
          <Field label={t('result.travellers')} error={localErrors.travellers} style={styles.editField}>
            <Input value={peopleText} onChangeText={setPeople} keyboardType="number-pad" inputMode="numeric" label={t('result.travellers')} error={localErrors.travellers} />
          </Field>
          <Field label={`${t('result.budget')} (${trip.currency})`} error={localErrors.budget} style={styles.editField}>
            <Input value={budgetText} onChangeText={setBudget} keyboardType="decimal-pad" inputMode="decimal" label={t('result.budget')} error={localErrors.budget} />
          </Field>
          {state.styleSettings.enabled ? (
            <Field label={t('result.style')} style={styles.editField}>
              <SelectModal
                label={t('result.style')}
                value={trip.style || ''}
                options={[{ value: '', label: t('result.noStyle') }, ...STYLE_KEYS.map((k) => ({ value: k, label: t(`styles.${k}`) }))]}
                onChange={(v) => dispatch({ type: 'select', patch: { style: v || null } })}
              />
            </Field>
          ) : null}
        </View>
      )}
      <View style={styles.row}>
        <Button
          variant={editing ? 'primary' : 'secondary'}
          icon={editing ? '✓' : '✎'}
          label={editing ? t('result.doneEditing') : t('result.edit')}
          disabled={editing && hasErrors}
          onPress={() => setEditing((v) => !v)}
          small
        />
        <Button variant="secondary" icon="⟳" label={t('result.respin')} onPress={onRespin} small />
      </View>
    </Card>
  );
}

// ------------------------------------------------------------------------------
function EstimateCard({ trip, estimate, status, fx, dispatch, state, derived, today }) {
  const { t, tp, lang } = useI18n();
  const cur = trip.currency;
  const money = (eur) => formatMoney(fx(eur), cur, lang);
  const tone = STATUS_TONE[status];
  const drivers = costDrivers(estimate, trip.budgetEur);
  const m = estimate.meta;
  const tips = useMemo(
    () => savingTips({ ...trip, today }, trip.budgetEur, { destinations: derived.destinations }),
    [trip, today, derived.destinations],
  );
  const overBy = estimate.total.mid - trip.budgetEur;

  const applyTip = (apply) => {
    if (apply.stay || apply.transport) dispatch({ type: 'plan', patch: apply });
    if (apply.duration) {
      if (state.setup.dateMode === 'exact') dispatch({ type: 'setup', patch: { endDate: tripEnd(trip.startDate, apply.duration) } });
      else dispatch({ type: 'select', patch: { duration: apply.duration } });
    }
    if (apply.startDate) {
      if (state.setup.dateMode === 'exact') dispatch({ type: 'setup', patch: { startDate: apply.startDate, endDate: tripEnd(apply.startDate, trip.days) } });
      else {
        const end = tripEnd(apply.startDate, trip.days);
        dispatch({
          type: 'setup',
          patch: {
            windowStart: apply.startDate < state.setup.windowStart ? apply.startDate : state.setup.windowStart,
            windowEnd: end > state.setup.windowEnd ? end : state.setup.windowEnd,
          },
        });
        dispatch({ type: 'select', patch: { tripStart: apply.startDate } });
      }
    }
    if (apply.budgetEur) dispatch({ type: 'select', patch: { budget: roundUpNice(apply.budgetEur * trip.rate) } });
    if (apply.destination) dispatch({ type: 'select', patch: { destination: apply.destination } });
  };

  const metaLines = [
    t(`estimate.meta.${m.mode}`, { km: formatNumber(m.km, lang) }),
    m.nights > 0 ? t('estimate.meta.stay', { rooms: tp('plural.rooms', m.rooms), nights: tp('plural.nights', m.nights) }) : t('estimate.meta.stayNone'),
    t('estimate.meta.perPersonDay', { people: tp('plural.people', m.people), days: tp('plural.days', m.days) }),
  ];
  if (m.season > 1) metaLines.push(t('estimate.meta.peak', { pct: Math.round((m.season - 1) * 100) }));
  if (m.season < 1) metaLines.push(t('estimate.meta.offPeak', { pct: Math.round((1 - m.season) * 100) }));
  if (m.lead > 1) metaLines.push(t('estimate.meta.lastMinute', { pct: Math.round((m.lead - 1) * 100) }));

  return (
    <Card style={styles.sectionCard}>
      <H2>{t('estimate.title')}</H2>
      <Notice tone="info" icon="≈">{t('estimate.disclaimer')}</Notice>

      <View style={[styles.status, { backgroundColor: tone.bg, borderColor: tone.fg }]} accessibilityLiveRegion="polite" aria-live="polite">
        <Text style={[styles.statusIcon, { color: tone.fg }]} aria-hidden>{tone.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusTitle, { color: tone.fg }]}>{t(`estimate.status.${status}`)}</Text>
          <Text style={styles.statusDesc}>{t(`estimate.statusDesc.${status}`)}</Text>
        </View>
      </View>

      <BudgetBar
        total={{ mid: fx(estimate.total.mid), min: fx(estimate.total.min), max: fx(estimate.total.max) }}
        budget={trip.budget}
        status={status}
        currency={cur}
      />

      <View style={styles.levelRow}>
        <Field label={t('estimate.stayLevel')} style={styles.flex}>
          <Segmented
            label={t('estimate.stayLevel')}
            value={trip.stay}
            onChange={(v) => dispatch({ type: 'plan', patch: { stay: v } })}
            options={STAY_LEVELS.map((k) => ({ value: k, label: t(`estimate.stay.${k}`) }))}
          />
        </Field>
        <Field label={t('estimate.transportLevel')} style={styles.flex}>
          <Segmented
            label={t('estimate.transportLevel')}
            value={trip.transport}
            onChange={(v) => dispatch({ type: 'plan', patch: { transport: v } })}
            options={TRANSPORT_LEVELS.map((k) => ({ value: k, label: t(`estimate.transport.${k}`) }))}
          />
        </Field>
      </View>

      <View style={styles.catList}>
        {COST_CATEGORIES.map((key) => {
          const c = estimate.categories[key];
          const share = trip.budgetEur > 0 ? c.mid / trip.budgetEur : 0;
          return (
            <View key={key} style={styles.catRow}>
              <View style={styles.catHead}>
                <View style={[styles.swatch, { backgroundColor: categoryColors[key] }]} />
                <Text style={styles.catName}>{t(`estimate.categories.${key}`)}</Text>
                <Text style={styles.catAmount}>{money(c.mid)}</Text>
              </View>
              <View style={styles.catTrack} aria-hidden>
                <View style={[styles.catFill, { width: `${Math.min(100, share * 100)}%`, backgroundColor: categoryColors[key] }]} />
              </View>
              <Text style={styles.catMeta}>
                {t('estimate.shareOfBudget', { share: formatPercent(share, lang) })} · {t('estimate.range', { min: money(c.min), max: money(c.max) })}
              </Text>
            </View>
          );
        })}
        <View style={[styles.catHead, styles.totalRow]}>
          <Text style={[styles.catName, styles.totalText]}>{t('estimate.total')}</Text>
          <Text style={[styles.catAmount, styles.totalText]}>{money(estimate.total.mid)}</Text>
        </View>
        <Text style={styles.catMeta}>{t('estimate.range', { min: money(estimate.total.min), max: money(estimate.total.max) })}</Text>
      </View>

      <View style={styles.metaBox}>
        {metaLines.map((line) => (
          <Text key={line} style={styles.metaLine}>• {line}</Text>
        ))}
      </View>

      {status !== 'comfortable' ? (
        <View style={styles.problemBox}>
          <H3>{t('problems.title')}</H3>
          {overBy > 0 ? <P>{t('problems.over', { amount: money(overBy) })}</P> : null}
          {drivers.slice(0, 2).map((d) => (
            <P key={d.key}>• {t('problems.driver', { category: t(`estimate.categories.${d.key}`), share: formatPercent(d.shareOfBudget, lang) })}</P>
          ))}
          {m.km > 3000 && drivers[0]?.key === 'transport' ? <P>• {t('problems.longHaul', { km: formatNumber(m.km, lang) })}</P> : null}
          {m.people >= 3 ? <P>• {t('problems.group')}</P> : null}
        </View>
      ) : null}

      {tips.length ? (
        <View style={styles.tips}>
          <H3>{t('tips.title')}</H3>
          {tips.map((tip) => (
            <TipRow key={tip.type} tip={tip} money={money} apply={applyTip} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function TipRow({ tip, money, apply }) {
  const { t, tp, lang } = useI18n();
  let text;
  switch (tip.type) {
    case 'shorter':
      text = t('tips.shorter', { days: tp('plural.days', tip.days), amount: money(tip.saving) });
      break;
    case 'stay':
      text = t('tips.stay', { amount: money(tip.saving) });
      break;
    case 'transport':
      text = t('tips.transport', { amount: money(tip.saving) });
      break;
    case 'dates':
      text = t('tips.dates', { date: formatDate(tip.startDate, lang), amount: money(tip.saving) });
      break;
    case 'budget':
      text = t('tips.budget', { amount: money(tip.needed), safe: money(tip.safe) });
      break;
    case 'destination':
      return (
        <View style={styles.tip}>
          <Text style={styles.tipText}>💡 {t('tips.destination')}</Text>
          <View style={styles.row}>
            {tip.options.map((o) => (
              <Button
                key={o.code}
                small
                variant="secondary"
                label={t('tips.destinationItem', { name: countryName(o.code, lang), amount: money(o.total) })}
                onPress={() => apply({ destination: o.code })}
              />
            ))}
          </View>
        </View>
      );
    default:
      return null;
  }
  return (
    <View style={styles.tip}>
      <Text style={styles.tipText}>
        💡 {text}
        {tip.fits ? <Text style={styles.fits}> ({t('tips.fits')})</Text> : null}
      </Text>
      <Button small variant="secondary" label={t('tips.apply')} accessibilityLabel={`${t('tips.apply')}: ${text}`} onPress={() => apply(tip.apply)} style={{ alignSelf: 'flex-start' }} />
    </View>
  );
}

// ------------------------------------------------------------------------------
function SummaryCard({ trip, estimate, status, fx }) {
  const { t, tp, lang } = useI18n();
  const [msg, setMsg] = useState(null);
  const cur = trip.currency;
  const money = (v) => formatMoney(v, cur, lang);
  const total = fx(estimate.total.mid);
  const diff = trip.budget - total;
  const tone = STATUS_TONE[status];

  const summaryText = [
    t('summary.textHeader'),
    `${countryName(trip.origin, lang)} → ${countryName(trip.destination, lang)}`,
    `${formatDate(trip.startDate, lang)} – ${formatDate(trip.endDate, lang)} (${tp('plural.days', trip.days)})`,
    tp('plural.travellers', trip.travellers),
    trip.style ? `${t('result.style')}: ${t(`styles.${trip.style}`)}` : null,
    '',
    ...COST_CATEGORIES.map((k) => `${t(`estimate.categories.${k}`)}: ${money(fx(estimate.categories[k].mid))}`),
    `${t('summary.total')}: ${money(total)}`,
    `${t('summary.budget')}: ${money(trip.budget)}`,
    diff >= 0 ? `${t('summary.remaining')}: ${money(diff)}` : `${t('summary.over')}: ${money(-diff)}`,
    '',
    t('summary.approx'),
  ]
    .filter((x) => x !== null)
    .join('\n');

  const share = async () => {
    setMsg(null);
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: t('summary.textHeader'), text: summaryText });
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(summaryText);
          setMsg({ ok: true, text: t('summary.copied') });
        } else throw new Error('no share');
      } else {
        await Share.share({ message: summaryText });
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setMsg({ ok: false, text: t('summary.shareFailed') });
    }
  };

  return (
    <Card style={[styles.sectionCard, styles.summary]}>
      <H2>{t('summary.title')}</H2>
      <Text style={styles.summaryRoute}>
        {countryName(trip.origin, lang)} → {countryName(trip.destination, lang)}
      </Text>
      <Text style={styles.summaryMeta}>
        {formatDate(trip.startDate, lang, 'short')} – {formatDate(trip.endDate, lang)} · {tp('plural.days', trip.days)} · {tp('plural.travellers', trip.travellers)}
        {trip.style ? ` · ${t(`styles.${trip.style}`)}` : ''}
      </Text>

      <View style={styles.stack} accessibilityLabel={t('estimate.indicatorLabel')}>
        {COST_CATEGORIES.map((k) => (
          <View key={k} style={{ flex: Math.max(0.001, estimate.categories[k].mid), backgroundColor: categoryColors[k] }} />
        ))}
      </View>
      <View style={styles.legendWrap}>
        {COST_CATEGORIES.map((k) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: categoryColors[k] }]} />
            <Text style={styles.legendText}>
              {t(`estimate.categories.${k}`)} · {formatPercent(estimate.categories[k].mid / estimate.total.mid, lang)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.sumRows}>
        <SumRow label={t('summary.total')} value={`≈ ${money(total)}`} strong />
        <SumRow label={t('summary.budget')} value={money(trip.budget)} />
        <SumRow
          label={diff >= 0 ? t('summary.remaining') : t('summary.over')}
          value={money(Math.abs(diff))}
          color={diff >= 0 ? colors.success : colors.danger}
          strong
        />
        <SumRow label={t('summary.perPerson')} value={`≈ ${money(total / trip.travellers)}`} />
      </View>
      <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
        <Text style={[styles.statusPillText, { color: tone.fg }]}>
          {tone.icon} {t(`estimate.status.${status}`)}
        </Text>
      </View>
      <P muted style={{ fontSize: 13 }}>{t('summary.approx')}</P>
      <Button variant="secondary" icon="⇪" label={t('summary.share')} onPress={share} />
      {msg ? (
        <Text style={[styles.shareMsg, { color: msg.ok ? colors.success : colors.danger }]} accessibilityLiveRegion="polite" aria-live="polite">
          {msg.text}
        </Text>
      ) : null}
    </Card>
  );
}

function SumRow({ label, value, strong, color }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, strong && styles.sumStrong]}>{label}</Text>
      <Text style={[styles.sumValue, strong && styles.sumStrong, color && { color }]}>{value}</Text>
    </View>
  );
}

// ------------------------------------------------------------------------------
function SuggestionsSection({ trip, fx }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState({ status: 'loading', data: null, source: null });
  const [attempt, setAttempt] = useState(0);
  const key = `${trip.destination}|${trip.startDate}|${trip.days}|${trip.travellers}|${trip.style}|${trip.stay}|${lang}|${attempt}`;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, status: 'loading' }));
    getSuggestions({ ...trip, lang })
      .then((res) => alive && setState({ status: 'ready', data: res.groups, source: res.source }))
      .catch(() => alive && setState({ status: 'error', data: null, source: null }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const groups = ['stay', 'activities', 'places'];
  const empty = state.status === 'ready' && groups.every((g) => !(state.data?.[g] || []).length);

  return (
    <View style={styles.suggestWrap}>
      <H2>{t('suggest.title')}</H2>
      <Notice tone={isDemoMode ? 'warning' : 'info'} icon={isDemoMode ? '✱' : 'ℹ'}>
        {isDemoMode ? t('suggest.disclaimer') : t('suggest.apiNote')}
      </Notice>
      {state.status === 'loading' ? (
        <View style={styles.center} accessibilityLiveRegion="polite" aria-live="polite" aria-busy>
          <ActivityIndicator color={colors.primary} />
          <P muted>{t('suggest.loading')}</P>
        </View>
      ) : null}
      {state.status === 'error' ? (
        <Card style={styles.center}>
          <ErrorText>{t('suggest.error')}</ErrorText>
          <Button small label={t('common.retry')} onPress={() => setAttempt((a) => a + 1)} />
        </Card>
      ) : null}
      {empty ? (
        <Card style={styles.center}>
          <P muted>{t('suggest.empty')}</P>
          <Button small variant="secondary" label={t('common.retry')} onPress={() => setAttempt((a) => a + 1)} />
        </Card>
      ) : null}
      {state.status === 'ready' && !empty
        ? groups.map((g) =>
            (state.data[g] || []).length ? (
              <View key={g} style={styles.group}>
                <H3>{t(`suggest.groups.${g}`)}</H3>
                <View style={styles.cardGrid}>
                  {state.data[g].map((item) => (
                    <SuggestionCard key={item.id} item={item} trip={trip} fx={fx} />
                  ))}
                </View>
              </View>
            ) : null,
          )
        : null}
    </View>
  );
}

function ExternalLink({ url, label }) {
  const { t } = useI18n();
  if (Platform.OS === 'web') {
    return (
      <Text
        accessibilityRole="link"
        href={url}
        hrefAttrs={{ target: '_blank', rel: 'noopener noreferrer' }}
        aria-label={`${label} (${t('suggest.external')})`}
        style={styles.link}
      >
        {label} ↗
      </Text>
    );
  }
  return (
    <Touchable accessibilityRole="link" accessibilityLabel={label} onPress={() => Linking.openURL(url).catch(() => {})}>
      <Text style={styles.link}>{label} ↗</Text>
    </Touchable>
  );
}

function SuggestionCard({ item, trip, fx }) {
  const { t, tp, lang } = useI18n();
  const cur = trip.currency;
  const p = item.price || {};
  const params = { ...(item.descParams || {}) };
  if (params.rooms != null) params.rooms = tp('plural.rooms', params.rooms);
  if (params.people != null) params.people = tp('plural.people', params.people);
  const title = item.title || t(item.titleKey, params);
  const desc = item.description || (item.descKey ? t(item.descKey, params) : '');
  const nights = Math.max(1, trip.days - 1);

  let priceMain = null;
  let priceSub = null;
  if (p.max === 0) priceMain = t('suggest.unit.free');
  else if (p.max > 0) {
    const r = formatMoneyRange(fx(p.min), fx(p.max), cur, lang);
    if (p.unit === 'perNight') {
      priceMain = t('suggest.unit.perNight', { amount: r });
      priceSub = t('suggest.unit.nightsTotal', { amount: formatMoneyRange(fx(p.min * nights), fx(p.max * nights), cur, lang), nights: tp('plural.nights', nights) });
    } else if (p.unit === 'perPerson') {
      priceMain = p.min === 0 ? t('suggest.unit.freeOrPaid', { amount: formatMoney(fx(p.max), cur, lang) }) : t('suggest.unit.perPerson', { amount: r });
      if (trip.travellers > 1 && p.groupMax > 0) {
        const people = tp('plural.people', trip.travellers);
        priceSub =
          p.groupMin === 0
            ? t('suggest.unit.groupUpTo', { amount: formatMoney(fx(p.groupMax), cur, lang), people })
            : t('suggest.unit.groupTotal', { amount: formatMoneyRange(fx(p.groupMin), fx(p.groupMax), cur, lang), people });
      }
    } else {
      priceMain = r;
    }
  }

  return (
    <Card style={styles.sCard}>
      <View style={styles.sCardHead}>
        {item.isExample ? <Badge label={t('common.example')} tone="example" /> : null}
        {item.tags?.includes('match') ? <Badge label={t('suggest.match')} tone="success" /> : null}
        {item.group === 'stay' && item.tags?.includes(trip.stay) ? <Badge label={t('suggest.fitsStay')} tone="info" /> : null}
      </View>
      <H3>{title}</H3>
      {desc ? <P muted style={{ fontSize: 14 }}>{desc}</P> : null}
      {priceMain ? (
        <View>
          <Text style={styles.price}>≈ {priceMain}</Text>
          {priceSub ? <Text style={styles.priceSub}>{priceSub}</Text> : null}
        </View>
      ) : null}
      <View style={styles.links}>
        {(item.links || []).map((l) => (
          <ExternalLink key={l.url} url={l.url} label={t('suggest.searchOn', { provider: l.provider })} />
        ))}
      </View>
    </Card>
  );
}

// ------------------------------------------------------------------------------
const styles = StyleSheet.create({
  wrap: { gap: space(4) },
  cols: { gap: space(4) },
  colsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  colMain: { flex: 3 },
  colSide: { flex: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  flex: { flex: 1, minWidth: 220 },
  resultCard: { gap: space(4), backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  resultHead: { flexDirection: 'row' },
  eyebrow: { fontFamily, color: colors.primarySoft, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  bigCountry: { fontFamily, color: colors.onPrimary, fontSize: 26, fontWeight: '800', marginTop: 4 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  fact: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, padding: space(3), minWidth: 140, flexGrow: 1 },
  factLabel: { fontFamily, color: colors.primarySoft, fontSize: 12, fontWeight: '700' },
  factValue: { fontFamily, color: colors.onPrimary, fontSize: 17, fontWeight: '800', marginTop: 2 },
  factSub: { fontFamily, color: colors.primarySoft, fontSize: 12, marginTop: 2 },
  editGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3), backgroundColor: colors.surface, padding: space(3), borderRadius: radius.md },
  editField: { flexGrow: 1, flexBasis: 220, marginBottom: 0 },
  sectionCard: { gap: space(4) },
  status: { flexDirection: 'row', gap: space(3), padding: space(3), borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center' },
  statusIcon: { fontSize: 22, fontWeight: '900', width: 28, textAlign: 'center' },
  statusTitle: { fontFamily, fontSize: 17, fontWeight: '800' },
  statusDesc: { fontFamily, fontSize: 14, color: colors.text, marginTop: 2 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  catList: { gap: space(3) },
  catRow: { gap: space(1) },
  catHead: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  catName: { flex: 1, fontFamily, fontSize: 15, fontWeight: '700', color: colors.text },
  catAmount: { fontFamily, fontSize: 15, fontWeight: '800', color: colors.text },
  catTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  catFill: { height: 8, borderRadius: 4 },
  catMeta: { fontFamily, fontSize: 12.5, color: colors.textMuted },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space(3) },
  totalText: { fontSize: 17, fontWeight: '800' },
  metaBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: space(3), gap: 4 },
  metaLine: { fontFamily, fontSize: 13, color: colors.textMuted },
  problemBox: { gap: space(1.5), borderLeftWidth: 4, borderLeftColor: colors.coral, paddingLeft: space(3) },
  tips: { gap: space(2) },
  tip: { gap: space(2), padding: space(3), borderRadius: radius.md, backgroundColor: colors.accentSoft },
  tipText: { fontFamily, fontSize: 14.5, lineHeight: 21, color: colors.text },
  fits: { color: colors.success, fontWeight: '700' },
  summary: { borderWidth: 2, borderColor: colors.primary },
  summaryRoute: { fontFamily, fontSize: 20, fontWeight: '800', color: colors.text },
  summaryMeta: { fontFamily, fontSize: 14, color: colors.textMuted, marginTop: -space(2) },
  stack: { flexDirection: 'row', height: 18, borderRadius: radius.pill, overflow: 'hidden' },
  legendWrap: { gap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  legendText: { fontFamily, fontSize: 13, color: colors.textMuted },
  sumRows: { gap: space(2), borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space(3) },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space(2) },
  sumLabel: { fontFamily, fontSize: 15, color: colors.textMuted },
  sumValue: { fontFamily, fontSize: 15, color: colors.text, fontWeight: '700' },
  sumStrong: { fontSize: 17, fontWeight: '800', color: colors.text },
  statusPill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space(3), paddingVertical: space(1.5) },
  statusPillText: { fontFamily, fontWeight: '800', fontSize: 14 },
  shareMsg: { fontFamily, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  suggestWrap: { gap: space(3) },
  center: { alignItems: 'center', gap: space(2), padding: space(5) },
  group: { gap: space(2), marginTop: space(2) },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  sCard: { flexGrow: 1, flexBasis: 260, maxWidth: 420, gap: space(2), padding: space(4) },
  sCardHead: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1.5) },
  price: { fontFamily, fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  priceSub: { fontFamily, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3), marginTop: 'auto' },
  link: { fontFamily, fontSize: 14, fontWeight: '700', color: colors.primary, textDecorationLine: 'underline', paddingVertical: 4 },
});
