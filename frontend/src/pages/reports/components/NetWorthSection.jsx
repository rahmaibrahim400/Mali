import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowDown } from "lucide-react";
import { formatMoney, formatPercent } from "../../../utils/formatAmount";
import { monthLabel } from "../labels";
import { ReportSkeleton } from "../../../components/common/Skeleton";
import ReportStatCard from "./ReportStatCard";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../../../components/charts/ChartTooltip";
import { CHART_COLORS, GRID_PROPS, useChartLayout } from "../../../components/charts/chartTheme";

const PANEL = "rounded-2xl bg-white p-5 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6";

function NetWorthSection({ data, loading }) {
  const { t } = useTranslation();
  const { xAxisProps, yAxisProps, animate } = useChartLayout();
  const gradientId = useId().replace(/:/g, "");
  if (loading) return <ReportSkeleton label={t("reports.loading")} />;
  if (!data) return null;

  const { monthly = [], currentNetWorth = 0, change = 0, changePct } = data;
  const isUp = change >= 0;
  const latest = monthly[monthly.length - 1];
  // fill rides on each row so the tooltip swatch matches the line (green above zero, red below).
  const chartData = monthly.map((m) => ({
    month: monthLabel(m.label),
    netWorth: m.netWorth,
    assets: m.totalAccounts ?? 0,
    debts: m.totalDebt ?? 0,
    fill: m.netWorth >= 0 ? CHART_COLORS.income : CHART_COLORS.expense,
  }));

  // Where zero sits in the plot (0 = top, 1 = bottom), so one gradient turns the line and its
  // fill green above zero and red below it.
  const values = chartData.map((m) => m.netWorth);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const zero = max === min ? 0.5 : max / (max - min);

  return (
    <div className="space-y-4">
      <ReportStatCard large label={t("reports.netWorth.current")} amount={currentNetWorth} tone={currentNetWorth < 0 ? "negative" : undefined}>
        <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${isUp ? "bg-income" : "bg-expense"}`}>
          {isUp ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          {formatMoney(Math.abs(change))}
          {changePct !== null && changePct !== undefined && <span>({formatPercent(changePct, 1)})</span>}
        </div>
        {/* What the number is made of: money in the accounts minus what is still owed. */}
        {latest && (
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:max-w-md">
            <div>
              <dt className="text-xs text-hero-muted">{t("reports.netWorth.assets")}</dt>
              <dd className="tabular-amount mt-1 text-base font-bold text-green-300">{formatMoney(latest.totalAccounts ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-xs text-hero-muted">{t("reports.netWorth.debts")}</dt>
              <dd className="tabular-amount mt-1 text-base font-bold text-red-300">{formatMoney(latest.totalDebt ?? 0)}</dd>
            </div>
          </dl>
        )}
      </ReportStatCard>

      <div className={PANEL}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t("reports.netWorth.historyTitle")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{t("reports.netWorth.historyHint")}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full bg-income" />{t("reports.netWorth.positive")}</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full bg-expense" />{t("reports.netWorth.negative")}</span>
          </div>
        </div>
        {monthly.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t("reports.empty")}</p>
        ) : (
          <div className="mt-6 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset={zero} style={{ stopColor: CHART_COLORS.income }} />
                    <stop offset={zero} style={{ stopColor: CHART_COLORS.expense }} />
                  </linearGradient>
                  <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} style={{ stopColor: CHART_COLORS.income, stopOpacity: 0.18 }} />
                    <stop offset={zero} style={{ stopColor: CHART_COLORS.income, stopOpacity: 0.02 }} />
                    <stop offset={zero} style={{ stopColor: CHART_COLORS.expense, stopOpacity: 0.02 }} />
                    <stop offset={1} style={{ stopColor: CHART_COLORS.expense, stopOpacity: 0.18 }} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="month" {...xAxisProps} interval="preserveStartEnd" minTickGap={12} />
                <YAxis {...yAxisProps} width={52} />
                {/* Zero: above it you own more than you owe. */}
                <ReferenceLine y={0} stroke="var(--color-slate-300, #cbd5e1)" />
                <Tooltip
                  cursor={{ stroke: "var(--color-slate-300, #cbd5e1)", strokeDasharray: "4 4" }}
                  content={
                    <ChartTooltip
                      showNames={false}
                      title={(label) => label}
                      formatValue={(value) => formatMoney(value)}
                      footer={(payload) => {
                        const row = payload[0]?.payload;
                        return row ? `${t("reports.netWorth.assets")} ${formatMoney(row.assets)} · ${t("reports.netWorth.debts")} ${formatMoney(row.debts)}` : null;
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke={`url(#${gradientId}-line)`}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId}-fill)`}
                  baseValue={0}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                  isAnimationActive={animate}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default NetWorthSection;
