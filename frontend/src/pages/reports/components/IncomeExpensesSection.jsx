import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
import { formatMoney, formatPercent } from "../../../utils/formatAmount";
import { monthLabel } from "../labels";
import { ReportSkeleton } from "../../../components/common/Skeleton";
import Money from "../../../components/common/Money";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../../../components/charts/ChartTooltip";
import { BAR_CURSOR, BAR_RADIUS, CHART_COLORS, GRID_PROPS, useChartLayout } from "../../../components/charts/chartTheme";

const PANEL = "rounded-2xl bg-white p-5 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6";

function IncomeExpensesSection({ data, loading }) {
  const { t } = useTranslation();
  const { xAxisProps, yAxisProps, animate } = useChartLayout();
  if (loading) return <ReportSkeleton label={t("reports.loading")} />;
  if (!data) return null;

  const { monthly = [], avgExpenses = 0, totalIncome = 0, totalExpenses = 0 } = data;
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : null;

  // Months before the first activity add nothing but empty space at the start of the chart.
  const firstActive = monthly.findIndex((m) => m.income > 0 || m.expenses > 0);
  const chartData = (firstActive > 0 ? monthly.slice(firstActive) : monthly).map((m) => ({
    month: monthLabel(m.label),
    income: m.income,
    expenses: m.expenses,
  }));

  const STATS = [
    { icon: TrendingUp, label: t("reports.incomeExpenses.totalIncome"), value: totalIncome, color: "text-income", tile: "bg-income-soft text-income" },
    { icon: TrendingDown, label: t("reports.incomeExpenses.totalExpenses"), value: totalExpenses, color: "text-expense", tile: "bg-expense-soft text-expense" },
    {
      icon: Target,
      label: t("reports.incomeExpenses.netSavings"),
      value: netSavings,
      color: netSavings >= 0 ? "text-income" : "text-expense",
      tile: "bg-slate-100 text-slate-500",
      note: savingsRate !== null ? t("reports.incomeExpenses.savingsRateNote", { rate: formatPercent(savingsRate) }) : null,
    },
    { icon: Wallet, label: t("reports.incomeExpenses.avgExpenses"), value: avgExpenses, color: "text-slate-900", tile: "bg-slate-100 text-slate-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STATS.map(({ icon: Icon, label, value, color, tile, note }) => (
          <div key={label} className="card-hover min-w-0 rounded-2xl bg-white p-4 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-5">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tile}`}>
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="min-w-0 text-xs font-semibold leading-4 text-slate-500">{label}</span>
            </div>
            <p className={`tabular-amount mt-3 truncate text-lg font-extrabold sm:text-xl ${color}`}>
              <Money value={value} currency="EGP" />
            </p>
            {note && <p className="mt-1 truncate text-[11px] text-slate-400">{note}</p>}
          </div>
        ))}
      </div>

      <div className={PANEL}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Wallet size={17} className="text-slate-400" aria-hidden="true" />
            {t("reports.incomeExpenses.chartTitle")}
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-income" />{t("reports.incomeExpenses.totalIncome")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-expense" />{t("reports.incomeExpenses.totalExpenses")}</span>
          </div>
        </div>
        {chartData.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t("reports.empty")}</p>
        ) : (
          <div className="mt-6 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={3} barCategoryGap="28%" margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="month" {...xAxisProps} interval="preserveStartEnd" minTickGap={8} />
                <YAxis {...yAxisProps} />
                <Tooltip
                  cursor={BAR_CURSOR}
                  content={
                    <ChartTooltip
                      title={(label) => label}
                      formatValue={(value) => formatMoney(value)}
                      footer={(payload) => {
                        const row = payload[0]?.payload;
                        return row ? `${t("reports.incomeExpenses.net")}: ${formatMoney(row.income - row.expenses)}` : null;
                      }}
                    />
                  }
                />
                <Bar dataKey="income" name={t("reports.incomeExpenses.totalIncome")} fill={CHART_COLORS.income} radius={BAR_RADIUS} maxBarSize={20} isAnimationActive={animate} />
                <Bar dataKey="expenses" name={t("reports.incomeExpenses.totalExpenses")} fill={CHART_COLORS.expense} radius={BAR_RADIUS} maxBarSize={20} isAnimationActive={animate} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default IncomeExpensesSection;
