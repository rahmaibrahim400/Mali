import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { inputClass } from "../constants";
import { formatMoney } from "../../../utils/formatAmount";
import NumberInput from "../../../components/common/NumberInput";
import { GOAL_ICON_MAP, DEFAULT_GOAL_ICON } from "../goalIcons";
import Select from "../../../components/common/Select";
import DatePicker from "../../../components/common/DatePicker";

function GoalActionModal({ goal, mode, onClose, form, setForm, onSubmit, saving, accounts }) {
  const { t } = useTranslation();
  if (!goal) return null;

  const maxWithdraw = goal.currentAmount;
  const GoalIcon = GOAL_ICON_MAP[goal.emoji] || DEFAULT_GOAL_ICON;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <form
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
            {mode === "deposit" ? t("savings.deposit.title") : t("savings.withdraw.title")} —
            <GoalIcon size={16} className="text-brand-600" />
            {goal.name}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          {t("savings.actionModal.amountLabel")}
          {mode === "withdraw" && (
            <span className="ms-1 font-normal text-slate-400">
              ({t("savings.actionModal.maxLabel")} {formatMoney(maxWithdraw, goal.currency)})
            </span>
          )}
          <NumberInput
            autoFocus
            required
            min="0.01"
            step="0.01"
            max={mode === "withdraw" ? maxWithdraw : undefined}
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          {t("savings.actionModal.accountLabel")}
          <Select
            value={form.accountId}
            onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
            className={inputClass}
          >
            <option value="">{t("savings.actionModal.noAccount")}</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>{acc.name}</option>
            ))}
          </Select>
        </label>

        <div className="space-y-1">
          <label htmlFor="goal-action-date" className="block text-sm font-semibold text-slate-700">{t("savings.actionModal.dateLabel")}</label>
          <DatePicker
            id="goal-action-date"
            required
            value={form.date}
            onChange={(value) => setForm((prev) => ({ ...prev, date: value }))}
            className={inputClass}
          />
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          {t("savings.actionModal.noteLabel")}
          <input
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            className={inputClass}
          />
        </label>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:w-auto">
            {t("savings.cancel")}
          </button>
          <button type="submit" disabled={saving} className="min-h-11 w-full rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto">
            {saving ? t("savings.form.saving") : mode === "deposit" ? t("savings.deposit.submit") : t("savings.withdraw.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GoalActionModal;
