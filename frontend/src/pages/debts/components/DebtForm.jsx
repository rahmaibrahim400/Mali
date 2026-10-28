import { useTranslation } from "react-i18next";
import { inputClass, labelClass } from "../constants";
import { CATEGORY_KEYS, CURRENCY_KEYS } from "../constants";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";
import NumberInput from "../../../components/common/NumberInput";
import FormModal from "../../../components/common/FormModal";
import { currencyName } from "../../../utils/formatAmount";

function DebtForm({ onClose, error, debtForm, handleDebtFormChange, handleCreateDebt, savingDebt }) {
  const { t } = useTranslation();

  const categoryLabel = (category) => t(`debts.category.${category || "other"}`);

  return (
    <FormModal title={t("debts.form.title")} onClose={onClose} closeDisabled={savingDebt}>
      <form onSubmit={handleCreateDebt} className="mt-4">
        <p className="mb-3 text-xs text-slate-400">{t("debts.form.requiredNote")}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="debt-creditor" className={labelClass}>
              {t("debts.form.creditorLabel")} <span className="text-red-500">*</span>
            </label>
            <input
              id="debt-creditor"
              required
              name="creditor"
              placeholder={t("debts.form.creditorPlaceholder")}
              value={debtForm.creditor}
              onChange={handleDebtFormChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="debt-amount" className={labelClass}>
              {t("debts.form.totalAmountLabel")} <span className="text-red-500">*</span>
            </label>
            <NumberInput
              id="debt-amount"
              required
              min="0.01"
              step="0.01"
              name="totalAmount"
              placeholder="0.00"
              value={debtForm.totalAmount}
              onChange={handleDebtFormChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="debt-currency" className={labelClass}>
              {t("debts.form.currencyLabel")} <span className="text-red-500">*</span>
            </label>
            <Select
              id="debt-currency"
              required
              name="currency"
              value={debtForm.currency}
              onChange={handleDebtFormChange}
              className={inputClass}
            >
              {CURRENCY_KEYS.map((code) => (
                <option key={code} value={code}>{currencyName(code)}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="debt-category" className={labelClass}>
              {t("debts.form.categoryLabel")}
            </label>
            <Select
              id="debt-category"
              name="category"
              value={debtForm.category}
              onChange={handleDebtFormChange}
              className={inputClass}
            >
              {CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>{categoryLabel(key)}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="debt-start" className={labelClass}>
              {t("debts.form.startDateLabel")} <span className="text-red-500">*</span>
            </label>
            <DatePicker
              id="debt-start"
              required
              value={debtForm.startDate}
              max={debtForm.dueDate || undefined}
              onChange={(value) => handleDebtFormChange({ target: { name: "startDate", value } })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="debt-due" className={labelClass}>
              {t("debts.form.dueDateLabel")} <span className="text-red-500">*</span>
            </label>
            <DatePicker
              id="debt-due"
              required
              value={debtForm.dueDate}
              min={debtForm.startDate || undefined}
              onChange={(value) => handleDebtFormChange({ target: { name: "dueDate", value } })}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="debt-notes" className={labelClass}>{t("debts.form.notesLabel")}</label>
            <textarea
              id="debt-notes"
              name="description"
              rows={2}
              placeholder={t("debts.form.notesPlaceholder")}
              value={debtForm.description}
              onChange={handleDebtFormChange}
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">
            {error}
          </p>
        )}

        <div className="mt-5">
          <button
            type="submit"
            disabled={savingDebt}
            className="min-h-11 w-full rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 disabled:opacity-60"
          >
            {savingDebt ? t("debts.form.saving") : t("debts.form.save")}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

export default DebtForm;
