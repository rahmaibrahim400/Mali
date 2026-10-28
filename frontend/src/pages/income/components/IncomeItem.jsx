import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Briefcase, House, Laptop, Pause, Pencil, Play, TrendingUp, Wallet } from "lucide-react";
import { toggleIncomeRecurrence } from "../../../store/slices/incomeSlice";
import DeleteIncomeButton from "./DeleteIncomeButton";
import Money from "../../../components/common/Money";
import { formatMoney, formatDate } from "../../../utils/formatAmount";

// Shared with the list's header row so the columns line up (md and up).
export const INCOME_COLUMNS =
  "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center md:gap-4";

const CATEGORY_ICONS = { salary: Briefcase, freelance: Laptop, rental: House, investment: TrendingUp };

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700";

function IncomeItem({ income, displayAmount, displayCurrency, onEdit, onDeleted, onToggled }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isRecurring = income.recurrence && income.recurrence !== "once";
  const isPaused = isRecurring && income.isActive === false;
  const CategoryIcon = CATEGORY_ICONS[income.category] || Wallet;

  const date = formatDate(income.receivedDate, { dateStyle: "medium" });
  const currency = displayCurrency || income.currency;
  const amount = displayAmount ?? income.amount;
  // The original only adds information when the shown amount was converted or made monthly.
  const showOriginal = currency !== income.currency || Number(amount) !== Number(income.amount);
  const toggleLabel = isPaused ? t("income.resume") : t("income.pause");

  return (
    <article
      className={`rounded-xl border border-slate-200 px-3 py-4 transition-colors hover:bg-slate-100/70 md:border-0 md:px-4 ${INCOME_COLUMNS} ${
        isPaused ? "opacity-70" : ""
      }`}
    >
      {/* Source: icon, name, recurrence and notes */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <CategoryIcon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900">{income.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {isRecurring && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isPaused ? "bg-slate-100 text-slate-500" : "bg-brand-50 text-brand-700"
                }`}
              >
                {isPaused ? t("income.pausedBadge") : t("income.recurringBadge")} · {t(`income.recurrence.${income.recurrence}`)}
              </span>
            )}
            {/* Phones: type and date join the meta line (they have their own columns from md). */}
            <span className="text-xs text-slate-500 md:hidden">
              {t(`income.categories.${income.category}`)} · {date}
            </span>
          </div>
          {income.notes && <p className="mt-1 truncate text-xs text-slate-400">{income.notes}</p>}
        </div>

        {/* Phones: the amount sits beside the name */}
        <div className="shrink-0 text-end md:hidden">
          <p className="text-sm font-bold text-income">
            <Money value={amount} currency={currency} />
          </p>
        </div>
      </div>

      <p className="hidden text-sm font-medium text-slate-600 md:block">{t(`income.categories.${income.category}`)}</p>

      <div className="hidden md:block">
        <p className="text-base font-bold text-income">
          <Money value={amount} currency={currency} />
        </p>
        {showOriginal && (
          <p className="mt-0.5 text-xs text-slate-400">
            {t("income.fields.originalPrefix")} <span className="tabular-amount">{formatMoney(income.amount || 0, income.currency)}</span>
          </p>
        )}
      </div>

      <p className="hidden text-sm text-slate-600 md:block">{date}</p>

      {/* Row actions: icon buttons, labelled for screen readers and on hover. Fixed width so every
          row keeps the same columns whether or not it has the pause button. */}
      <div className="mt-3 flex items-center justify-end gap-0.5 border-t border-slate-100 pt-2 md:mt-0 md:w-28 md:border-0 md:pt-0">
        {isRecurring && (
          <button
            type="button"
            onClick={async () => {
              await dispatch(toggleIncomeRecurrence(income._id));
              onToggled?.();
            }}
            aria-label={toggleLabel}
            title={toggleLabel}
            className={iconButton}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(income)}
            aria-label={t("common.edit")}
            title={t("common.edit")}
            className={iconButton}
          >
            <Pencil size={16} />
          </button>
        )}

        {onDeleted && (
          <DeleteIncomeButton compact incomeId={income._id} incomeName={income.name} onConfirmDelete={onDeleted} />
        )}
      </div>
    </article>
  );
}

export default IncomeItem;
