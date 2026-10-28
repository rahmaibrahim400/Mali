import { useTranslation } from "react-i18next";
import { ChevronDown, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Archive } from "lucide-react";
import { formatMoney, formatDate, formatPercent } from "../../../utils/formatAmount";
import { GOAL_ICON_MAP, DEFAULT_GOAL_ICON } from "../goalIcons";

const STATUS_STYLES = {
  active: "bg-brand-50 text-brand-700",
  completed: "bg-income-soft text-income",
  archived: "bg-slate-100 text-slate-500",
};

function GoalCard({
  goal,
  expanded,
  onToggleExpand,
  transactions,
  loadingTransactions,
  onEdit,
  onDeposit,
  onWithdraw,
  onComplete,
  onArchive,
  onDelete,
}) {
  const { t } = useTranslation();
  const progressPct = Math.min(100, goal.progressPct ?? (goal.targetAmount ? (goal.currentAmount / goal.targetAmount) * 100 : 0));
  const isActive = goal.status === "active";
  const GoalIcon = GOAL_ICON_MAP[goal.emoji] || DEFAULT_GOAL_ICON;

  return (
    <div className="card-hover rounded-2xl bg-white p-5 ring-1 ring-slate-100 emerald:ring-slate-200/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-brand-600">
            <GoalIcon size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{goal.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[goal.status]}`}>
                {t(`savings.status.${goal.status}`)}
              </span>
            </div>
            {goal.targetDate && (
              <p className="text-xs text-slate-400">
                {t("savings.card.targetDate")}: {formatDate(goal.targetDate)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isActive && (
            <button type="button" onClick={() => onEdit(goal)} title={t("savings.actions.edit")} aria-label={t("savings.actions.edit")} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <Pencil size={15} />
            </button>
          )}
          <button type="button" onClick={() => onDelete(goal)} title={t("savings.actions.delete")} aria-label={t("savings.actions.delete")} className="rounded-lg p-2 text-slate-400 hover:bg-expense-soft hover:text-expense">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between text-sm">
          <span className="tabular-amount font-bold text-slate-900">{formatMoney(goal.currentAmount, goal.currency)}</span>
          <span className="tabular-amount text-slate-400">{t("savings.card.of")} {formatMoney(goal.targetAmount, goal.currency)}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-1 text-xs font-semibold text-brand-600">{formatPercent(progressPct)}</p>
      </div>

      {isActive && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onDeposit(goal)} className="flex items-center gap-1.5 rounded-xl bg-income-soft px-3 py-2 text-sm font-semibold text-income hover:brightness-95">
            <ArrowDownCircle size={15} />
            {t("savings.actions.deposit")}
          </button>
          {goal.currentAmount > 0 && (
            <button type="button" onClick={() => onWithdraw(goal)} className="flex items-center gap-1.5 rounded-xl bg-expense-soft px-3 py-2 text-sm font-semibold text-expense hover:brightness-95">
              <ArrowUpCircle size={15} />
              {t("savings.actions.withdraw")}
            </button>
          )}
          <button type="button" onClick={() => onComplete(goal)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            <CheckCircle2 size={15} />
            {t("savings.actions.complete")}
          </button>
          <button type="button" onClick={() => onArchive(goal)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            <Archive size={15} />
            {t("savings.actions.archive")}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onToggleExpand(goal._id)}
        className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        {t("savings.card.transactions")}
        <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {loadingTransactions ? (
            <p className="text-sm text-slate-400">{t("savings.card.loadingTransactions")}</p>
          ) : transactions?.length ? (
            transactions.map((txn) => (
              <div key={txn._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <span className={`font-semibold ${txn.type === "deposit" ? "text-income" : "text-expense"}`}>
                    {txn.type === "deposit" ? t("savings.card.deposit") : t("savings.card.withdrawal")}
                  </span>
                  {txn.note && <span className="ms-2 text-slate-400">— {txn.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-amount font-bold text-slate-800">{formatMoney(txn.amount, goal.currency)}</span>
                  <span className="text-xs text-slate-400">
                    {formatDate(txn.date, { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">{t("savings.card.noTransactions")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default GoalCard;
