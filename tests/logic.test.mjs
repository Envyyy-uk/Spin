import test from 'node:test';
import assert from 'node:assert/strict';

import { addDays, diffDays, inclusiveDays, parseISO, tripEnd } from '../src/lib/dates.js';
import { buildRange, durationOptions, parsePositiveInt, parsePositiveNumber, validateSetup } from '../src/lib/validation.js';
import { defaultMode, estimateTripCosts, groundPossible, seasonFactor } from '../src/services/pricingService.js';
import { getTicketOptions } from '../src/services/ticketsService.js';
import { budgetStatus, savingTips } from '../src/lib/budget.js';
import { demoSuggestions } from '../src/services/suggestionsService.js';
import { derive } from '../src/state/derived.js';
import { pluralCategory } from '../src/lib/plural.js';

const TODAY = '2026-09-25';

function setup(overrides = {}) {
  return {
    origin: 'UA',
    dateMode: 'exact',
    startDate: '2026-10-25',
    endDate: '2026-10-31',
    windowStart: '2026-10-25',
    windowEnd: '2026-11-24',
    travellers: '2',
    currency: 'EUR',
    rate: '1',
    ...overrides,
  };
}

test('dates', () => {
  assert.equal(parseISO('2026-02-30'), null);
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
  assert.equal(diffDays('2026-03-28', '2026-03-30'), 2); // across DST change
  assert.equal(inclusiveDays('2026-10-25', '2026-10-31'), 7);
  assert.equal(tripEnd('2026-10-25', 1), '2026-10-25');
});

test('number parsing', () => {
  assert.equal(parsePositiveInt('0'), null);
  assert.equal(parsePositiveInt('-2'), null);
  assert.equal(parsePositiveInt('2.5'), null);
  assert.equal(parsePositiveInt(' 4 '), 4);
  assert.equal(parsePositiveNumber('1 500,5'), 1500.5);
  assert.equal(parsePositiveNumber('abc'), null);
  assert.equal(parsePositiveNumber('0'), null);
});

test('setup validation', () => {
  assert.equal(validateSetup(setup(), TODAY).valid, true);
  assert.equal(validateSetup(setup({ origin: '' }), TODAY).errors.origin.key, 'errors.originRequired');
  assert.equal(validateSetup(setup({ travellers: '0' }), TODAY).errors.travellers.key, 'errors.travellersMin');
  assert.equal(validateSetup(setup({ startDate: '2026-09-01' }), TODAY).errors.startDate.key, 'errors.datePast');
  assert.equal(validateSetup(setup({ endDate: '2026-10-20' }), TODAY).errors.endDate.key, 'errors.endBeforeStart');
  assert.equal(validateSetup(setup({ startDate: '2026-13-01' }), TODAY).errors.startDate.key, 'errors.dateInvalid');
  assert.equal(validateSetup(setup({ rate: '-1' }), TODAY).errors.rate.key, 'errors.rateInvalid');
});

test('wheel ranges', () => {
  assert.deepEqual(buildRange({ min: '500', max: '2000', step: '500' }, { maxSegments: 24 }).values, [500, 1000, 1500, 2000]);
  assert.equal(buildRange({ min: '5', max: '1', step: '1' }, { maxSegments: 24 }).error.key, 'errors.rangeOrder');
  assert.equal(buildRange({ min: '1', max: '1000', step: '1' }, { maxSegments: 24 }).error.key, 'errors.rangeTooMany');
  // Exact dates lock the duration.
  const locked = durationOptions({ min: 3, max: 14, step: 1 }, setup());
  assert.deepEqual(locked.values, [7]);
  assert.equal(locked.locked, true);
  // Flexible window trims longer durations.
  const flex = durationOptions({ min: 3, max: 14, step: 1 }, setup({ dateMode: 'flexible', windowEnd: '2026-11-01' }));
  assert.equal(Math.max(...flex.values), 8);
  assert.equal(flex.trimmed, true);
});

test('estimate is positive, scales with people and days', () => {
  const base = { origin: 'UA', destination: 'IT', startDate: '2026-10-25', days: 7, travellers: 2, today: TODAY };
  const e = estimateTripCosts(base);
  assert.ok(e.total.mid > 0);
  assert.ok(e.total.min < e.total.mid && e.total.mid < e.total.max);
  assert.ok(estimateTripCosts({ ...base, travellers: 4 }).total.mid > e.total.mid);
  assert.ok(estimateTripCosts({ ...base, days: 14 }).total.mid > e.total.mid);
  assert.ok(estimateTripCosts({ ...base, stay: 'budget' }).total.mid < e.total.mid);
  assert.equal(estimateTripCosts({ ...base, days: 1 }).categories.accommodation.mid, 0);
  assert.equal(seasonFactor('2026-07-10'), 1.2);
});

