import { useTranslation } from "react-i18next";
import { AlertTriangle, Plus, Trash2, History, Wallet, Check, ChevronDown, Pencil, ReceiptText } from "lucide-react";
import { inputClass, labelClass } from "../constants";
import { formatMoney, formatDate as formatLocalDate, formatPercent } from "../../../utils/formatAmount";
import { isOverdue, isDueSoon, getDaysUntilDue } from "../utils";
import DatePicker from "../../../components/common/DatePicker";
import { ListSkeleton } from "../../../components/common/Skeleton";
import Money from "../../../components/common/Money";

function DebtCard({ debt, expandedHistoryDebtId, paymentHistory, loadingHistoryDebtId, activeAccounts, editingDueDateId, setEditingDueDateId, editingDueDate, setEditingDueDate, savingDueDate, handleUpdateDueDate, openPaymentModal, handleMarkPaid, handleDeleteDebt, toggleHistory }) {
  const { t } = useTranslation();

  function formatDate(dateString) {
    return formatLocalDate(dateString, { year: "numeric", month: "short", day: "numeric" }) || "—";
  }

  function getDueSoonMessage(dateString) {
    const daysUntilDue = getDaysUntilDue(dateString);
    if (daysUntilDue === 0) return t("debts.dueSoonMessage.today");
    if (daysUntilDue === 1) return t("debts.dueSoonMessage.tomorrow");
    return t("debts.dueSoonMessage.inDays", { count: daysUntilDue });
  }

  const categoryLabel = (category) => t(`debts.category.${category || "other"}`);

        const isPaid =
          debt.status === "paid" ||
          (debt.remainingAmount !== undefined && debt.remainingAmount <= 0) ||
          (debt.paidAmount !== undefined && debt.paidAmount >= debt.totalAmount);
        const remaining = isPaid
          ? 0
          : Number(debt.remainingAmount ?? debt.totalAmount - (debt.paidAmount || 0));
        const progress = isPaid
          ? 100
          : Math.min(
              100,
              Math.max(
                0,
                Number(
                  debt.progressPct ??
                    (debt.totalAmount > 0
                      ? ((debt.paidAmount || 0) / debt.totalAmount) * 100
                      : 0)
                )
              )
            );
        const overdue = isOverdue(debt);
        const dueSoon = isDueSoon(debt);
        const isExpanded = expandedHistoryDebtId === debt._id;
        const history = paymentHistory[debt._id] || [];

  const dueDateEditor = (
    editingDueDateId === debt._id && (
      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <form onSubmit={(event) => handleUpdateDueDate(debt, event)} className="grid grid-cols-2 gap-2 @lg:flex @lg:items-end">
          <div className="col-span-2 min-w-0 @lg:flex-1">
            <label htmlFor={`due-date-${debt._id}`} className={labelClass}>{t("debts.editDueDate")}</label>
            <DatePicker
              id={`due-date-${debt._id}`}
              required
              value={editingDueDate}
              onChange={setEditingDueDate}
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={savingDueDate} className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
            {savingDueDate ? t("debts.form.saving") : t("debts.saveDate")}
          </button>
          <button type="button" onClick={() => setEditingDueDateId(null)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            {t("debts.cancel")}
          </button>
        </form>
      </div>
    )
  );

  const historySection = (
    isExpanded && (
      <div className={`rounded-b-2xl border-t border-slate-100 bg-slate-50/60 p-4 sm:px-5`}>
        {!isPaid && (
          <div className="mb-4 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-brand-800">
            {debt.paymentForecast?.status === "available" ? (
              <>
                <p className="font-semibold">
                  {t("debts.forecast.payoffBy", {
                    date: formatLocalDate(debt.paymentForecast.estimatedPayoffDate, { year: "numeric", month: "long" }),
                  })}
                </p>
                <p className="mt-1 text-xs text-brand-700">
                  {t("debts.forecast.averageMonthly", {
                    amount: formatMoney(debt.paymentForecast.averageMonthlyPayment, debt.currency),
                  })}
                </p>
              </>
            ) : (
              <p className="font-semibold">{t("debts.forecast.notEnoughData")}</p>
            )}
          </div>
        )}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <History size={16} className="text-brand-600" />
            {t("debts.history.title", { count: history.length })}
          </h3>
          {!isPaid && (
            <button
              type="button"
              onClick={(e) => openPaymentModal(debt, e)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              {t("debts.history.addNew")}
            </button>
          )}
        </div>

        {loadingHistoryDebtId === debt._id ? (
          <ListSkeleton rows={2} className="rounded-xl bg-white px-3" label={t("debts.history.loading")} />
        ) : history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            {t("debts.history.empty")}
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((payment) => (
              <div
                key={payment._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-sm shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Check size={16} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">
                      {formatMoney(payment.amount, debt.currency)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(payment.date)}
                      {payment.notes ? ` • ${payment.notes}` : ""}
                    </p>
                  </div>
                </div>

                {payment.accountId && (
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    <Wallet size={13} className="text-slate-400" />
                    <span>
                      {typeof payment.accountId === "object"
                        ? payment.accountId.name
                        : activeAccounts.find((a) => a._id === payment.accountId)
                            ?.name || t("debts.history.unknownAccount")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  );

  const statusLabel = isPaid
    ? t("debts.status.paid")
    : overdue
    ? t("debts.status.overdue")
    : dueSoon
    ? t("debts.status.dueSoon")
    : t("debts.status.active");

  // One white card; color only where it carries meaning (the status pill and an overdue date).
  // The bar shows repayment, which is good news, so it stays neutral until the debt is paid.
  const status = isPaid
    ? { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" }
    : overdue
    ? { pill: "bg-red-50 text-red-700", dot: "bg-red-500" }
    : dueSoon
    ? { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" }
    : { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
  const fieldLabel = (key) => t(key).replace(/[:：]\s*$/, "");

  const historyLink = (extraClass) => (
    <button
      type="button"
      onClick={() => toggleHistory(debt._id)}
      aria-expanded={isExpanded}
      className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${extraClass}`}
    >
      <History size={14} aria-hidden="true" />
      {t("debts.actions.showHistory")}
      {paymentHistory[debt._id] && <span className="tabular-amount text-slate-400">({history.length})</span>}
      <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
    </button>
  );

  const deleteButton = (
    <button
      type="button"
      onClick={(e) => handleDeleteDebt(debt._id, e)}
      aria-label={t("debts.actions.delete")}
      title={t("debts.actions.delete")}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
    >
      <Trash2 size={16} />
    </button>
  );

  return (
    <article
      className={`@container card-hover relative flex h-full flex-col rounded-2xl border bg-white focus-within:z-20 ${
        overdue ? "border-red-300 ring-1 ring-red-200 [--card-hover-border:var(--color-red-400)]" : "border-slate-200"
      }`}
    >
      {/* Overdue: a strip across the top that says by how much. */}
      {overdue && (
        <div role="alert" className="flex items-start gap-2 rounded-t-2xl border-b border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold leading-5 text-red-700 @sm:px-5">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            {debt.dueDate ? t("debts.overdueBy", { count: Math.max(1, -getDaysUntilDue(debt.dueDate)) }) : t("debts.status.overdue")}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-4 @sm:p-5">
        {/* Header: who, what for, status */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <ReceiptText size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-semibold ${isPaid ? "text-slate-400 line-through" : "text-slate-900"}`}>{debt.creditor}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {categoryLabel(debt.category)}
              {debt.description ? ` · ${debt.description}` : ""}
            </p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.pill}`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {statusLabel}
          </span>
        </div>

        {/* Wide card: amount + progress on one side, the figures on the other. */}
        <div className="@3xl:mt-5 @3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] @3xl:items-center @3xl:gap-8">
        <div>
        {/* Remaining, then a thin progress bar */}
        <div className="mt-5 @3xl:mt-0">
          <p className="text-[11px] font-medium text-slate-500">{t("debts.amounts.remaining")}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            <Money value={remaining} currency={debt.currency} />
          </p>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">{t("debts.progressLabel")}</span>
            <span className="tabular-amount font-semibold text-slate-700">{formatPercent(progress)}</span>
          </div>
          <div
            role="progressbar"
            aria-label={t("debts.progressLabel")}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
          >
            <div className={`h-full rounded-full transition-[width] duration-700 ${isPaid ? "bg-emerald-500" : "bg-brand-600"}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
        </div>

        {/* Figures split by hairlines, no colored boxes */}
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 text-xs @3xl:mt-0 @4xl:grid-cols-4">
          <div className="bg-white p-3">
            <dt className="text-slate-500">{t("debts.amounts.original")}</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{formatMoney(debt.totalAmount, debt.currency)}</dd>
          </div>
          <div className="bg-white p-3">
            <dt className="text-slate-500">{t("debts.amounts.paid")}</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-900">
              {formatMoney(debt.paidAmount || (isPaid ? debt.totalAmount : 0), debt.currency)}
            </dd>
          </div>
          <div className="bg-white p-3">
            <dt className="flex items-center justify-between gap-1 text-slate-500">
              <span className="truncate">{fieldLabel("debts.dueDatePrefix")}</span>
              {!isPaid && editingDueDateId !== debt._id && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDueDateId(debt._id);
                    setEditingDueDate(debt.dueDate ? new Date(debt.dueDate).toISOString().split("T")[0] : "");
                  }}
                  aria-label={t("debts.editDueDate")}
                  title={t("debts.editDueDate")}
                  className="-m-1 shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil size={12} />
                </button>
              )}
            </dt>
            <dd className={`mt-1 truncate text-sm font-semibold ${overdue ? "text-expense" : "text-slate-900"}`}>{formatDate(debt.dueDate)}</dd>
            {dueSoon && !isPaid && <dd className="mt-0.5 truncate text-[11px] text-amber-700">{getDueSoonMessage(debt.dueDate)}</dd>}
          </div>
          <div className="bg-white p-3">
            <dt className="truncate text-slate-500">{fieldLabel("debts.startDatePrefix")}</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{formatDate(debt.startDate)}</dd>
          </div>
        </dl>

        </div>

        {dueDateEditor}

        {/* Actions, pinned to the bottom so cards side by side line up */}
        {!isPaid && (
          <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-5 @md:flex @md:items-center">
            <button
              type="button"
              onClick={(e) => openPaymentModal(debt, e)}
              className="col-span-2 inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 active:scale-[0.98] @md:min-h-10 @md:flex-1 @3xl:w-44 @3xl:flex-none"
            >
              <Plus size={16} className="shrink-0" />
              <span className="truncate">{t("debts.actions.addPayment")}</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleMarkPaid(debt, e)}
              className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98] @md:flex-1 @3xl:w-44 @3xl:flex-none"
            >
              <Check size={16} className="shrink-0" />
              <span className="truncate">{t("debts.actions.markPaid")}</span>
            </button>
            {deleteButton}
            {/* Narrow: its own line under the buttons. Wide: the far end of the row. */}
            {historyLink("col-span-2 justify-self-start -ms-2 @md:col-span-1 @md:ms-auto")}
          </div>
        )}

        {/* Paid off: only delete and the history link, at the card bottom. */}
        {isPaid && (
          <div className="mt-auto flex items-center gap-2 pt-5">
            {deleteButton}
            {historyLink("ms-auto")}
          </div>
        )}
      </div>

      {historySection}
    </article>
  );
}

export default DebtCard;
