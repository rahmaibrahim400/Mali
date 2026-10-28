import FormModal from "../../../components/common/FormModal";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";
import NumberInput from "../../../components/common/NumberInput";
import { currencyName } from "../../../utils/formatAmount";
import { INCOME_CURRENCIES } from "../constants";

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500";
const labelClass = "text-sm font-semibold text-slate-700";

function IncomeForm({ form, createStatus, createError, onChange, onSubmit, onCancel, t }) {
  return (
    <FormModal title={t("income.formTitle")} onClose={onCancel} closeDisabled={createStatus === "loading"}>
      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-name" className={labelClass}>
            {t("income.nameLabel")}
          </label>
          <input
            id="income-name"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder={t("income.namePlaceholder")}
            maxLength={100}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-category" className={labelClass}>
            {t("income.categoryLabel")}
          </label>
          <Select
            id="income-category"
            name="category"
            required
            value={form.category}
            onChange={onChange}
            className={inputClass}
          >
            <option value="">{t("income.categoryPlaceholder")}</option>
            {["salary", "freelance", "rental", "investment", "other"].map((category) => (
              <option key={category} value={category}>
                {t(`income.categories.${category}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-amount" className={labelClass}>
            {t("income.amountLabel")}
          </label>
          <NumberInput
            id="income-amount"
            name="amount"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={onChange}
            placeholder="0.00"
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-currency" className={labelClass}>
            {t("income.currencyLabel")}
          </label>
          <Select
            id="income-currency"
            name="currency"
            value={form.currency}
            onChange={onChange}
            className={inputClass}
          >
            {INCOME_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyName(code)}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-date" className={labelClass}>
            {t("income.receivedDateLabel")}
          </label>
          <DatePicker
            id="income-date"
            required
            value={form.receivedDate}
            onChange={(value) => onChange({ target: { name: "receivedDate", value } })}
            className={`${inputClass} font-medium text-slate-800`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-recurrence" className={labelClass}>
            {t("income.recurrenceLabel")}
          </label>
          <Select
            id="income-recurrence"
            name="recurrence"
            value={form.recurrence || "once"}
            onChange={onChange}
            className={inputClass}
          >
            {["once", "weekly", "monthly", "yearly"].map((key) => (
              <option key={key} value={key}>
                {t(`income.recurrence.${key}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="income-notes" className={labelClass}>
            {t("income.notesLabel")}
          </label>
          <textarea
            id="income-notes"
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder={t("income.notesPlaceholder")}
            maxLength={500}
            rows="2"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-col justify-end gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          {createError && (
            <p className="rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">
              {createError}
            </p>
          )}
          <button
            type="submit"
            disabled={createStatus === "loading"}
            className="ms-auto min-h-11 w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-65 sm:w-auto"
          >
            {createStatus === "loading" ? t("income.submitting") : t("income.submit")}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

export default IncomeForm;
