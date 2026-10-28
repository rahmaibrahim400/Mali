import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { formatDate, formatMoney, formatPercent } from "../../../utils/formatAmount";
import ReportStatCard from "./ReportStatCard";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../../../components/charts/ChartTooltip";
import { BAR_CURSOR, BAR_RADIUS, CHART_COLORS, GRID_PROPS, useChartLayout } from "../../../components/charts/chartTheme";
import Money from "../../../components/common/Money";
import { categoryLabel } from "../../categories/components/mandatoryCategories";
import { weekdayLabel } from "../labels";
import { ReportSkeleton } from "../../../components/common/Skeleton";

const PANEL = "rounded-2xl bg-white p-5 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6";

function SpendingHabitsSection({ data, loading }) {
  const { t } = useTranslation();
  const { xAxisProps, yAxisProps, animate } = useChartLayout();
  if (loading) return <ReportSkeleton label={t("reports.loading")} />;
  if (!data) return null;

  const { topCategories = [], topExpenses = [], byDayOfWeek = [], weekdayTotal = 0, weekendTotal = 0, alerts = [] } = data;
  const chartData = byDayOfWeek.map((d) => ({
    day: weekdayLabel(d.day),
    total: d.total,
    fill: d.isWeekend ? CHART_COLORS.weekend : CHART_COLORS.brand,
  }));
  const dayAverage = chartData.length ? chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length : 0;
  const allSpend = weekdayTotal + weekendTotal;
  const share = (value) => (allSpend > 0 ? (value / allSpend) * 100 : 0);
  const topCategoryMax = Math.max(1, ...topCategories.map((cat) => cat.total));

  return (
    <div className="space-y-4">
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.category} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {t("reports.habits.spikeAlert", { category: categoryLabel(alert.category), pct: formatPercent(alert.pctChange) })}
            </div>
          ))}
        </div>
      )}

      {/* Weekday vs weekend, each with its share of all spending. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          ["weekdayTotal", weekdayTotal, "bg-white/70"],
          ["weekendTotal", weekendTotal, "bg-accent-500"],
        ].map(([key, value, bar]) => (
          <ReportStatCard key={key} label={t(`reports.habits.${key}`)} amount={value}>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${share(value)}%` }} />
              </div>
              <span className="tabular-amount text-xs font-semibold text-hero-muted">{formatPercent(share(value))}</span>
            </div>
          </ReportStatCard>
        ))}
      </div>

      <div className={PANEL}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">{t("reports.habits.byDayTitle")}</h3>
          {/* Two colors on one series: name what each means. */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.brand }} />{t("reports.habits.weekdayTotal")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.weekend }} />{t("reports.habits.weekendTotal")}</span>
            <span className="flex items-center gap-1.5"><span className="h-px w-3 border-t border-dashed border-slate-400" />{t("reports.habits.dayAverage")}</span>
          </div>
        </div>
        {byDayOfWeek.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t("reports.empty")}</p>
        ) : (
          <div className="mt-6 h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="day" {...xAxisProps} interval={0} tick={{ ...xAxisProps.tick, fontSize: 10 }} />
                <YAxis {...yAxisProps} />
                <ReferenceLine y={dayAverage} stroke="var(--color-slate-400, #94a3b8)" strokeDasharray="4 4" />
                <Tooltip
                  cursor={BAR_CURSOR}
                  content={<ChartTooltip showNames={false} title={(label) => label} formatValue={(value) => formatMoney(value)} />}
                />
                <Bar dataKey="total" radius={BAR_RADIUS} maxBarSize={28} isAnimationActive={animate}>
                  {chartData.map((d) => (
                    <Cell key={d.day} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Where the money goes: each category against the biggest one. */}
        {topCategories.length > 0 && (
          <div className={PANEL}>
            <h3 className="text-base font-bold text-slate-900">{t("reports.habits.topCategoriesTitle")}</h3>
            <ul className="mt-4 space-y-3.5">
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{categoryLabel(cat.name)}</span>
                    </span>
                    <span className="tabular-amount shrink-0 font-semibold text-slate-900">
                      <Money value={cat.total} currency="EGP" />
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(cat.total / topCategoryMax) * 100}%`, backgroundColor: cat.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The biggest single expenses, ranked. */}
        <div className={PANEL}>
          <h3 className="text-base font-bold text-slate-900">{t("reports.habits.topExpensesTitle")}</h3>
          {topExpenses.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t("reports.empty")}</p>
          ) : (
            <ol className="mt-3 divide-y divide-slate-100">
              {topExpenses.map((e, index) => (
                <li key={e._id} className="flex items-center gap-3 py-3">
                  <span className="tabular-amount flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{e.description}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{categoryLabel(e.categoryName)} · {formatDate(e.date, { month: "short", day: "numeric" })}</p>
                  </div>
                  <span className="tabular-amount shrink-0 text-sm font-bold text-expense">
                    <Money value={e.amount} currency={e.currency || "EGP"} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpendingHabitsSection;
