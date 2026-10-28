import AccountSelect from "./AccountSelect";
import TransferFeedback from "./TransferFeedback";
import NumberInput from "../../../components/common/NumberInput";

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500";
const labelClass = "mb-1.5 mt-4 block text-sm font-semibold text-slate-700";

function TransferForm({ form, accounts, status, error, formError, lastTransfer, transferStatus, onChange, onSubmit, t }) {
  return (
    <form
      className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6"
      onSubmit={onSubmit}
    >
      {status === "loading" && <p className="text-slate-500">{t("transfer.loadingAccounts")}</p>}
      {status === "succeeded" && accounts.length < 2 && (
        <p className="mt-3 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">
          {t("transfer.needTwoAccounts")}
        </p>
      )}

      <div className="mt-3">
        <TransferFeedback status={transferStatus} error={error} formError={formError} lastTransfer={lastTransfer} t={t} />
      </div>

      <AccountSelect
        id="fromId"
        name="fromId"
        label={t("transfer.fromLabel")}
        placeholder={t("transfer.fromPlaceholder")}
        accounts={accounts}
        value={form.fromId}
        onChange={onChange}
      />
      <AccountSelect
        id="toId"
        name="toId"
        label={t("transfer.toLabel")}
        placeholder={t("transfer.toPlaceholder")}
        accounts={accounts}
        value={form.toId}
        onChange={onChange}
      />

      <label htmlFor="amount" className={labelClass}>
        {t("transfer.amountLabel")}
      </label>
      <NumberInput
        id="amount"
        name="amount"
        min="0.01"
        step="0.01"
        value={form.amount}
        onChange={onChange}
        required
        className={inputClass}
      />

      <label htmlFor="description" className={labelClass}>
        {t("transfer.descriptionLabel")}
      </label>
      <input
        id="description"
        name="description"
        value={form.description}
        onChange={onChange}
        className={inputClass}
      />

      <button
        type="submit"
        disabled={transferStatus === "loading"}
        className="mt-6 min-h-11 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {transferStatus === "loading" ? t("transfer.submitting") : t("transfer.submit")}
      </button>
    </form>
  );
}

export default TransferForm;
