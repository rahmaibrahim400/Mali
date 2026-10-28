import { todayISODate } from "../../utils/formatAmount";

export const getTodayString = todayISODate;

export const EMPTY_GOAL_FORM = {
  name: "",
  emoji: "PiggyBank",
  targetAmount: "",
  currency: "EGP",
  targetDate: "",
  description: "",
};

export const CURRENCY_KEYS = ["EGP", "USD", "EUR", "SAR", "AED"];

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500";
export const labelClass = "block text-sm font-semibold text-slate-700 mb-1";
