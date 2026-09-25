import en from './locales/en.js';
import uk from './locales/uk.js';
import ru from './locales/ru.js';
import es from './locales/es.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
import it from './locales/it.js';

export const DEFAULT_LANG = 'en';

// Native names are shown in the switcher so users can always find their language.
export const LANGUAGES = [
  { code: 'en', native: 'English' },
  { code: 'uk', native: 'Українська' },
  { code: 'ru', native: 'Русский' },
  { code: 'es', native: 'Español' },
  { code: 'fr', native: 'Français' },
  { code: 'de', native: 'Deutsch' },
  { code: 'it', native: 'Italiano' },
];

export const SUPPORTED = LANGUAGES.map((l) => l.code);

export const dictionaries = { en, uk, ru, es, fr, de, it };
