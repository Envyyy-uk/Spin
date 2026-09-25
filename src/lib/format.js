// Locale-aware formatting with safe fallbacks for engines with limited Intl.
import { parseISO } from './dates.js';
import { getCurrency } from '../data/currencies.js';

export const LOCALE_TAGS = {
  en: 'en-GB',
  uk: 'uk-UA',
  ru: 'ru-RU',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
};

function tag(lang) {
  return LOCALE_TAGS[lang] || 'en-GB';
}

function groupDigits(n) {
  const s = String(Math.round(Math.abs(n)));
  return (n < 0 ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatNumber(value, lang, options = {}) {
  if (!Number.isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat(tag(lang), { maximumFractionDigits: 0, ...options }).format(value);
  } catch {
    return groupDigits(value);
  }
}

export function formatMoney(value, currency, lang) {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  try {
    return new Intl.NumberFormat(tag(lang), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${groupDigits(rounded)} ${getCurrency(currency).symbol}`;
  }
}

export function formatMoneyRange(min, max, currency, lang) {
  if (Math.round(min) === Math.round(max)) return formatMoney(min, currency, lang);
  return `${formatMoney(min, currency, lang)} – ${formatMoney(max, currency, lang)}`;
}

export function formatDate(iso, lang, style = 'medium') {
  const d = parseISO(iso);
  if (!d) return iso || '—';
  const opts =
    style === 'short'
      ? { day: 'numeric', month: 'short' }
      : style === 'long'
        ? { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'short', year: 'numeric' };
  try {
    return new Intl.DateTimeFormat(tag(lang), opts).format(d);
  } catch {
    return iso;
  }
}

export function formatPercent(fraction, lang) {
  if (!Number.isFinite(fraction)) return '—';
  try {
    return new Intl.NumberFormat(tag(lang), { style: 'percent', maximumFractionDigits: 0 }).format(fraction);
  } catch {
    return `${Math.round(fraction * 100)}%`;
  }
}
