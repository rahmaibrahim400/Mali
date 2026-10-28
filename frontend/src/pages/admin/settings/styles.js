export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
export const labelClass = "text-sm font-semibold text-slate-700";
export const errorClass = "rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";
export const successClass = "rounded-xl bg-income-soft px-4 py-2.5 text-sm font-medium text-income";
export const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-wait disabled:opacity-65";
export const linkButton =
  "inline-flex min-h-10 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 sm:self-center";

export const requestError = (error, fallback) => error.response?.data?.message || fallback;
