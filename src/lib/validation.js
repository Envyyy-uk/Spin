// Pure validation helpers. Errors are returned as i18n keys (+ params) so the
// UI can render them in the selected language.
import { diffDays, inclusiveDays, parseISO } from './dates.js';
import { getCountry } from '../data/countries.js';

export const MAX_TRIP_DAYS = 90;
export const MAX_TRAVELLERS = 50;
export const MAX_BUDGET_SEGMENTS = 24;
export const MAX_DURATION_SEGMENTS = 30;

export function parsePositiveInt(value) {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0 ? value : null;
  if (typeof value !== 'string' || !/^\s*\d+\s*$/.test(value)) return null;
  const n = Number(value);
  return n > 0 ? n : null;
}

export function parsePositiveNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\s  ']/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 ? n : null;
}

function dateError(value, today, key) {
  if (!value) return { key: 'errors.dateRequired' };
  const d = parseISO(value);
  if (!d) return { key: 'errors.dateInvalid' };
  if (diffDays(today, value) < 0) return { key: 'errors.datePast' };
  return null;
}

/**
 * Validate the trip setup form.
 * @returns {{ errors: Record<string, {key: string, params?: object}>, valid: boolean }}
 */
export function validateSetup(setup, today) {
  const errors = {};
  if (!setup.origin || !getCountry(setup.origin)) errors.origin = { key: 'errors.originRequired' };

  if (setup.dateMode === 'exact') {
    const s = dateError(setup.startDate, today);
    const e = dateError(setup.endDate, today);
    if (s) errors.startDate = s;
    if (e) errors.endDate = e;
    if (!s && !e) {
      const len = inclusiveDays(setup.startDate, setup.endDate);
      if (len < 1) errors.endDate = { key: 'errors.endBeforeStart' };
      else if (len > MAX_TRIP_DAYS) errors.endDate = { key: 'errors.tripTooLong', params: { max: MAX_TRIP_DAYS } };
    }
  } else {
    const s = dateError(setup.windowStart, today);
    const e = dateError(setup.windowEnd, today);
    if (s) errors.windowStart = s;
    if (e) errors.windowEnd = e;
    if (!s && !e) {
      const len = inclusiveDays(setup.windowStart, setup.windowEnd);
      if (len < 1) errors.windowEnd = { key: 'errors.endBeforeStart' };
      else if (len > 366) errors.windowEnd = { key: 'errors.windowTooLong' };
    }
  }

  const people = parsePositiveInt(setup.travellers);
  if (people === null) errors.travellers = { key: 'errors.travellersMin' };
  else if (people > MAX_TRAVELLERS) errors.travellers = { key: 'errors.travellersMax', params: { max: MAX_TRAVELLERS } };

  if (parsePositiveNumber(setup.rate) === null) errors.rate = { key: 'errors.rateInvalid' };

  return { errors, valid: Object.keys(errors).length === 0 };
}

/** Length (in days) the dates allow: fixed for exact dates, a maximum for a window. */
export function dateSpan(setup) {
  if (setup.dateMode === 'exact') {
    const n = inclusiveDays(setup.startDate, setup.endDate);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = inclusiveDays(setup.windowStart, setup.windowEnd);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Build a numeric series from range settings; returns { values, error }. */
export function buildRange({ min, max, step }, { maxSegments, minValue = 1 }) {
  const lo = parsePositiveNumber(String(min));
  const hi = parsePositiveNumber(String(max));
  const st = parsePositiveNumber(String(step));
  if (lo === null || hi === null || st === null) return { values: [], error: { key: 'errors.rangeNumbers' } };
  if (lo < minValue) return { values: [], error: { key: 'errors.rangeMin', params: { min: minValue } } };
  if (hi < lo) return { values: [], error: { key: 'errors.rangeOrder' } };
  const count = Math.floor((hi - lo) / st + 1e-9) + 1;
  if (count > maxSegments) return { values: [], error: { key: 'errors.rangeTooMany', params: { max: maxSegments } } };
  const values = [];
  for (let i = 0; i < count; i += 1) values.push(Math.round((lo + i * st) * 100) / 100);
  return { values, error: null };
}

/** Durations offered on the wheel, respecting what the dates allow. */
export function durationOptions(settings, setup) {
  const span = dateSpan(setup);
  if (setup.dateMode === 'exact') {
    return { values: span ? [span] : [], error: null, locked: true, span };
  }
  const { values, error } = buildRange(settings, { maxSegments: MAX_DURATION_SEGMENTS });
  if (error) return { values, error, locked: false, span };
  const allowed = span ? values.filter((v) => Number.isInteger(v) && v <= span) : values.filter(Number.isInteger);
  if (!allowed.length) {
    return { values: [], error: { key: 'errors.durationExceedsWindow', params: { days: span } }, locked: false, span };
  }
  return { values: allowed, error: null, locked: false, span, trimmed: allowed.length < values.length };
}
