// "How much do I really need?" calculator: estimates the trip at every
// accommodation level and compares it with the amount the user has.
// All values in EUR (demo cost model — approximate, never live prices).

import { estimateTripCosts, STAY_LEVELS } from '../services/pricingService.js';
import { budgetStatus } from './budget.js';
import { inclusiveDays } from './dates.js';

/**
 * @param {object} p origin, destination, startDate, endDate, travellers,
 *                   transport, mode, today, amountEur (optional)
 */
export function calculateNeeds(p) {
  const days = inclusiveDays(p.startDate, p.endDate);
  if (!(days > 0)) return null;
  const people = Math.max(1, p.travellers);
  const levels = {};
  for (const stay of STAY_LEVELS) {
    const e = estimateTripCosts({ ...p, days, travellers: people, stay });
    if (!e) return null;
    levels[stay] = e;
  }
  const amount = p.amountEur > 0 ? p.amountEur : null;
  const comparison = amount
    ? Object.fromEntries(STAY_LEVELS.map((s) => [s, { status: budgetStatus(levels[s], amount), diff: amount - levels[s].total.mid }]))
    : null;
  // Best level the amount comfortably covers (typical estimate fits).
  const affordable = amount ? [...STAY_LEVELS].reverse().find((s) => levels[s].total.mid <= amount) || null : null;
  return {
    days,
    nights: Math.max(0, days - 1),
    people,
    levels,
    // A sensible amount to have: the standard trip's upper estimate.
    recommended: levels.standard.total.max,
    amount,
    comparison,
    affordable,
  };
}
