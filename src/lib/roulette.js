// Travel roulette: the wheels pick the trip length, each traveller's
// contribution to a shared pot, and then a destination the pot can pay for.
// Money is in EUR. All costs come from the demo cost model.

import { COUNTRIES } from '../data/countries.js';
import { estimateTripCosts } from '../services/pricingService.js';

export const ROULETTE_DAYS = [1, 2, 3, 4, 5, 7, 10];
export const ROULETTE_CONTRIBUTIONS = [0, 50, 100, 200, 300, 500, 700, 1000, 1500];
/** Contributions up to this amount are "challenge" sectors on the wheel. */
export const CHALLENGE_MAX = 100;
/** How many destinations a challenge wheel offers when nothing fits the pot. */
export const CHALLENGE_POOL = 8;

export function isChallengeAmount(contribution) {
  return contribution <= CHALLENGE_MAX;
}

/** Cheapest realistic version of a trip: budget stays, cheapest transport. */
export function cheapestTrip(input) {
  return estimateTripCosts({ ...input, stay: 'budget', transport: 'economy', destinationCity: null });
}

/**
 * Destinations for the third wheel.
 * @param {object} p origin, originCity, startDate, days, travellers, contribution, today
 * @returns {{ codes: string[], pot: number, challenge: boolean, noneFit: boolean, costs: Record<string, number> }}
 */
export function rouletteDestinations(p) {
  const people = Math.max(1, p.travellers);
  const pot = p.contribution * people;
  const costs = {};
  for (const c of COUNTRIES) {
    if (c.code === p.origin) continue;
    const e = cheapestTrip({ ...p, destination: c.code, travellers: people });
    if (e) costs[c.code] = e.total.mid;
  }
  const byCost = Object.keys(costs).sort((a, b) => costs[a] - costs[b]);
  const fitting = byCost.filter((code) => costs[code] <= pot);
  const noneFit = fitting.length === 0;
  return {
    codes: noneFit ? byCost.slice(0, CHALLENGE_POOL) : fitting,
    pot,
    challenge: noneFit || isChallengeAmount(p.contribution),
    noneFit,
    costs,
  };
}
