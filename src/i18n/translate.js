// Pure translation lookup with English fallback and {param} interpolation.
import { pluralCategory } from '../lib/plural.js';

function lookup(dict, key) {
  if (!dict) return undefined;
  let node = dict;
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return node;
}

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (m, name) => (params[name] !== undefined && params[name] !== null ? String(params[name]) : m));
}

/**
 * Resolve `key` in `lang`, falling back to English, then to `altKey`
 * (used for plural "other"), and finally to the key itself.
 */
export function translate(dictionaries, lang, key, params, altKey) {
  const candidates = [
    [dictionaries[lang], key],
    altKey && [dictionaries[lang], altKey],
    lang !== 'en' && [dictionaries.en, key],
    altKey && [dictionaries.en, altKey],
  ].filter(Boolean);
  for (const [dict, k] of candidates) {
    let value = lookup(dict, k);
    if (value && typeof value === 'object' && params && typeof params.count === 'number') {
      value = value[pluralCategory(lang, params.count)] ?? value.other;
    }
    if (typeof value === 'string') return interpolate(value, params);
  }
  return key;
}
