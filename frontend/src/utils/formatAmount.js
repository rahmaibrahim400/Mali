import i18n from "../i18n/i18n";
import { toIntlLocale } from "../i18n/locale";

// All user-facing numbers, amounts, percentages and dates go through these helpers so they
// follow the active UI language: Arabic-Indic digits (٠١٢…) in Arabic, Western digits in English.

function currentLocale() {
  return toIntlLocale(i18n.language);
}

export function formatNumber(value, options = {}) {
  const number = Number(value);
  return new Intl.NumberFormat(currentLocale(), {
    maximumFractionDigits: 2,
    ...options,
  }).format(Number.isFinite(number) ? number : 0);
}

export const formatAmount = formatNumber;

// `value` is already a percentage (e.g. 42.5 → "42.5%" / "٤٢٫٥٪").
export function formatPercent(value, fractionDigits = 0, options = {}) {
  const number = Number(value);
  return new Intl.NumberFormat(currentLocale(), {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    ...options,
  }).format((Number.isFinite(number) ? number : 0) / 100);
}

export function currencyLabel(code = "EGP") {
  return i18n.t(`currencies.short.${code}`, { defaultValue: code });
}

export function currencyName(code = "EGP") {
  return i18n.t(`currencies.name.${code}`, { defaultValue: code });
}

// Amount followed by the currency in the UI language: "1,250 EGP" / "١٬٢٥٠ ج.م".
export function formatMoney(value, currency = "EGP", options = {}) {
  return `${formatNumber(value, options)} ${currencyLabel(currency || "EGP")}`;
}

export function formatDate(value, options = { year: "numeric", month: "long", day: "numeric" }) {
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(currentLocale(), options);
}

export function formatDateTime(value, options = { dateStyle: "medium", timeStyle: "short" }) {
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(currentLocale(), options).format(date);
}

// Converts Arabic-Indic / Persian digits and Arabic separators typed into a field back to
// plain Western digits so the value can be parsed and sent to the API.
export function normalizeDigits(input) {
  return String(input ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫]/g, ".")
    .replace(/[٬،]/g, "");
}

// Shows a digit string (a code, a phone number) with the UI language's digits.
export function localizeDigits(input) {
  const str = String(input ?? "");
  return i18n.language === "ar" ? str.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d))) : str;
}

// "YYYY-MM-DD" for the user's local calendar day (toISOString() would give the UTC day,
// which is still "yesterday" for the first hours after midnight in Egypt).
export function todayISODate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
