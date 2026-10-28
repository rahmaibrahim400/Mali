import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CreditCard, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import { formatAmount, formatDate, currencyLabel } from "../../../utils/formatAmount";

function getDaysUntilDue(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  return Math.ceil((dueDate - today) / 86400000);
}

function DashboardDebtsCard({ debts = [], debtSummary, currency: summaryCurrency, status = "idle" }) {
  const { t } = useTranslation();

  const getDueSoonMessage = (days) => {
    if (days === 0) return t("dashboard.debtsCard.dueToday");
    if (days === 1) return t("dashboard.debtsCard.dueTomorrow");
    return t("dashboard.debtsCard.dueInDays", { count: days });
  };

  const activeDebts = debts.filter(
    (d) => d.status === "active" || d.status === "overdue"
  );

  const calculatedTotalRemaining = activeDebts.reduce(
    (sum, d) => sum + Math.max(0, Number(d.totalAmount) - Number(d.paidAmount || 0)),
    0
  );
  const totalRemaining = debtSummary?.totalRemaining ?? calculatedTotalRemaining;

  const overdueDebts = debts.filter((d) => {
    if (d.status === "paid") return false;
    if (d.status === "overdue") return true;
    if (!d.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(d.dueDate) < today;
  });

  const dueSoonDebts = debts.filter((d) => {
    if (d.status === "paid" || overdueDebts.includes(d) || !d.dueDate) return false;
    const daysUntilDue = getDaysUntilDue(d.dueDate);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });

  // The summary's remaining total is computed for the dashboard's selected currency.
  const currency = (debtSummary && summaryCurrency) || debts[0]?.currency || "EGP";
  const nearestDue = debtSummary?.nearestDue;
  const forecast = debtSummary?.forecast;

  return (
    <Link
      to="/debts"
      className="card-hover block h-full rounded-2xl bg-white p-5 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CreditCard size={20} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("dashboard.debtsCard.title")}</h2>
            <p className="text-xs text-slate-500">
              {activeDebts.length > 0
                ? t("dashboard.debtsCard.activeCount", { count: activeDebts.length })
                : t("dashboard.debtsCard.noneDue")}
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
          <span>{t("dashboard.debtsCard.manage")}</span>
          <ChevronLeft size={16} className="ltr:rotate-180" />
        </span>
      </div>

      {activeDebts.length > 0 && (
        <div data-reveal-stagger className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{t("dashboard.debtsCard.nearestDue")}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {nearestDue?.dueDate
                ? formatDate(nearestDue.dueDate)
                : t("dashboard.debtsCard.noDueDate")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{t("dashboard.debtsCard.payoffForecast")}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {forecast?.estimatedPayoffDate
                ? formatDate(forecast.estimatedPayoffDate, { year: "numeric", month: "long" })
                : t("dashboard.debtsCard.forecastUnavailable")}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{t("dashboard.debtsCard.remaining")}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {status === "loading" ? (
              <span role="status" className="block">
                <span className="sr-only">{t("dashboard.debtsCard.calculating")}</span>
                <span aria-hidden="true" className="skeleton mt-1 block h-8 w-40" />
              </span>
            ) : (
              <>
                {formatAmount(totalRemaining)}{" "}
                <span className="text-base font-bold text-slate-600">{currencyLabel(currency)}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {overdueDebts.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              <AlertCircle size={14} />
              {t("dashboard.debtsCard.overdueBadge", { count: overdueDebts.length })}
            </span>
          )}

          {dueSoonDebts.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              <AlertCircle size={14} />
              {t("dashboard.debtsCard.dueSoonBadge", { count: dueSoonDebts.length })}
            </span>
          )}

          {activeDebts.length === 0 ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} />
              {t("dashboard.debtsCard.allPaid")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {t("dashboard.debtsCard.activeBadge", { count: activeDebts.length })}
            </span>
          )}
        </div>
      </div>

      {dueSoonDebts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {dueSoonDebts.map((debt) => (
            <span key={debt._id} className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
              {debt.creditor}: {getDueSoonMessage(getDaysUntilDue(debt.dueDate))}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default DashboardDebtsCard;
