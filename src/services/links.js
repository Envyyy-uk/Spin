// Deep links to public search pages of third-party services. These open a
// search pre-filled with the trip parameters; they do not imply availability.
import { config } from './config.js';

const enc = encodeURIComponent;

const BOOKING_LANG = { en: 'en-gb', uk: 'uk', ru: 'ru', es: 'es', fr: 'fr', de: 'de', it: 'it' };

export function bookingSearch({ place, checkIn, checkOut, adults, rooms, lang }) {
  const params = [
    `ss=${enc(place)}`,
    checkIn && `checkin=${checkIn}`,
    checkOut && `checkout=${checkOut}`,
    `group_adults=${adults}`,
    `no_rooms=${rooms}`,
    'group_children=0',
    `lang=${BOOKING_LANG[lang] || 'en-gb'}`,
    config.bookingAffiliateId && `aid=${enc(config.bookingAffiliateId)}`,
  ].filter(Boolean);
  return `https://www.booking.com/searchresults.html?${params.join('&')}`;
}

export function airbnbSearch({ place, checkIn, checkOut, adults }) {
  const params = [checkIn && `checkin=${checkIn}`, checkOut && `checkout=${checkOut}`, `adults=${adults}`].filter(Boolean);
  return `https://www.airbnb.com/s/${enc(place)}/homes?${params.join('&')}`;
}

export function mapsSearch(query) {
  return `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;
}

export function getYourGuideSearch(query) {
  return `https://www.getyourguide.com/s/?q=${enc(query)}`;
}

export function tripadvisorSearch(query) {
  return `https://www.tripadvisor.com/Search?q=${enc(query)}`;
}

export function flightsSearch({ from, to, depart, ret, adults }) {
  const q = `Flights from ${from} to ${to} on ${depart} through ${ret} for ${adults} adults`;
  return `https://www.google.com/travel/flights?q=${enc(q)}`;
}

export function rome2rioSearch({ from, to }) {
  return `https://www.rome2rio.com/map/${enc(from)}/${enc(to)}`;
}

// --- Tickets -----------------------------------------------------------------
// Dates are ISO (YYYY-MM-DD). Airport/city codes are IATA.

function yymmdd(iso) {
  return iso ? iso.slice(2).replace(/-/g, '') : '';
}

export function skyscannerSearch({ fromCode, toCode, depart, ret, adults }) {
  const path = [fromCode.toLowerCase(), toCode.toLowerCase(), yymmdd(depart), ret ? yymmdd(ret) : null].filter(Boolean).join('/');
  return `https://www.skyscanner.net/transport/flights/${path}/?adultsv2=${adults}&cabinclass=economy`;
}

export function kayakSearch({ fromCode, toCode, depart, ret, adults }) {
  const dates = [depart, ret].filter(Boolean).join('/');
  return `https://www.kayak.com/flights/${fromCode}-${toCode}/${dates}/${adults}adults`;
}

export function transitDirections({ from, to }) {
  return `https://www.google.com/maps/dir/?api=1&origin=${enc(from)}&destination=${enc(to)}&travelmode=transit`;
}

export function blablacarSearch({ from, to, depart, adults }) {
  return `https://www.blablacar.com/search?fn=${enc(from)}&tn=${enc(to)}&db=${depart}&seats=${adults}`;
}

export function webSearch(query) {
  return `https://www.google.com/search?q=${enc(query)}`;
}
