import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";
import { formatPercent } from "../../../utils/formatAmount";
import { monthYearLabel } from "../labels";
import { ReportSkeleton } from "../../../components/common/Skeleton";
import Money from "../../../components/common/Money";
import ReportStatCard from "./ReportStatCard";
import { isOverdue } from "../../debts/utils";

// Each state with its pill and bar color; overdue first, paid last.
const STATES = {
  overdue: { pill: "bg-red-50 text-red-700", dot: "bg-red-500", bar: "bg-expense", order: 0 },
  active: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400", bar: "bg-brand-600", order: 1 },
  paid: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500", order: 2 },
};
const stateOf = (debt) => (debt.status === "paid" || debt.remainingAmount <= 0 ? "paid" : isOverdue(debt) ? "overdue" : "active");

function DebtProgressSection({ data, loading }) {
  const { t } = useTranslation();
  if (loading) return <ReportSkeleton label={t("reports.loading")} />;
  if (!data) return null;

  const { debts = [], totalPaid = 0, totalRemaining = 0 } = data;

  if (debts.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80">
        <p className="text-sm text-slate-500">{t("reports.empty")}</p>
      </div>
    );
  }

  const sorted = [...debts].sort((a, b) => STATES[stateOf(a)].order - STATES[stateOf(b)].order || b.remainingAmount - a.remainingAmount);
  const overallPct = totalPaid + totalRemaining > 0 ? (totalPaid / (totalPaid + totalRemaining)) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReportStatCard label={t("reports.debtProgress.totalPaid")} amount={totalPaid} tone="positive">
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-green-300" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="tabular-amount text-xs font-semibold text-hero-muted">{formatPercent(overallPct)}</span>
          </div>
        </ReportStatCard>
        <ReportStatCard label={t("reports.debtProgress.totalRemaining")} amount={totalRemaining} tone="negative">
          <p className="mt-3 text-xs text-hero-muted">{t("reports.debtProgress.debtsCount", { count: debts.length })}</p>
        </ReportStatCard>
      </div>

      {/* One debt per row. */}
      <ul className="space-y-3">
        {sorted.map((debt) => {
          const state = stateOf(debt);
          const style = STATES[state];
          return (
            <li key={debt._id} className="card-hover min-w-0 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-100 emerald:ring-slate-200/80">
              {/* Compact row: who + status | progress | what's left. Stacks on phones. */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                <div className="flex min-w-0 items-start justify-between gap-3 md:w-60 md:shrink-0 md:flex-col md:items-start md:justify-start md:gap-1.5">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-900">{debt.creditor}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{t(`debts.category.${debt.category || "other"}`)}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.pill}`}>
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {t(`debts.status.${state}`)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="tabular-amount text-lg font-extrabold text-slate-900">{formatPercent(debt.progressPct)}</p>
                    <p className="truncate text-xs text-slate-500">
                      <span className="tabular-amount font-semibold text-slate-700"><Money value={debt.paidAmount} currency={debt.currency} currencyClassName="" /></span>
                      {" / "}
                      <span className="tabular-amount"><Money value={debt.totalAmount} currency={debt.currency} currencyClassName="" /></span>
                    </p>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={debt.creditor}
                    aria-valuenow={Math.round(debt.progressPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100"
                  >
                    <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${Math.min(100, debt.progressPct)}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs md:w-48 md:shrink-0 md:flex-col md:items-end md:justify-center">
                  <span className="text-slate-500">
                    {t("reports.debtProgress.remaining")}:{" "}
                    <span className={`tabular-amount font-semibold ${state === "paid" ? "text-emerald-700" : "text-slate-800"}`}>
                      <Money value={debt.remainingAmount} currency={debt.currency} currencyClassName="" />
                    </span>
                  </span>
                  {state !== "paid" && debt.estPayoff && (
                    <span className="inline-flex items-center gap-1 text-slate-500" title={t("reports.debtProgress.estPayoff")}>
                      <CalendarClock size={12} aria-hidden="true" />
                      {t("reports.debtProgress.estPayoff")}: {monthYearLabel(debt.estPayoff)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default DebtProgressSection;
