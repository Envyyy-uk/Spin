// DEMO cost model.
//
// There is no live pricing API behind this app yet. Every number produced here
// is a rough, rule-based approximation derived from a per-country price index,
// flight distance, season and booking lead time. The UI must always label these
// values as approximate. To connect real prices, implement the same return
// shape in a remote provider (see src/services/config.js) and swap it in
// `estimateTripCosts`.

import { getCountry } from '../data/countries.js';
import { diffDays, parseISO } from '../lib/dates.js';

export const PRICING_SOURCE = 'demo';

export const STAY_LEVELS = ['budget', 'standard', 'comfort'];
export const TRANSPORT_LEVELS = ['economy', 'standard', 'flexible'];
export const COST_CATEGORIES = ['transport', 'accommodation', 'food', 'local', 'activities'];

// Base values in EUR at priceIndex 1.0.
const BASE = {
  roomPerNight: { budget: 55, standard: 100, comfort: 180 }, // per room (2 guests)
  foodPerPersonDay: { budget: 22, standard: 40, comfort: 70 },
  localPerPersonDay: { budget: 5, standard: 9, comfort: 18 },
  activitiesPerPersonDay: { budget: 10, standard: 22, comfort: 45 },
};

const TRANSPORT_FACTOR = { economy: 0.75, standard: 1, flexible: 1.5 };

const STYLE_FACTORS = {
  sea: { activities: 0.9, food: 1 },
  culture: { activities: 1.15, food: 1 },
  nature: { activities: 1, food: 0.95 },
  food: { activities: 0.9, food: 1.25 },
  adventure: { activities: 1.45, food: 1 },
  relax: { activities: 0.8, food: 1.05 },
};

// Relative uncertainty of each category (used for min/max ranges).
const SPREAD = { transport: 0.3, accommodation: 0.25, food: 0.2, local: 0.25, activities: 0.3 };

const GROUND_TRANSPORT_MAX_KM = 700;

export function distanceKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Peak-season multiplier for the trip start date. */
export function seasonFactor(startIso) {
  const d = parseISO(startIso);
  if (!d) return 1;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 12 && day >= 20) || (m === 1 && day <= 7)) return 1.25;
  if (m >= 6 && m <= 8) return 1.2;
  if (m === 11 || m === 1 || m === 2 || m === 3) return 0.9;
  return 1;
}

/** Booking lead-time multiplier for transport. */
export function leadTimeFactor(startIso, todayIso) {
  const lead = diffDays(todayIso, startIso);
  if (Number.isNaN(lead)) return 1;
  if (lead < 14) return 1.3;
  if (lead < 45) return 1.1;
  if (lead > 120) return 0.95;
  return 1;
}

function range(mid, spread) {
  return { mid, min: mid * (1 - spread), max: mid * (1 + spread) };
}

// Continental groups used to decide whether a trip can realistically be done overland.
const LAND_GROUPS = {
  americas: ['US', 'CA', 'MX', 'BR', 'AR'],
  africa: ['EG', 'MA', 'TN', 'ZA', 'KE'],
  asia: ['TH', 'VN', 'CN', 'IN', 'KR', 'JP', 'ID', 'LK', 'MV'],
};
// Islands without a practical bus/train link to the mainland.
const ISLANDS = ['CY', 'MT', 'IS', 'MV', 'LK', 'ID', 'JP', 'NZ', 'AU'];
const GROUND_POSSIBLE_MAX_KM = 2200;

function landGroup(code) {
  return Object.keys(LAND_GROUPS).find((g) => LAND_GROUPS[g].includes(code)) || 'eurasia';
}

/** Whether a bus/train/car trip between the two countries is realistic at all. */
export function groundPossible(originCode, destCode) {
  const o = getCountry(originCode);
  const d = getCountry(destCode);
  if (!o || !d) return false;
  if (ISLANDS.includes(originCode) || ISLANDS.includes(destCode)) return false;
  if (landGroup(originCode) !== landGroup(destCode)) return false;
  return distanceKm(o, d) <= GROUND_POSSIBLE_MAX_KM;
}

