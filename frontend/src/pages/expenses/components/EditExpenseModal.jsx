import { useTranslation } from "react-i18next";
import CategorySelect from "../../categories/components/CategorySelect";
import { formatMoney } from "../../../utils/formatAmount";
import NumberInput from "../../../components/common/NumberInput";
import { inputClass, labelClass } from "../constants";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";


function EditExpenseModal({ editingExpense, setEditingExpense, editForm, setEditForm, handleEditChange, handleEditSubmit, editSaving, editError, availableAccounts }) {
  const { t } = useTranslation();

  return (
    <>
    {editingExpense && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        onClick={() => !editSaving && setEditingExpense(null)}
      >
        <div
          className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">{t("expenses.editModal.title")}</h3>
            <button
              type="button"
              disabled={editSaving}
              onClick={() => setEditingExpense(null)}
              aria-label={t("common.close")}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-description" className={labelClass}>{t("expenses.fields.description")}</label>
              <input
                id="edit-description"
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-amount" className={labelClass}>{t("expenses.fields.amount")}</label>
                <NumberInput
                  id="edit-amount"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-date" className={labelClass}>{t("expenses.fields.date")}</label>
                <DatePicker
                  id="edit-date"
                  required
                  value={editForm.date}
                  onChange={(value) => handleEditChange({ target: { name: "date", value } })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-paymentMethod" className={labelClass}>{t("expenses.fields.paymentMethod")}</label>
                <Select
                  id="edit-paymentMethod"
                  name="paymentMethod"
                  value={editForm.paymentMethod}
                  onChange={handleEditChange}
                  className={inputClass}
                >
                  <option value="cash">{t("expenses.paymentMethod.cash")}</option>
                  <option value="card">{t("expenses.paymentMethod.card")}</option>
                  <option value="wallet">{t("expenses.paymentMethod.wallet")}</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-expenseType" className={labelClass}>{t("expenses.fields.expenseType")}</label>
                <Select
                  id="edit-expenseType"
                  required
                  name="expenseType"
                  value={editForm.expenseType}
                  onChange={handleEditChange}
                  className={inputClass}
                >
                  <option value="daily">{t("expenses.expenseType.daily")}</option>
                  <option value="fixed">{t("expenses.expenseType.fixed")}</option>
                  <option value="emergency">{t("expenses.expenseType.emergency")}</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-category" className={labelClass}>{t("expenses.fields.category")}</label>
                <CategorySelect
                  id="edit-category"
                  name="edit-category"
                  required
                  value={editForm.category}
                  expenseType={editForm.expenseType}
                  onChange={(value) =>
                    setEditForm((prev) => ({ ...prev, category: value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-accountId" className={labelClass}>{t("expenses.editModal.accountLabel")}</label>
                <Select
                  id="edit-accountId"
                  name="accountId"
                  value={editForm.accountId}
                  onChange={handleEditChange}
                  className={inputClass}
                >
                  <option value="">{t("expenses.noAccountOption")}</option>
                  {availableAccounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} ({formatMoney(acc.balance, acc.currency)})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-notes" className={labelClass}>{t("expenses.fields.notes")}</label>
              <textarea
                id="edit-notes"
                name="notes"
                value={editForm.notes}
                onChange={handleEditChange}
                rows="2"
                className={`${inputClass} resize-none`}
              />
            </div>

            {editError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                {editError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={editSaving}
                onClick={() => setEditingExpense(null)}
                className="min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:w-auto"
              >
                {t("expenses.editModal.cancel")}
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="min-h-11 w-full rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
              >
                {editSaving ? t("expenses.editModal.saving") : t("expenses.editModal.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}

export default EditExpenseModal;
