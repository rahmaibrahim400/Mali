import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { inputClass } from "../constants";
import { formatAmount, currencyLabel } from "../../../utils/formatAmount";
import { GOAL_ICON_MAP, DEFAULT_GOAL_ICON } from "../goalIcons";
import Select from "../../../components/common/Select";

function AccountPickerModal({ goal, action, onClose, accountId, setAccountId, onConfirm, saving, accounts }) {
  const { t } = useTranslation();
  if (!goal) return null;

  const titleKey = { complete: "savings.complete.title", archive: "savings.archive.title", delete: "savings.deleteAction.title" }[action];
  const submitKey = { complete: "savings.complete.submit", archive: "savings.archive.submit", delete: "savings.deleteAction.submit" }[action];
  const GoalIcon = GOAL_ICON_MAP[goal.emoji] || DEFAULT_GOAL_ICON;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
            {t(titleKey)} —
            <GoalIcon size={16} className="text-brand-600" />
            {goal.name}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-slate-500">
          {t("savings.actionModal.balanceTransferNote", {
            amount: formatAmount(goal.currentAmount),
            currency: currencyLabel(goal.currency),
          })}
        </p>

        <label className="block text-sm font-semibold text-slate-700">
          {t("savings.actionModal.accountLabel")}
          <Select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
            <option value="">{t("savings.actionModal.chooseAccount")}</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>{acc.name}</option>
            ))}
          </Select>
        </label>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:w-auto">
            {t("savings.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || !accountId}
            className={`min-h-11 w-full rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-60 sm:w-auto ${
              action === "delete" ? "bg-expense hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {saving ? t("savings.form.saving") : t(submitKey)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountPickerModal;