/** Default mode the cost model assumes for a route. */
export function defaultMode(originCode, destCode) {
  const km = distanceKm(getCountry(originCode), getCountry(destCode));
  return km <= GROUND_TRANSPORT_MAX_KM && groundPossible(originCode, destCode) ? 'ground' : 'flight';
}

/**
 * Round-trip transport estimate in EUR (demo model).
 * `mode` forces 'flight' or 'ground'; otherwise the route's default is used.
 * @returns {{ mode, km, perPerson: {mid,min,max}, group: {mid,min,max}, groupMid }}
 */
export function transportCost({ origin, destination, travellers, transport = 'standard', startDate, today, mode }) {
  const o = getCountry(origin);
  const d = getCountry(destination);
  if (!o || !d) return null;
  const km = distanceKm(o, d);
  const m = mode || defaultMode(origin, destination);
  const people = Math.max(1, Math.round(travellers || 1));
  const level = TRANSPORT_LEVELS.includes(transport) ? transport : 'standard';
  // Round trip per person; flights include ~30 EUR of airport transfers.
  const base = m === 'ground' ? 2 * (12 + 0.08 * km) : 2 * (40 + 0.055 * km) + 30;
  const pp = base * TRANSPORT_FACTOR[level] * seasonFactor(startDate) * leadTimeFactor(startDate, today);
  const perPerson = range(pp, SPREAD.transport);
  const group = range(pp * people, SPREAD.transport);
  return { mode: m, km, perPerson, group, groupMid: group.mid };
}

/**
 * Estimate trip costs in EUR.
 * @param {object} p
 * @param {string} p.origin        ISO code of departure country
 * @param {string} p.destination   ISO code of destination country
 * @param {string} p.startDate     ISO date of the first trip day
 * @param {number} p.days          trip length in days (first and last day included)
 * @param {number} p.travellers    number of people (>= 1)
 * @param {string} [p.style]       optional holiday style key
 * @param {string} [p.stay]        budget | standard | comfort
 * @param {string} [p.transport]   economy | standard | flexible
 * @param {string} p.today         ISO date used for lead-time pricing
 */
export function estimateTripCosts(p) {
  const origin = getCountry(p.origin);
  const dest = getCountry(p.destination);
  if (!origin || !dest) return null;
  const days = Math.max(1, Math.round(p.days));
  const people = Math.max(1, Math.round(p.travellers));
  const nights = Math.max(0, days - 1);
  const rooms = Math.ceil(people / 2);
  const stay = STAY_LEVELS.includes(p.stay) ? p.stay : 'standard';
  const transport = TRANSPORT_LEVELS.includes(p.transport) ? p.transport : 'standard';
  const idx = dest.priceIndex;
  const season = seasonFactor(p.startDate);
  const lead = leadTimeFactor(p.startDate, p.today);
  const style = STYLE_FACTORS[p.style] || { activities: 1, food: 1 };

  const { km, mode, groupMid: transportMid } = transportCost({ ...p, travellers: people, transport });

  const accommodationMid = BASE.roomPerNight[stay] * idx * rooms * nights * season;
  const foodMid = BASE.foodPerPersonDay[stay] * idx * people * days * style.food;
  const localMid = BASE.localPerPersonDay[stay] * idx * people * days;
  const activitiesMid = BASE.activitiesPerPersonDay[stay] * idx * people * days * style.activities;

  const categories = {
    transport: range(transportMid, SPREAD.transport),
    accommodation: range(accommodationMid, SPREAD.accommodation),
    food: range(foodMid, SPREAD.food),
    local: range(localMid, SPREAD.local),
    activities: range(activitiesMid, SPREAD.activities),
  };
  const total = COST_CATEGORIES.reduce(
    (acc, key) => ({
      mid: acc.mid + categories[key].mid,
      min: acc.min + categories[key].min,
      max: acc.max + categories[key].max,
    }),
    { mid: 0, min: 0, max: 0 },
  );

  return {
    source: PRICING_SOURCE,
    categories,
    total,
    meta: { km, mode, rooms, nights, days, people, stay, transport, season, lead, priceIndex: idx },
  };
}
