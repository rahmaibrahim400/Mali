import { useTranslation } from "react-i18next";
import { formatPercent } from "../../../utils/formatAmount";
import { monthLabel } from "../labels";
import { ReportSkeleton } from "../../../components/common/Skeleton";
import ReportStatCard from "./ReportStatCard";
import Money from "../../../components/common/Money";

function SavingsRateSection({ data, loading }) {
  const { t } = useTranslation();
  if (loading) return <ReportSkeleton label={t("reports.loading")} />;
  if (!data) return null;

  const { monthly = [], avgRate = 0, avgSavings = 0, targetRate = 20 } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReportStatCard
          label={t("reports.savingsRate.avgRate")}
          // Light green on the dark card when the target is met (text-income is too dark here).
          value={<span className={`tabular-amount ${avgRate >= targetRate ? "text-green-300" : ""}`}>{formatPercent(avgRate, 1)}</span>}
        >
          <p className="mt-1 text-xs text-hero-muted">{t("reports.savingsRate.targetNote", { rate: formatPercent(targetRate) })}</p>
        </ReportStatCard>
        <ReportStatCard label={t("reports.savingsRate.avgSavings")} amount={avgSavings} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80">
        <h3 className="text-base font-bold text-slate-900">{t("reports.savingsRate.monthlyTitle")}</h3>
        {monthly.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t("reports.empty")}</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {monthly.map((m) => (
              <li key={m.label}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium text-slate-700">{monthLabel(m.label)}</span>
                  <span className="flex shrink-0 items-baseline gap-3">
                    {/* A month that spent more than it earned reads red, currency included. */}
                    <span className={`font-semibold ${m.savings < 0 ? "text-expense" : "text-slate-900"}`}>
                      <Money value={m.savings} currencyClassName={m.savings < 0 ? "" : undefined} />
                    </span>
                    {/* Fixed width so the rates line up down the list. */}
                    <span className="tabular-amount w-12 text-end text-xs text-slate-400">{formatPercent(m.rate, 1)}</span>
                  </span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${m.rate >= 0 ? "bg-income" : "bg-expense"}`}
                    style={{ width: `${Math.min(100, Math.max(0, Math.abs(m.rate)))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SavingsRateSection;
