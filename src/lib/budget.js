// Budget realism analysis built on top of the (demo) pricing service.
// All money values here are in EUR; the UI converts to the chosen currency.

import { COST_CATEGORIES, estimateTripCosts, seasonFactor } from '../services/pricingService.js';
import { addDays } from './dates.js';

export function budgetStatus(estimate, budgetEur) {
  if (!estimate || !(budgetEur > 0)) return null;
  const { total } = estimate;
  if (total.max <= budgetEur) return 'comfortable';
  if (total.mid <= budgetEur) return 'tight';
  if (total.min <= budgetEur) return 'risky';
  return 'insufficient';
}

/** Categories sorted by their share of the budget, largest first. */
export function costDrivers(estimate, budgetEur) {
  if (!estimate) return [];
  return COST_CATEGORIES.map((key) => ({
    key,
    amount: estimate.categories[key].mid,
    shareOfBudget: budgetEur > 0 ? estimate.categories[key].mid / budgetEur : 0,
    shareOfTotal: estimate.total.mid > 0 ? estimate.categories[key].mid / estimate.total.mid : 0,
  })).sort((a, b) => b.amount - a.amount);
}

/**
 * Concrete ways to make the trip cheaper. Each tip carries the change it
 * proposes (`apply`) so the UI can offer a one-tap fix.
 */
export function savingTips(input, budgetEur, { destinations = [], maxDate } = {}) {
  const base = estimateTripCosts(input);
  if (!base) return [];
  const tips = [];
  const baseTotal = base.total.mid;
  if (baseTotal <= budgetEur) return tips;

  // 1. Shorter trip that fits.
  for (let d = input.days - 1; d >= 1; d -= 1) {
    const e = estimateTripCosts({ ...input, days: d });
    if (e.total.mid <= budgetEur) {
      tips.push({ type: 'shorter', days: d, saving: baseTotal - e.total.mid, apply: { duration: d } });
      break;
    }
  }

  // 2. Cheaper accommodation level.
  if (input.stay !== 'budget') {
    const e = estimateTripCosts({ ...input, stay: 'budget' });
    tips.push({ type: 'stay', level: 'budget', saving: baseTotal - e.total.mid, fits: e.total.mid <= budgetEur, apply: { stay: 'budget' } });
  }

  // 3. Cheaper transport.
  if (input.transport !== 'economy') {
    const e = estimateTripCosts({ ...input, transport: 'economy' });
    tips.push({ type: 'transport', level: 'economy', saving: baseTotal - e.total.mid, fits: e.total.mid <= budgetEur, apply: { transport: 'economy' } });
  }

  // 4. Off-peak dates (search forward in weekly steps, up to ~6 months).
  if (seasonFactor(input.startDate) > 1) {
    for (let w = 1; w <= 26; w += 1) {
      const start = addDays(input.startDate, w * 7);
      if (maxDate && start > maxDate) break;
      if (seasonFactor(start) <= 1) {
        const e = estimateTripCosts({ ...input, startDate: start });
        if (e.total.mid < baseTotal) {
          tips.push({ type: 'dates', startDate: start, saving: baseTotal - e.total.mid, fits: e.total.mid <= budgetEur, apply: { startDate: start } });
        }
        break;
      }
    }
  }

  // 5. Raise the budget.
  tips.push({ type: 'budget', needed: base.total.mid, safe: base.total.max, apply: { budgetEur: base.total.max } });

  // 6. Cheaper destinations from the user's own wheel options.
  const cheaper = destinations
    .filter((code) => code !== input.destination)
    .map((code) => ({ code, e: estimateTripCosts({ ...input, destination: code }) }))
    .filter((x) => x.e && x.e.total.mid <= budgetEur)
    .sort((a, b) => a.e.total.mid - b.e.total.mid)
    .slice(0, 3)
    .map((x) => ({ code: x.code, total: x.e.total.mid }));
  if (cheaper.length) tips.push({ type: 'destination', options: cheaper });

  return tips;
}