test('budget status and tips', () => {
  const input = { origin: 'UA', destination: 'CH', startDate: '2026-07-10', days: 10, travellers: 3, stay: 'comfort', transport: 'flexible', today: TODAY };
  const e = estimateTripCosts(input);
  assert.equal(budgetStatus(e, e.total.max + 1), 'comfortable');
  assert.equal(budgetStatus(e, e.total.mid + 1), 'tight');
  assert.equal(budgetStatus(e, e.total.min - 1), 'insufficient');
  const tips = savingTips(input, e.total.mid * 0.5, { destinations: ['PL', 'GE', 'NO'] });
  const types = tips.map((x) => x.type);
  for (const tp of ['shorter', 'stay', 'transport', 'dates', 'budget']) assert.ok(types.includes(tp), `missing tip ${tp}`);
  const shorter = tips.find((x) => x.type === 'shorter');
  assert.ok(estimateTripCosts({ ...input, days: shorter.days }).total.mid <= e.total.mid * 0.5);
});

test('demo suggestions are labelled as examples and have links', () => {
  const res = demoSuggestions({ destination: 'PT', startDate: '2026-10-25', days: 5, travellers: 3, style: 'sea', lang: 'de' });
  const all = [...res.groups.stay, ...res.groups.activities, ...res.groups.places];
  assert.ok(all.length > 8);
  for (const c of all) {
    assert.equal(c.isExample, true);
    assert.ok(c.links.length > 0);
    for (const l of c.links) assert.match(l.url, /^https:\/\//);
  }
  assert.ok(res.groups.stay.some((c) => c.kind === 'resort'));
});

test('derive: departure excluded, trip built only when complete', () => {
  const state = {
    setup: setup(),
    destSettings: { excluded: ['PL'], byStyle: false },
    durationSettings: { min: '3', max: '14', step: '1' },
    budgetSettings: { min: '500', max: '5000', step: '500' },
    styleSettings: { enabled: false, options: [] },
    selection: { destination: null, duration: null, budget: null, style: null, tripStart: null },
    plan: { stay: 'standard', transport: 'standard' },
  };
  let d = derive(state, TODAY);
  assert.ok(!d.destinations.includes('UA'));
  assert.ok(!d.destinations.includes('PL'));
  assert.equal(d.trip, null);
  d = derive({ ...state, selection: { ...state.selection, destination: 'IT', budget: 2000 } }, TODAY);
  assert.equal(d.trip.days, 7);
  assert.equal(d.trip.budgetEur, 2000);
  // Budget in another currency is converted with the rate.
  d = derive({ ...state, setup: setup({ currency: 'UAH', rate: '46' }), selection: { ...state.selection, destination: 'IT', budget: 92000 } }, TODAY);
  assert.equal(d.trip.budgetEur, 2000);
  // Flexible: duration longer than the window is rejected.
  d = derive({ ...state, setup: setup({ dateMode: 'flexible', windowEnd: '2026-10-28' }), selection: { ...state.selection, destination: 'IT', budget: 2000, duration: 10 } }, TODAY);
  assert.equal(d.trip, null);
  assert.equal(d.tripErrors.duration.key, 'errors.durationTooLong');
});

test('plural rules', () => {
  assert.equal(pluralCategory('uk', 1), 'one');
  assert.equal(pluralCategory('uk', 3), 'few');
  assert.equal(pluralCategory('uk', 11), 'many');
  assert.equal(pluralCategory('ru', 22), 'few');
  assert.equal(pluralCategory('fr', 0), 'one');
  assert.equal(pluralCategory('en', 0), 'other');
});


test('ticket options: flight links carry route, dates and passengers', () => {
  const t = getTicketOptions({ origin: 'PL', destination: 'IT', startDate: '2026-10-25', days: 7, travellers: 3, today: TODAY });
  assert.equal(t.route.fromCode, 'KRK');
  assert.equal(t.route.toCode, 'ROM');
  assert.equal(t.ret, '2026-10-31');
  const sky = t.modes.flight.providers.find((p) => p.id === 'skyscanner');
  assert.equal(sky.url, 'https://www.skyscanner.net/transport/flights/krk/rom/261025/261031/?adultsv2=3&cabinclass=economy');
  const kayak = t.modes.flight.providers.find((p) => p.id === 'kayak');
  assert.equal(kayak.url, 'https://www.kayak.com/flights/KRK-ROM/2026-10-25/2026-10-31/3adults');
  assert.ok(t.modes.flight.estimate.group.mid > t.modes.flight.estimate.perPerson.mid);
  for (const p of [...t.modes.flight.providers, ...t.modes.ground.providers]) assert.match(p.url, /^https:\/\//);
});

test('overland options only where they make sense', () => {
  assert.equal(groundPossible('PL', 'CZ'), true);
  assert.equal(defaultMode('PL', 'CZ'), 'ground');
  assert.equal(groundPossible('US', 'IT'), false); // different continents
  assert.equal(groundPossible('GR', 'CY'), false); // island
  assert.equal(defaultMode('US', 'IT'), 'flight');
  const t = getTicketOptions({ origin: 'US', destination: 'IT', startDate: '2026-10-25', days: 7, travellers: 2, today: TODAY });
  assert.equal(t.modes.ground.available, false);
  assert.equal(t.modes.ground.estimate, null);
  const near = getTicketOptions({ origin: 'PL', destination: 'CZ', startDate: '2026-10-25', days: 5, travellers: 2, today: TODAY });
  assert.ok(near.modes.ground.estimate.perPerson.mid < near.modes.flight.estimate.perPerson.mid);
  assert.ok(near.modes.ground.providers.some((p) => p.id === 'blablacar' && p.url.includes('db=2026-10-25') && p.url.includes('seats=2')));
});

test('calculator: levels are ordered and the amount is compared', async () => {
  const { calculateNeeds } = await import('../src/lib/calculator.js');
  const base = { origin: 'UA', destination: 'IT', startDate: '2026-10-25', endDate: '2026-10-31', travellers: 2, today: TODAY };
  const r = calculateNeeds(base);
  assert.equal(r.days, 7);
  assert.equal(r.nights, 6);
  assert.ok(r.levels.budget.total.mid < r.levels.standard.total.mid);
  assert.ok(r.levels.standard.total.mid < r.levels.comfort.total.mid);
  assert.equal(r.recommended, r.levels.standard.total.max);
  assert.equal(r.comparison, null);
  const withAmount = calculateNeeds({ ...base, amountEur: r.levels.standard.total.mid + 1 });
  assert.equal(withAmount.affordable, 'standard');
  assert.ok(withAmount.comparison.comfort.diff < 0);
  assert.equal(calculateNeeds({ ...base, amountEur: 10 }).affordable, null);
  assert.equal(calculateNeeds({ ...base, endDate: '2026-10-20' }), null);
});

test('cities: city changes price level, distance and ticket codes', async () => {
  const { getCities, place } = await import('../src/data/cities.js');
  assert.equal(getCities('IT')[0].name, 'Rome');
  assert.equal(place('IT', 'Nowhere').city, 'Rome'); // unknown city → hub
  assert.equal(place('CH', 'Zermatt').iata, 'ZRH'); // no airport → country code
  const base = { origin: 'UA', destination: 'IT', startDate: '2026-10-25', days: 5, travellers: 2, today: TODAY };
  const venice = estimateTripCosts({ ...base, destinationCity: 'Venice' });
  const naples = estimateTripCosts({ ...base, destinationCity: 'Naples' });
  assert.ok(venice.categories.accommodation.mid > naples.categories.accommodation.mid);
  // Lviv is closer to Kraków than Kyiv: overland by default.
  assert.equal(defaultMode('UA', 'PL', 'Lviv', 'Kraków'), 'ground');
  assert.equal(defaultMode('UA', 'PL', 'Kyiv', 'Kraków'), 'flight');
  const t = getTicketOptions({ ...base, originCity: 'Lviv', destinationCity: 'Florence' });
  assert.equal(t.route.fromCode, 'LWO');
  assert.equal(t.route.toCode, 'FLR');
  assert.equal(t.route.toCity, 'Florence');
  const { demoSuggestions } = await import('../src/services/suggestionsService.js');
  const sug = demoSuggestions({ destination: 'IT', destinationCity: 'Florence', startDate: '2026-10-25', days: 5, travellers: 2, lang: 'uk' });
  assert.ok(sug.groups.stay[0].links[0].url.includes('Florence'));
});

test('roulette: destinations fit the shared pot, otherwise a challenge pool', async () => {
  const { rouletteDestinations, isChallengeAmount, CHALLENGE_POOL } = await import('../src/lib/roulette.js');
  const base = { origin: 'UA', originCity: 'Lviv', startDate: '2026-10-25', days: 5, travellers: 2, today: TODAY };
  const rich = rouletteDestinations({ ...base, contribution: 700 });
  assert.equal(rich.pot, 1400);
  assert.equal(rich.challenge, false);
  assert.ok(rich.codes.length > 3);
  assert.ok(!rich.codes.includes('UA'));
  for (const code of rich.codes) assert.ok(rich.costs[code] <= 1400, code);
  // Far and expensive places don't fit a small pot.
  assert.ok(!rich.codes.includes('AU'));
  const broke = rouletteDestinations({ ...base, contribution: 0 });
  assert.equal(broke.pot, 0);
  assert.equal(broke.noneFit, true);
  assert.equal(broke.challenge, true);
  assert.equal(broke.codes.length, CHALLENGE_POOL);
  // The challenge pool is the cheapest destinations, cheapest first.
  const c = broke.costs;
  assert.ok(c[broke.codes[0]] <= c[broke.codes[CHALLENGE_POOL - 1]]);
  assert.equal(isChallengeAmount(100), true);
  assert.equal(isChallengeAmount(200), false);
});

test('luxury level costs the most and uses premium transport', async () => {
  const { calculateNeeds } = await import('../src/lib/calculator.js');
  const r = calculateNeeds({ origin: 'UA', destination: 'IT', startDate: '2026-10-25', endDate: '2026-10-31', travellers: 2, today: TODAY });
  assert.ok(r.levels.luxury.total.mid > r.levels.comfort.total.mid);
  assert.equal(r.levels.luxury.meta.transport, 'premium');
});
