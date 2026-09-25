import { useEffect, useReducer, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, todayISO } from '../lib/dates';
import { getCurrency } from '../data/currencies';
import { getCountry } from '../data/countries';

const STEP_ORDER = ['home', 'setup', 'wheels', 'plan'];

export const STYLE_KEYS = ['sea', 'culture', 'nature', 'food', 'adventure', 'relax'];
const STORAGE_KEY = 'spin.state.v1';

export function roundNice(x) {
  if (!(x > 0)) return x;
  const mag = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1);
  return Math.round(x / mag) * mag;
}

export function initialState(today = todayISO(), origin = '') {
  return {
    step: 'home',
    setup: {
      origin,
      dateMode: 'exact',
      startDate: addDays(today, 30),
      endDate: addDays(today, 36),
      windowStart: addDays(today, 30),
      windowEnd: addDays(today, 60),
      travellers: '2',
      currency: 'EUR',
      rate: '1',
    },
    destSettings: { excluded: [], byStyle: false },
    durationSettings: { min: '3', max: '14', step: '1' },
    budgetSettings: { min: '500', max: '5000', step: '500' },
    styleSettings: { enabled: false, options: [...STYLE_KEYS] },
    selection: { destination: null, duration: null, budget: null, style: null, tripStart: null },
    plan: { stay: 'standard', transport: 'standard' },
    spinCount: 0,
  };
}

function convertAmount(value, factor) {
  const n = Number(value);
  if (!(n > 0)) return value;
  return roundNice(n * factor);
}

export function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.state };
    case 'step': {
      const from = STEP_ORDER.indexOf(state.step);
      const to = STEP_ORDER.indexOf(action.step);
      return { ...state, step: action.step, stepDirection: to >= from ? 1 : -1 };
    }
    case 'setup': {
      const setup = { ...state.setup, ...action.patch };
      const selection = { ...state.selection };
      if (action.patch.origin && selection.destination === action.patch.origin) selection.destination = null;
      if (action.patch.dateMode || action.patch.windowStart || action.patch.windowEnd) selection.tripStart = null;
      return { ...state, setup, selection };
    }
    case 'currency': {
      const oldRate = Number(state.setup.rate) || 1;
      const next = getCurrency(action.code);
      const factor = next.rate / oldRate;
      const b = state.budgetSettings;
      return {
        ...state,
        setup: { ...state.setup, currency: next.code, rate: String(next.rate) },
        budgetSettings: {
          min: String(convertAmount(b.min, factor)),
          max: String(convertAmount(b.max, factor)),
          step: String(convertAmount(b.step, factor)),
        },
        selection: {
          ...state.selection,
          budget: state.selection.budget ? convertAmount(state.selection.budget, factor) : null,
        },
      };
    }
    case 'destSettings':
      return { ...state, destSettings: { ...state.destSettings, ...action.patch } };
    case 'durationSettings':
      return { ...state, durationSettings: { ...state.durationSettings, ...action.patch } };
    case 'budgetSettings':
      return { ...state, budgetSettings: { ...state.budgetSettings, ...action.patch } };
    case 'styleSettings': {
      const styleSettings = { ...state.styleSettings, ...action.patch };
      const selection = { ...state.selection };
      if (styleSettings.enabled === false) selection.style = null;
      return { ...state, styleSettings, selection };
    }
    case 'select':
      return { ...state, selection: { ...state.selection, ...action.patch } };
    case 'plan':
      return { ...state, plan: { ...state.plan, ...action.patch } };
    case 'spinAll':
      return { ...state, spinCount: state.spinCount + 1 };
    case 'reset':
      return initialState(todayISO(), state.setup.origin);
    default:
      return state;
  }
}

/** Keep only well-formed saved data so a corrupted store never crashes the app. */
function sanitize(saved, base) {
  if (!saved || typeof saved !== 'object') return null;
  const out = {};
  for (const key of ['setup', 'destSettings', 'durationSettings', 'budgetSettings', 'styleSettings', 'selection', 'plan']) {
    if (saved[key] && typeof saved[key] === 'object') out[key] = { ...base[key], ...saved[key] };
  }
  if (out.setup && out.setup.origin && !getCountry(out.setup.origin)) out.setup.origin = '';
  if (out.destSettings && !Array.isArray(out.destSettings.excluded)) out.destSettings.excluded = [];
  if (out.styleSettings && !Array.isArray(out.styleSettings.options)) out.styleSettings.options = [...STYLE_KEYS];
  // The step is not restored: every launch opens on the home screen, which offers “continue”.
  return out;
}

export function useTripStore(defaultOrigin) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(todayISO(), defaultOrigin));
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const data = sanitize(JSON.parse(raw), initialState(todayISO(), defaultOrigin));
        if (data) dispatch({ type: 'hydrate', state: data });
      })
      .catch(() => {})
      .finally(() => alive && setHydrated(true));
    return () => {
      alive = false;
    };
  }, [defaultOrigin]);

  useEffect(() => {
    if (!hydrated) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const { spinCount, step, stepDirection, ...rest } = state;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest)).catch(() => {});
    }, 300);
    return () => clearTimeout(timer.current);
  }, [state, hydrated]);

  return [state, dispatch, hydrated];
}
