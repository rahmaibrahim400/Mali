import { todayISODate } from "../../utils/formatAmount";

export const getTodayString = todayISODate;

export const INCOME_CURRENCIES = ["EGP", "USD", "EUR", "GBP"];

export const EMPTY_FORM = {
  name: "",
  category: "salary",
  amount: "",
  currency: "EGP",
  receivedDate: getTodayString(),
  recurrence: "once",
  status: "cleared",
  accountId: "",
  notes: "",
};

export const inputClass =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500";

export const labelClass = "text-sm font-semibold text-slate-700";

export const errorClass =
  "rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";

export function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}
