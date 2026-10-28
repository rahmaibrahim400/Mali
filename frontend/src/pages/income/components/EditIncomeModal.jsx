import { useTranslation } from "react-i18next";
import { inputClass, labelClass } from "../constants";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";
import NumberInput from "../../../components/common/NumberInput";
import { currencyName } from "../../../utils/formatAmount";
import { INCOME_CURRENCIES } from "../constants";

function EditIncomeModal({ isEditing, closeEditModal, handleSubmit, form, handleFormChange, updateStatus, availableAccounts = [] }) {
  const { t } = useTranslation();

  return (
    <>
    {isEditing && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4"
        onClick={closeEditModal}
      >
        <div
          className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-slate-900">
            {t("income.editTitle")}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {/* Name */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="name"
                className={labelClass}
              >
                {t("income.fields.name")}
              </label>

              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="category"
                className={labelClass}
              >
                {t("income.fields.category")}
              </label>

              <Select
                id="category"
                name="category"
                value={form.category}
                onChange={handleFormChange}
                className={inputClass}
              >
                {["salary", "freelance", "rental", "investment", "other"].map((category) => (
                  <option key={category} value={category}>
                    {t(`income.categories.${category}`)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="amount"
                className={labelClass}
              >
                {t("income.amountLabel")}
              </label>

              <NumberInput
                id="amount"
                name="amount"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleFormChange}
                required
                className={inputClass}
              />
            </div>

            {/* Currency */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="currency"
                className={labelClass}
              >
                {t("income.currencyLabel")}
              </label>

              <Select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleFormChange}
                className={inputClass}
              >
                {INCOME_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {currencyName(code)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Received Date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="receivedDate"
                className={labelClass}
              >
                {t("income.receivedDateLabel")}
              </label>

              <DatePicker
                id="receivedDate"
                required
                value={form.receivedDate}
                onChange={(value) => handleFormChange({ target: { name: "receivedDate", value } })}
                className={inputClass}
              />
            </div>

            {/* Recurrence */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="recurrence"
                className={labelClass}
              >
                {t("income.recurrenceLabel")}
              </label>

              <Select
                id="recurrence"
                name="recurrence"
                value={form.recurrence}
                onChange={handleFormChange}
                className={inputClass}
              >
                {["once", "weekly", "monthly", "yearly"].map((recurrence) => (
                  <option key={recurrence} value={recurrence}>
                    {t(`income.recurrence.${recurrence}`)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="status"
                className={labelClass}
              >
                {t("income.statusLabel")}
              </label>

              <Select
                id="status"
                name="status"
                value={form.status}
                onChange={handleFormChange}
                className={inputClass}
              >
                <option value="cleared">{t("income.status.cleared")}</option>
                <option value="pending">{t("income.status.pending")}</option>
              </Select>
            </div>

            {/* Account */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="accountId"
                className={labelClass}
              >
                {t("income.accountLabel")}
              </label>

              <Select
                id="accountId"
                name="accountId"
                value={form.accountId || ""}
                onChange={handleFormChange}
                className={inputClass}
              >
                <option value="">{t("income.noAccountOption")}</option>
                {availableAccounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="notes"
                className={labelClass}
              >
                {t("income.notesLabel")}
              </label>

              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={form.notes}
                onChange={handleFormChange}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:gap-3">
              <button
                type="submit"
                disabled={updateStatus === "loading"}
                className="min-h-11 w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-65 sm:w-auto"
              >
                {updateStatus === "loading"
                  ? t("income.submitting")
                  : t("income.saveChanges")}
              </button>

              <button
                type="button"
                onClick={closeEditModal}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 sm:w-auto"
              >
                {t("income.cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}

export default EditIncomeModal;
