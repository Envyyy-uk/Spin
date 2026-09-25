// Suggestions for accommodation, activities and places.
//
// Without a configured backend (see config.js) this returns DEMO cards: generic
// types of places with rough price ranges from the demo cost model, marked with
// `isExample: true`, plus search links to real services. Nothing here claims
// availability or a confirmed price.
//
// To connect a real provider, implement POST {suggestionsApiUrl}/suggestions
// that accepts the `request` object below and returns
//   { groups: { stay: Card[], activities: Card[], places: Card[] } }
// where Card matches the shape produced by `card()`.

import { config, isDemoMode } from './config.js';
import { getCountry } from '../data/countries.js';
import { getHighlights } from '../data/highlights.js';
import { tripEnd } from '../lib/dates.js';
import {
  airbnbSearch,
  bookingSearch,
  getYourGuideSearch,
  mapsSearch,
  tripadvisorSearch,
} from './links.js';

// price.unit: perNight (whole group, per night) | perPerson | perGroup | perTrip
function card({ id, group, kind, title, titleKey, descKey, descParams, price, links, tags = [] }) {
  return { id, group, kind, title, titleKey, descKey, descParams, price, links, tags, isExample: true };
}

const STYLE_ACTIVITIES = {
  sea: ['boatTrip', 'snorkeling', 'beachDay'],
  culture: ['walkingTour', 'museumPass', 'localShow'],
  nature: ['hiking', 'nationalPark', 'bikeTour'],
  food: ['foodTour', 'cookingClass', 'wineTasting'],
  adventure: ['rafting', 'climbing', 'jeepTour'],
  relax: ['spa', 'thermal', 'yoga'],
};

// Rough per-person prices at price index 1.0 (EUR). Demo only.
const ACTIVITY_PRICE = {
  boatTrip: [35, 80], snorkeling: [30, 70], beachDay: [0, 25],
  walkingTour: [0, 25], museumPass: [20, 60], localShow: [25, 70],
  hiking: [0, 30], nationalPark: [5, 35], bikeTour: [25, 55],
  foodTour: [45, 95], cookingClass: [50, 110], wineTasting: [25, 70],
  rafting: [45, 100], climbing: [40, 90], jeepTour: [40, 110],
  spa: [40, 120], thermal: [20, 60], yoga: [10, 30],
};

