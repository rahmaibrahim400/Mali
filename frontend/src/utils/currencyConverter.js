/**
 * Client-side currency conversion utility.
 *
 * Provides approximate exchange rates so the UI can display a meaningful
 * single-currency total when income items are recorded in different currencies.
 * The backend intentionally skips conversion (incomeController line 181), so
 * this lives on the client only.
 *
 * Rates are relative to EGP (Egyptian Pound) as the base currency.
 * 1 unit of foreign currency = X EGP.
 */

const RATES_TO_EGP = {
  EGP: 1,
  USD: 49.5,
  EUR: 54.0,
  GBP: 62.5,
};

/**
 * Convert an amount from one currency to another.
 *
 * @param {number}  amount   – The monetary value to convert.
 * @param {string}  from     – Source currency code (e.g. "USD").
 * @param {string}  to       – Target currency code (e.g. "EGP").
 * @returns {number} The converted amount, rounded to two decimal places.
 */
export function convertAmount(amount, from, to) {
  if (!amount || from === to) return Number(amount) || 0;

  const fromRate = RATES_TO_EGP[from] ?? 1;
  const toRate = RATES_TO_EGP[to] ?? 1;

  return Math.round(((Number(amount) * fromRate) / toRate) * 100) / 100;
}

/**
 * Aggregate an array of { amount, currency } objects into a single total
 * expressed in `targetCurrency`.
 *
 * @param {{ amount: number, currency: string }[]} items
 * @param {string} targetCurrency – The desired output currency code.
 * @returns {number} The aggregated total in `targetCurrency`.
 */
export function convertTotalToBase(items, targetCurrency = "EGP") {
  return items.reduce((total, item) => {
    const amount = Number(item.amount) || 0;
    const currency = item.currency || "EGP";
    return total + convertAmount(amount, currency, targetCurrency);
  }, 0);
}

/**
 * All supported currency codes.
 */
export const SUPPORTED_CURRENCIES = Object.keys(RATES_TO_EGP);
