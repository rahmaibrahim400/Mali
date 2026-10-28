import { useTranslation } from "react-i18next";
import { formatAmount, formatDate } from "../../../utils/formatAmount";
import { ReportSkeleton } from "../../../components/common/Skeleton";
import ReportStatCard from "./ReportStatCard";

function CashFlowSection({ data, loading }) {
  const { t } = useTranslation();
  if (loading) return <ReportSkeleton label={t("reports.loading")} />;
  if (!data) return null;

  const { timeline = [], totalIn = 0, totalOut = 0, netFlow = 0 } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportStatCard label={t("reports.cashFlow.totalIn")} amount={totalIn} />
        <ReportStatCard label={t("reports.cashFlow.totalOut")} amount={totalOut} />
        <ReportStatCard label={t("reports.cashFlow.netFlow")} amount={netFlow} tone={netFlow >= 0 ? "positive" : "negative"} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80">
        <h3 className="text-base font-bold text-slate-900">{t("reports.cashFlow.timelineTitle")}</h3>
        {timeline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t("reports.empty")}</p>
        ) : (
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
            {timeline.slice().reverse().map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-400">{formatDate(item.date, { month: "short", day: "numeric" })}</p>
                </div>
                <div className="text-end">
                  <p className={`tabular-amount font-bold ${item.type === "income" ? "text-income" : "text-expense"}`}>
                    {formatAmount(item.type === "income" ? Math.abs(item.amount) : -Math.abs(item.amount), { signDisplay: "exceptZero" })}
                  </p>
                  <p className="tabular-amount text-xs text-slate-400">{t("reports.cashFlow.runningBalance")}: {formatAmount(item.runningBalance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CashFlowSection;
