// Supported budget currencies with DEMO conversion rates (1 EUR = rate).
// These rates are approximate placeholders; the user can edit the rate in the
// app. A live rate provider can be wired in via src/services/ratesService.js.
export const CURRENCIES = [
  { code: 'EUR', rate: 1, symbol: '€' },
  { code: 'USD', rate: 1.1, symbol: '$' },
  { code: 'GBP', rate: 0.86, symbol: '£' },
  { code: 'UAH', rate: 46, symbol: '₴' },
  { code: 'PLN', rate: 4.3, symbol: 'zł' },
  { code: 'CHF', rate: 0.94, symbol: 'CHF' },
  { code: 'CZK', rate: 25, symbol: 'Kč' },
  { code: 'TRY', rate: 45, symbol: '₺' },
];

export const DEFAULT_CURRENCY = 'EUR';

export function getCurrency(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}
