const DEFAULT_PAID_PLAN_PRICES = {
  "3months": 1999,
  "6months": 2999,
  yearly: 4999,
};

function configuredPrice(environmentKey, defaultValue) {
  const value = process.env[environmentKey];
  if (value === undefined || value === "") return defaultValue;

  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`${environmentKey} must be a non-negative number`);
  }

  return price;
}

const PLAN_PRICES = {
  trial: 0,
  "3months": configuredPrice("SUBSCRIPTION_PRICE_3MONTHS", DEFAULT_PAID_PLAN_PRICES["3months"]),
  "6months": configuredPrice("SUBSCRIPTION_PRICE_6MONTHS", DEFAULT_PAID_PLAN_PRICES["6months"]),
  yearly: configuredPrice("SUBSCRIPTION_PRICE_YEARLY", DEFAULT_PAID_PLAN_PRICES.yearly),
  custom: 0,
};

const PAID_PLAN_KEYS = ["3months", "6months", "yearly"];

// The prices in force: what the admin saved (Settings → Payments), else the defaults above.
function pricesFrom(settings) {
  const saved = settings?.planPrices ?? {};
  const prices = { ...PLAN_PRICES };
  for (const plan of PAID_PLAN_KEYS) {
    const value = saved[plan];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) prices[plan] = value;
  }
  return prices;
}

async function getPlanPrices() {
  // Required here so this config file never loads the models at start-up.
  const PaymentSettings = require("../models/PaymentSettings");
  return pricesFrom(await PaymentSettings.get());
}

module.exports = { PLAN_PRICES, PAID_PLAN_KEYS, pricesFrom, getPlanPrices, SUBSCRIPTION_CURRENCY: "EGP" };
