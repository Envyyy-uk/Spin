// Minimal CLDR-style plural categories for the supported languages.
// (Intl.PluralRules is not guaranteed on every JS engine used by React Native.)
export function pluralCategory(lang, n) {
  const abs = Math.abs(n);
  const int = Number.isInteger(abs);
  switch (lang) {
    case 'uk':
    case 'ru': {
      if (!int) return 'other';
      const m10 = abs % 10;
      const m100 = abs % 100;
      if (m10 === 1 && m100 !== 11) return 'one';
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
      return 'many';
    }
    case 'fr':
      return abs < 2 ? 'one' : 'other';
    default:
      return abs === 1 ? 'one' : 'other';
  }
}
