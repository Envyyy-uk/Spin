import { COUNTRIES, getCountry } from '../data/countries.js';
import { addDays, diffDays, parseISO, tripEnd } from '../lib/dates.js';
import {
  MAX_BUDGET_SEGMENTS,
  buildRange,
  dateSpan,
  durationOptions,
  parsePositiveInt,
  parsePositiveNumber,
  validateSetup,
} from '../lib/validation.js';

/** Everything the screens compute from the raw store state. Pure. */
export function derive(state, today) {
  const { setup, selection } = state;
  const setupCheck = validateSetup(setup, today);
  const travellers = parsePositiveInt(setup.travellers);
  const rate = parsePositiveNumber(setup.rate) || 1;

  // Destination wheel: never the departure country; user exclusions; optional style filter.
  const pool = COUNTRIES.filter((c) => c.code !== setup.origin);
  let destinations = pool.filter((c) => !state.destSettings.excluded.includes(c.code));
  const styleFilterActive =
    state.styleSettings.enabled && state.destSettings.byStyle && selection.style && destinations.some((c) => c.styles.includes(selection.style));
  if (styleFilterActive) destinations = destinations.filter((c) => c.styles.includes(selection.style));

  const duration = durationOptions(state.durationSettings, setup);
  const budget = buildRange(state.budgetSettings, { maxSegments: MAX_BUDGET_SEGMENTS });
  const styles = state.styleSettings.enabled ? state.styleSettings.options : [];

  // --- the concrete trip -----------------------------------------------------
  const span = dateSpan(setup);
  const days = setup.dateMode === 'exact' ? span : selection.duration;
  const tripErrors = {};

  const earliest = setup.dateMode === 'exact' ? setup.startDate : setup.windowStart;
  const latestStart = setup.dateMode === 'exact' || !days ? earliest : addDays(setup.windowEnd, -(days - 1));
  let startDate = setup.dateMode === 'exact' ? setup.startDate : selection.tripStart || setup.windowStart;
  if (setup.dateMode === 'flexible' && days && parseISO(startDate) && parseISO(latestStart)) {
    if (diffDays(earliest, startDate) < 0 || diffDays(startDate, latestStart) < 0) {
      tripErrors.tripStart = { key: 'result.startOutside', params: { from: earliest, to: latestStart } };
    }
  }

  if (days != null) {
    if (!(Number.isInteger(days) && days > 0)) tripErrors.duration = { key: 'errors.durationPositive' };
    else if (span && days > span) tripErrors.duration = { key: 'errors.durationTooLong', params: { days: span } };
  }
  if (selection.budget != null && !(selection.budget > 0)) tripErrors.budget = { key: 'errors.budgetPositive' };

  const missing = [];
  if (!selection.destination || !getCountry(selection.destination) || selection.destination === setup.origin) missing.push('destination');
  if (!days) missing.push('duration');
  if (!(selection.budget > 0)) missing.push('budget');

  const complete = setupCheck.valid && missing.length === 0 && Object.keys(tripErrors).length === 0;
  const trip = complete
    ? {
        origin: setup.origin,
        destination: selection.destination,
        startDate,
        endDate: tripEnd(startDate, days),
        days,
        travellers,
        budget: selection.budget,
        budgetEur: selection.budget / rate,
        currency: setup.currency,
        rate,
        style: state.styleSettings.enabled ? selection.style : null,
        stay: state.plan.stay,
        transport: state.plan.transport,
      }
    : null;

  return {
    setupCheck,
    travellers,
    rate,
    destinations: destinations.map((c) => c.code),
    destinationPool: pool.map((c) => c.code),
    styleFilterActive,
    duration,
    budget,
    styles,
    span,
    days,
    earliest,
    latestStart,
    startDate,
    tripErrors,
    missing,
    trip,
  };
}
