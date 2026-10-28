import { todayISODate } from "../../utils/formatAmount";

const EMPTY_FORM = {
  description: "",
  amount: "",
  date: todayISODate(),
  paymentMethod: "cash",
  expenseType: "",
  category: "",
  accountId: "",
  notes: "",
};

const EMPTY_FILTERS = {
  period: "all",
  startDate: "",
  endDate: "",
  type: "all",
  category: "all",
  account: "all",
};

const TYPE_PILL_STYLES = {
  daily: "bg-red-100 text-red-700",
  fixed: "bg-yellow-100 text-yellow-700",
  emergency: "bg-slate-200 text-slate-700",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 bg-white";
const labelClass = "text-sm font-semibold text-slate-700";


export { EMPTY_FORM, EMPTY_FILTERS, TYPE_PILL_STYLES, inputClass, labelClass };

export const FALLBACK_CATEGORY_COLORS = {
    "أكل": "#ff9b51",
    "مواصلات": "#3b82f6",
    "إيجار": "#f59e0b",
    "فواتير": "#8b5cf6",
    "صحة": "#10b981",
    "تعليم": "#0ea5e9",
    "تسلية": "#ec4899",
    "غيره": "#6b7280",
};
