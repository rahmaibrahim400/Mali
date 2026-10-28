import { useTranslation } from "react-i18next";
import { Landmark, Pencil, Receipt, Trash2 } from "lucide-react";
import { formatDate } from "../../../utils/formatAmount";
import { categoryLabel } from "../../categories/components/mandatoryCategories";
import { ListSkeleton } from "../../../components/common/Skeleton";
import Money from "../../../components/common/Money";

// Same column layout as the income list, shared by the header row and every row (md and up).
const EXPENSE_COLUMNS =
  "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center md:gap-4";

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700";

function ExpensesList({ items, status, isFiltered, resetFilters, getCategoryName, getCategoryColor, openEditModal, setDeletingExpense, setDeleteError }) {
  const { t } = useTranslation();

  if (status === "loading") return <ListSkeleton rows={5} className="mt-4" label={t("expenses.loading")} />;

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
        <p className="text-sm font-medium text-slate-600">
          {isFiltered ? t("expenses.emptyFiltered") : t("expenses.emptyAll")}
        </p>
        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
          >
            {t("expenses.resetFiltersCta")}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Column headings once, above the rows (md and up; phones show each row as a small card). */}
      <div
        aria-hidden="true"
        className={`mt-5 hidden rounded-lg bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500 ${EXPENSE_COLUMNS}`}
      >
        <span>{t("expenses.fields.description")}</span>
        <span>{t("expenses.fields.category")}</span>
        <span>{t("expenses.fields.amount")}</span>
        <span>{t("expenses.fields.date")}</span>
        <span className="w-20" />
      </div>

      {/* Phones: separate small cards. From md: one table with hairline rows. */}
      <div className="mt-4 flex flex-col gap-3 md:mt-1 md:gap-0 md:divide-y md:divide-slate-100">
        {items.map((expense) => {
          const categoryName = categoryLabel(getCategoryName(expense.category));
          const categoryColor = getCategoryColor(expense.category);
          const date = formatDate(expense.date, { dateStyle: "medium" });
          const category = (
            <span className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor }} />
              <span className="truncate">{categoryName}</span>
            </span>
          );

          return (
            <article key={expense._id} className={`rounded-xl border border-slate-200 px-3 py-4 transition-colors hover:bg-slate-100/70 md:border-0 md:px-4 ${EXPENSE_COLUMNS}`}>
              {/* Description: icon, name, type, account and notes */}
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Receipt size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-slate-900">{expense.description}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      {t(`expenses.expenseType.${expense.expenseType}`, expense.expenseType)}
                    </span>
                    {expense.account && (
                      <span className="inline-flex min-w-0 items-center gap-1 text-xs text-slate-500">
                        <Landmark size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{expense.account.name || t("expenses.unknownAccount")}</span>
                      </span>
                    )}
                  </div>
                  {/* Phones: category and date join the meta line (they have their own columns from md). */}
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500 md:hidden">
                    {category}
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">{date}</span>
                  </p>
                  {expense.notes && <p className="mt-1 truncate text-xs text-slate-400">{expense.notes}</p>}
                </div>

                {/* Phones: the amount sits beside the name */}
                <p className="shrink-0 text-end text-sm font-bold text-expense md:hidden">
                  <Money value={expense.amount} currency={expense.currency} />
                </p>
              </div>

              <div className="hidden text-sm font-medium text-slate-600 md:block">{category}</div>

              <p className="hidden text-base font-bold text-expense md:block">
                <Money value={expense.amount} currency={expense.currency} />
              </p>

              <p className="hidden text-sm text-slate-600 md:block">{date}</p>

              {/* Row actions: icon buttons, labelled for screen readers and on hover. */}
              <div className="mt-3 flex items-center justify-end gap-0.5 border-t border-slate-100 pt-2 md:mt-0 md:w-20 md:border-0 md:pt-0">
                <button
                  type="button"
                  onClick={() => openEditModal(expense)}
                  aria-label={t("expenses.editAction")}
                  title={t("expenses.editTitleAttr")}
                  className={iconButton}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingExpense(expense);
                    setDeleteError("");
                  }}
                  aria-label={t("expenses.deleteAction")}
                  title={t("expenses.deleteTitleAttr")}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

export default ExpensesList;
