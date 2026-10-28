import { useTranslation } from "react-i18next";
import { inputClass, labelClass, CURRENCY_KEYS } from "../constants";
import { GOAL_ICON_MAP, GOAL_ICON_KEYS } from "../goalIcons";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";
import NumberInput from "../../../components/common/NumberInput";
import { currencyName } from "../../../utils/formatAmount";

function GoalForm({ show, onClose, form, onChange, onSubmit, saving, isEdit }) {
  const { t } = useTranslation();

  return (
    <>
      {show && (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? t("savings.form.editTitle") : t("savings.form.title")}
            </h2>
            <span className="text-xs text-slate-400">{t("savings.form.requiredNote")}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{t("savings.form.emojiLabel")}</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_ICON_KEYS.map((key) => {
                  const Icon = GOAL_ICON_MAP[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange({ target: { name: "emoji", value: key } })}
                      aria-pressed={form.emoji === key}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                        form.emoji === key
                          ? "border-brand-500 bg-brand-50 text-brand-600"
                          : "border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="goal-name" className={labelClass}>
                {t("savings.form.nameLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                id="goal-name"
                required
                name="name"
                placeholder={t("savings.form.namePlaceholder")}
                value={form.name}
                onChange={onChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="goal-target" className={labelClass}>
                {t("savings.form.targetAmountLabel")} <span className="text-red-500">*</span>
              </label>
              <NumberInput
                id="goal-target"
                required
                min="0.01"
                step="0.01"
                name="targetAmount"
                placeholder="0.00"
                value={form.targetAmount}
                onChange={onChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="goal-currency" className={labelClass}>
                {t("savings.form.currencyLabel")} <span className="text-red-500">*</span>
              </label>
              <Select
                id="goal-currency"
                name="currency"
                value={form.currency}
                onChange={onChange}
                disabled={isEdit}
                className={inputClass}
              >
                {CURRENCY_KEYS.map((code) => (
                  <option key={code} value={code}>{currencyName(code)}</option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="goal-date" className={labelClass}>{t("savings.form.targetDateLabel")}</label>
              <DatePicker
                id="goal-date"
                value={form.targetDate}
                onChange={(value) => onChange({ target: { name: "targetDate", value } })}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="goal-description" className={labelClass}>{t("savings.form.descriptionLabel")}</label>
              <textarea
                id="goal-description"
                name="description"
                rows={2}
                placeholder={t("savings.form.descriptionPlaceholder")}
                value={form.description}
                onChange={onChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:w-auto"
            >
              {t("savings.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 w-full rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
            >
              {saving ? t("savings.form.saving") : t("savings.form.save")}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export default GoalForm;
