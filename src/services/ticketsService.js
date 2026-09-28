// Ticket search for getting to the destination and back: flights and
// overland options (bus, train, rideshare).
//
// There is no live fare API behind this yet. The service returns
//  - a DEMO fare estimate per mode from the cost model (clearly approximate), and
//  - deep links that open real search pages pre-filled with the route, dates
//    and number of passengers.
// To show live fares later, implement `fetchFares(request)` against your own
// backend (which holds the provider keys) and merge its results into `modes`.

import { getCountry } from '../data/countries.js';
import { place } from '../data/cities.js';
import { tripEnd } from '../lib/dates.js';
import { defaultMode, groundPossible, transportCost } from './pricingService.js';
import {
  blablacarSearch,
  flightsSearch,
  kayakSearch,
  rome2rioSearch,
  skyscannerSearch,
  transitDirections,
  webSearch,
} from './links.js';

export const TICKET_MODES = ['flight', 'ground'];

/**
 * @param {object} trip  origin, destination, startDate, days, travellers, transport, today
 */
export function getTicketOptions(trip) {
  const o = getCountry(trip.origin);
  const d = getCountry(trip.destination);
  if (!o || !d) return null;
  const depart = trip.startDate;
  const ret = tripEnd(trip.startDate, trip.days);
  const adults = Math.max(1, trip.travellers);
  const op = place(o.code, trip.originCity);
  const dp = place(d.code, trip.destinationCity);
  const fromCity = op.city;
  const toCity = dp.city;
  const from = `${fromCity}, ${o.names.en}`;
  const to = `${toCity}, ${d.names.en}`;
  const fromCode = op.iata;
  const toCode = dp.iata;
  const ground = groundPossible(o.code, d.code, trip.originCity, trip.destinationCity);
  const costInput = { ...trip, travellers: adults };

  const flightProviders = [
    { id: 'googleFlights', name: 'Google Flights', kind: 'flight', url: flightsSearch({ from: fromCity, to: toCity, depart, ret, adults }) },
    fromCode && toCode ? { id: 'skyscanner', name: 'Skyscanner', kind: 'flight', url: skyscannerSearch({ fromCode, toCode, depart, ret, adults }) } : null,
    fromCode && toCode ? { id: 'kayak', name: 'KAYAK', kind: 'flight', url: kayakSearch({ fromCode, toCode, depart, ret, adults }) } : null,
  ].filter(Boolean);

  const groundProviders = [
    { id: 'rome2rio', name: 'Rome2Rio', kind: 'all', url: rome2rioSearch({ from, to }) },
    { id: 'googleTransit', name: 'Google Maps', kind: 'train', url: transitDirections({ from, to }) },
    { id: 'blablacar', name: 'BlaBlaCar', kind: 'car', url: blablacarSearch({ from: fromCity, to: toCity, depart, adults }) },
    { id: 'busSearch', name: 'Google', kind: 'bus', url: webSearch(`bus tickets ${fromCity} to ${toCity}`) },
    { id: 'trainSearch', name: 'Google', kind: 'train', url: webSearch(`train tickets ${fromCity} to ${toCity}`) },
  ];

  return {
    source: 'demo',
    route: { from: o.code, to: d.code, fromCity, toCity, fromCode, toCode },
    depart,
    ret,
    passengers: adults,
    defaultMode: defaultMode(o.code, d.code, trip.originCity, trip.destinationCity),
    modes: {
      flight: { available: true, estimate: transportCost({ ...costInput, mode: 'flight' }), providers: flightProviders },
      ground: {
        available: ground,
        estimate: ground ? transportCost({ ...costInput, mode: 'ground' }) : null,
        // Rome2Rio still helps when overland is unlikely: it shows every combination.
        providers: ground ? groundProviders : groundProviders.slice(0, 1),
      },
    },
  };
}