const PLACE_PRICE = {
  landmark: [0, 30], museum: [8, 30], nature: [0, 25], beach: [0, 20], oldtown: [0, 0], market: [0, 0],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function scale(pair, idx, factor = 1) {
  return { min: Math.round(pair[0] * idx * factor), max: Math.round(pair[1] * idx * factor) };
}

export function buildRequest(trip) {
  return {
    origin: trip.origin,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: tripEnd(trip.startDate, trip.days),
    days: trip.days,
    travellers: trip.travellers,
    budgetEur: trip.budgetEur,
    style: trip.style || null,
    stay: trip.stay,
    lang: trip.lang,
  };
}

export function demoSuggestions(request) {
  const c = getCountry(request.destination);
  if (!c) return { groups: { stay: [], activities: [], places: [] }, source: 'demo' };
  const idx = c.priceIndex;
  const place = `${c.hub}, ${c.names.en}`;
  const checkIn = request.startDate;
  const checkOut = tripEnd(request.startDate, Math.max(2, request.days));
  const adults = request.travellers;
  const rooms = Math.ceil(adults / 2);
  const lang = request.lang;
  const style = request.style;

  const stayTypes = [
    { kind: 'hostel', perNight: [22, 40], perBed: true, tags: ['budget'] },
    { kind: 'guesthouse', perNight: [40, 75], tags: ['budget', 'standard'] },
    { kind: 'apartment', perNight: [70, 140], wholeUnit: true, tags: ['standard'] },
    { kind: 'hotel', perNight: [90, 160], tags: ['standard'] },
    { kind: 'boutique', perNight: [160, 300], tags: ['comfort'] },
  ];
  if (style === 'sea' || style === 'relax') stayTypes.push({ kind: 'resort', perNight: [150, 320], tags: ['comfort'] });

  const stay = stayTypes.map((s) => {
    // Hostels are priced per bed; apartments per unit sized for the group; rooms hold 2 guests.
    // Apartments sleep up to 4.
    const units = s.perBed ? adults : s.wholeUnit ? Math.ceil(adults / 4) : rooms;
    const price = scale(s.perNight, idx, units);
    const links =
      s.kind === 'apartment'
        ? [{ provider: 'Airbnb', url: airbnbSearch({ place, checkIn, checkOut, adults }) },
           { provider: 'Booking.com', url: bookingSearch({ place, checkIn, checkOut, adults, rooms, lang }) }]
        : [{ provider: 'Booking.com', url: bookingSearch({ place: `${s.kind} ${place}`, checkIn, checkOut, adults, rooms, lang }) }];
    return card({
      id: `stay-${s.kind}`,
      group: 'stay',
      kind: s.kind,
      titleKey: `suggest.stay.${s.kind}.title`,
      descKey: `suggest.stay.${s.kind}.desc`,
      descParams: { city: c.hub, rooms, people: adults, units },
      price: { ...price, unit: 'perNight', scope: 'group' },
      links,
      tags: s.tags,
    });
  });

  const activityKinds = style
    ? [...STYLE_ACTIVITIES[style], ...Object.values(STYLE_ACTIVITIES).flat().filter((k) => !STYLE_ACTIVITIES[style].includes(k)).slice(0, 2)]
    : c.styles.flatMap((s) => STYLE_ACTIVITIES[s]?.slice(0, 2) || []).slice(0, 6);
  const activities = [...new Set(activityKinds)].slice(0, 6).map((kind) => {
    const pp = scale(ACTIVITY_PRICE[kind], idx);
    return card({
      id: `act-${kind}`,
      group: 'activities',
      kind,
      titleKey: `suggest.activity.${kind}.title`,
      descKey: `suggest.activity.${kind}.desc`,
      descParams: { city: c.hub },
      price: { ...pp, unit: 'perPerson', groupMin: pp.min * adults, groupMax: pp.max * adults },
      links: [
        { provider: 'GetYourGuide', url: getYourGuideSearch(`${c.hub}`) },
        { provider: 'Tripadvisor', url: tripadvisorSearch(`${c.hub} things to do`) },
      ],
      tags: style && STYLE_ACTIVITIES[style].includes(kind) ? ['match'] : [],
    });
  });

  const highlights = getHighlights(c.code).map((h, i) => {
    const pp = scale(PLACE_PRICE[h.type] || [0, 20], idx);
    return card({
      id: `place-${i}`,
      group: 'places',
      kind: h.type,
      title: h.name,
      descKey: `suggest.place.${h.type}`,
      descParams: { country: c.code },
      price: { ...pp, unit: 'perPerson', groupMin: pp.min * adults, groupMax: pp.max * adults },
      links: [{ provider: 'Google Maps', url: mapsSearch(`${h.name}, ${c.names.en}`) }],
    });
  });

  const food = [
    { kind: 'streetFood', pp: [6, 15] },
    { kind: 'localRestaurant', pp: [15, 35] },
    { kind: 'fineDining', pp: [50, 120] },
  ].map((f) => {
    const pp = scale(f.pp, idx);
    return card({
      id: `food-${f.kind}`,
      group: 'places',
      kind: f.kind,
      titleKey: `suggest.food.${f.kind}.title`,
      descKey: `suggest.food.${f.kind}.desc`,
      descParams: { city: c.hub },
      price: { ...pp, unit: 'perPerson', groupMin: pp.min * adults, groupMax: pp.max * adults },
      links: [
        { provider: 'Google Maps', url: mapsSearch(`${f.kind === 'streetFood' ? 'street food' : f.kind === 'fineDining' ? 'fine dining' : 'restaurants'} ${c.hub}`) },
        { provider: 'Tripadvisor', url: tripadvisorSearch(`${c.hub} restaurants`) },
      ],
    });
  });

  return { groups: { stay, activities, places: [...highlights, ...food] }, source: 'demo' };
}

async function fetchWithTimeout(url, options, ms) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), ms) : null;
  try {
    return await fetch(url, { ...options, signal: controller?.signal });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Fetch suggestions from the configured backend, or demo data when none is configured. */
export async function getSuggestions(trip) {
  const request = buildRequest(trip);
  if (isDemoMode) {
    await sleep(450); // keeps loading states visible and mirrors a network call
    return demoSuggestions(request);
  }
  const res = await fetchWithTimeout(
    `${config.suggestionsApiUrl.replace(/\/$/, '')}/suggestions`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) },
    config.requestTimeoutMs,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return { groups: data.groups || { stay: [], activities: [], places: [] }, source: 'api' };
}
