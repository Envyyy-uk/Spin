import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { pluralCategory } from '../lib/plural.js';
import { LANGUAGES, SUPPORTED, DEFAULT_LANG, dictionaries } from './languages.js';
import { translate } from './translate.js';

export { LANGUAGES, SUPPORTED, DEFAULT_LANG };

const STORAGE_KEY = 'spin.language';

export function detectDeviceLanguage() {
  try {
    const locales = getLocales() || [];
    for (const l of locales) {
      const code = (l.languageCode || '').toLowerCase();
      if (SUPPORTED.includes(code)) return code;
    }
  } catch {
    // Localization unavailable – fall back to English.
  }
  return DEFAULT_LANG;
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      let initial = null;
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED.includes(saved)) initial = saved;
      } catch {
        // Storage unavailable (private mode etc.) – ignore.
      }
      if (!initial) {
        // First launch only: use the device language when supported.
        initial = detectDeviceLanguage();
        try {
          await AsyncStorage.setItem(STORAGE_KEY, initial);
        } catch {
          // ignore
        }
      }
      if (alive) {
        setLangState(initial);
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.title = translate(dictionaries, lang, 'app.documentTitle');
    }
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!SUPPORTED.includes(code)) return;
    setLangState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const value = useMemo(() => {
    const t = (key, params) => translate(dictionaries, lang, key, params);
    const tp = (key, count, params = {}) => {
      const cat = pluralCategory(lang, count);
      return translate(dictionaries, lang, `${key}.${cat}`, { count, ...params }, `${key}.other`);
    };
    return { lang, setLang, t, tp, ready };
  }, [lang, setLang, ready]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
