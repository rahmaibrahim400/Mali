import DatePicker from "../../../components/common/DatePicker";

const inputClass =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500";
const labelClass = "text-sm font-semibold text-slate-700";

function TransactionFilters({ start, end, onStartChange, onEndChange, onSubmit, t }) {
  return (
    <form
      className="mt-6 grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:grid-cols-3 sm:items-end sm:p-6"
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="history-start" className={labelClass}>{t("accounts.transactions.startDate")}</label>
        <DatePicker id="history-start" value={start} max={end || undefined} onChange={onStartChange} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="history-end" className={labelClass}>{t("accounts.transactions.endDate")}</label>
        <DatePicker id="history-end" value={end} min={start || undefined} onChange={onEndChange} className={inputClass} />
      </div>

      <button
        type="submit"
        className="min-h-11 w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 sm:w-auto"
      >
        {t("accounts.transactions.filter")}
      </button>
    </form>
  );
}

export default TransactionFilters;
