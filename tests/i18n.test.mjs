import test from 'node:test';
import assert from 'node:assert/strict';
import { dictionaries, SUPPORTED, DEFAULT_LANG } from '../src/i18n/languages.js';
import { translate } from '../src/i18n/translate.js';

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const PLURAL_FORMS = ['one', 'few', 'many', 'other'];
const base = (key) => (PLURAL_FORMS.includes(key.split('.').pop()) && key.startsWith('plural.') ? key.split('.').slice(0, -1).join('.') : key);
const params = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('English is the default language', () => {
  assert.equal(DEFAULT_LANG, 'en');
  assert.deepEqual(SUPPORTED, ['en', 'uk', 'ru', 'es', 'fr', 'de', 'it']);
});

for (const lang of SUPPORTED.filter((l) => l !== 'en')) {
  test(`${lang}: every English key is translated with the same placeholders`, () => {
    const en = flatten(dictionaries.en);
    const tr = flatten(dictionaries[lang]);
    const trBases = new Set(Object.keys(tr).map(base));
    const missing = Object.keys(en).filter((k) => !(k in tr) && !(k.startsWith('plural.') && trBases.has(base(k))));
    assert.deepEqual(missing, [], `missing keys in ${lang}`);
    for (const [k, v] of Object.entries(tr)) {
      const ref = en[k] ?? en[`${base(k)}.other`];
      assert.ok(ref !== undefined, `${lang} has unknown key ${k}`);
      assert.deepEqual(params(v), params(ref), `${lang}:${k} placeholders differ`);
    }
  });
}

test('fallback to English for missing keys and plural selection', () => {
  const dicts = { en: { a: 'A {x}', p: { one: '{count} day', other: '{count} days' } }, uk: { p: { one: '{count} день', few: '{count} дні', many: '{count} днів' } } };
  assert.equal(translate(dicts, 'uk', 'a', { x: 1 }), 'A 1');
  assert.equal(translate(dicts, 'uk', 'p', { count: 3 }), '3 дні');
  assert.equal(translate(dicts, 'uk', 'p', { count: 5 }), '5 днів');
  assert.equal(translate(dicts, 'en', 'p', { count: 1 }), '1 day');
  assert.equal(translate(dicts, 'en', 'missing.key'), 'missing.key');
});
