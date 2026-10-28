import { useTranslation } from "react-i18next";
import CategorySelect from "../../categories/components/CategorySelect";
import NumberInput from "../../../components/common/NumberInput";
import { inputClass, labelClass } from "../constants";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";
import FormModal from "../../../components/common/FormModal";


function ExpenseForm({ form, setForm, handleChange, handleSubmit, onClose, createStatus, createError }) {
  const { t } = useTranslation();

  return (
    <FormModal title={t("expenses.addFormTitle")} onClose={onClose} closeDisabled={createStatus === "loading"}>
      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className={labelClass}>{t("expenses.fields.description")}</label>
          <input
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={t("expenses.descriptionPlaceholder")}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="amount" className={labelClass}>{t("expenses.fields.amount")}</label>
          <NumberInput
            id="amount"
            name="amount"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="date" className={labelClass}>{t("expenses.fields.date")}</label>
          <DatePicker
            id="date"
            required
            value={form.date}
            onChange={(value) => handleChange({ target: { name: "date", value } })}
            className={`${inputClass} font-medium text-slate-800`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="paymentMethod" className={labelClass}>{t("expenses.fields.paymentMethod")}</label>
          <Select
            id="paymentMethod"
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="cash">{t("expenses.paymentMethod.cash")}</option>
            <option value="card">{t("expenses.paymentMethod.card")}</option>
            <option value="wallet">{t("expenses.paymentMethod.wallet")}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="expenseType" className={labelClass}>{t("expenses.fields.expenseType")}</label>
          <Select
            id="expenseType"
            name="expenseType"
            required
            value={form.expenseType}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">{t("expenses.selectType")}</option>
            <option value="daily">{t("expenses.expenseType.daily")}</option>
            <option value="fixed">{t("expenses.expenseType.fixed")}</option>
            <option value="emergency">{t("expenses.expenseType.emergency")}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category" className={labelClass}>{t("expenses.fields.category")}</label>
          <CategorySelect
            required
            value={form.category}
            expenseType={form.expenseType}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, category: value }))
            }
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="notes" className={labelClass}>{t("expenses.fields.notes")}</label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder={t("expenses.notesPlaceholder")}
            rows="2"
            className={`${inputClass} min-h-18 resize-none`}
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
            {createStatus === "loading" ? t("expenses.submitting") : t("expenses.submit")}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

export default ExpenseForm;
