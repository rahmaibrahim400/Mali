import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3, CalendarRange, ClipboardCheck, Info, Pencil, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { fetchRevenueReport } from "../../api/adminExtrasApi";
import { formatMoney, formatPercent } from "../../utils/formatAmount";
import Money from "../../components/common/Money";
import { toIntlLocale } from "../../i18n/locale";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BAR_CURSOR, BAR_RADIUS, CHART_COLORS, GRID_PROPS, useChartLayout } from "../../components/charts/chartTheme";
import ChartTooltip from "../../components/charts/ChartTooltip";

const card = "card-shadow rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";

// Revenue per month (paid plans by the month they started) and what upcoming renewals could bring.
function AdminRevenuePage() {
  const { t, i18n } = useTranslation();
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState("loading");
  const locale = toIntlLocale(i18n.language);
  const monthFormat = new Intl.DateTimeFormat(locale, { month: "short" });
  const longMonthFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const { xAxisProps, yAxisProps, animate } = useChartLayout();

  const load = useCallback(async () => {
    try {
      const { data } = await fetchRevenueReport();
      setReport(data.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl space-y-4" aria-hidden="true">
        <span className="skeleton block h-16 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <span key={item} className="skeleton block h-28 rounded-2xl" />)}
        </div>
        <span className="skeleton block h-80 rounded-2xl" />
      </div>
    );
  }
  if (status === "error") {
    return <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{t("admin.revenue.loadError")}</p>;
  }

  const money = (value) => formatMoney(value, report.currency);
  // One bar per month: short name on the axis, full name + count in the tooltip.
  const chartData = report.months.map((month) => {
    const date = new Date(month.y, month.m, 1);
    return { key: `${month.y}-${month.m}`, month: monthFormat.format(date), label: longMonthFormat.format(date), total: month.total, count: month.count };
  });
  const forecastMax = Math.max(0, ...report.forecast.map((row) => row.total));
  const change = report.lastMonth ? Math.round(((report.thisMonth - report.lastMonth) / report.lastMonth) * 100) : null;
  const summary = [
    { key: "thisMonth", value: report.thisMonth, icon: Wallet, tone: "bg-emerald-50 text-emerald-600" },
    { key: "yearTotal", value: report.yearTotal, icon: BarChart3, tone: "bg-slate-100 text-slate-500" },
    { key: "monthlyAverage", value: report.monthlyAverage, icon: CalendarRange, tone: "bg-slate-100 text-slate-500" },
    { key: "pendingRenewals", value: report.pendingRenewals.total, icon: ClipboardCheck, tone: "bg-amber-50 text-amber-600", link: "/admin/renewals" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <PageHeader icon={BarChart3} title={t("admin.revenue.title")} subtitle={t("admin.revenue.subtitle")} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map(({ key, value, icon: Icon, tone, link }) => {
          const content = (
            <>
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
                  <Icon size={15} aria-hidden="true" />
                </span>
                <p className="min-w-0 text-xs font-semibold leading-4 text-slate-500">{t(`admin.revenue.summary.${key}`)}</p>
              </div>
              <p className="mt-3 truncate text-xl font-bold tabular-nums text-slate-900">
                <Money value={value} currency={report.currency} />
              </p>
              {key === "thisMonth" && change !== null && (
                <p className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {t("admin.home.vsLastMonth", { value: `\u2066${change >= 0 ? "+" : ""}${formatPercent(change)}\u2069` })}
                </p>
              )}
              {key === "pendingRenewals" && (
                <p className="mt-1 text-xs text-slate-500">{t("admin.revenue.requests", { count: report.pendingRenewals.count })}</p>
              )}
            </>
          );
          return link ? (
            <Link key={key} to={link} className="card-hover min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
              {content}
            </Link>
          ) : (
            <div key={key} className="card-hover min-w-0 rounded-2xl border border-slate-200 bg-white p-5">{content}</div>
          );
        })}
      </div>

      {/* Revenue per month */}
      <section className={card}>
        <h2 className="text-base font-bold text-slate-900">{t("admin.revenue.monthlyTitle")}</h2>
        <p className="mt-0.5 flex items-start gap-1.5 text-xs text-slate-500">
          <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t("admin.revenue.basis")}
        </p>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="month" {...xAxisProps} interval="preserveStartEnd" />
              <YAxis {...yAxisProps} allowDecimals={false} />
              <Tooltip
                cursor={BAR_CURSOR}
                content={
                  <ChartTooltip
                    showNames={false}
                    title={(_, payload) => payload[0]?.payload.label}
                    formatValue={(value) => money(value)}
                    footer={(payload) => t("admin.revenue.subscriptions", { count: payload[0]?.payload.count ?? 0 })}
                  />
                }
              />
              <Bar dataKey="total" fill={CHART_COLORS.income} radius={BAR_RADIUS} maxBarSize={36} minPointSize={2} isAnimationActive={animate}>
                {chartData.map((month) => (
                  <Cell key={month.key} fill={month.total > 0 ? CHART_COLORS.income : CHART_COLORS.empty} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* The same values for screen readers. */}
        <ul className="sr-only" aria-label={t("admin.revenue.monthlyTitle")}>
          {chartData.map((month) => (
            <li key={month.key}>
              {month.label}: {money(month.total)} · {t("admin.revenue.subscriptions", { count: month.count })}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Forecast */}
        <section className={card}>
          <h2 className="text-base font-bold text-slate-900">{t("admin.revenue.forecastTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("admin.revenue.forecastBasis")}</p>
          <ul className="mt-5 space-y-4">
            {report.forecast.map((row) => (
              <li key={row.days}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {t("admin.revenue.nextDays", { days: row.days })}
                    <span className="ms-2 text-xs font-normal text-slate-500">{t("admin.revenue.subscriptions", { count: row.count })}</span>
                  </p>
                  <p className="shrink-0 text-base font-bold tabular-nums text-slate-900">
                    <Money value={row.total} currency={report.currency} />
                  </p>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-income" style={{ width: `${forecastMax > 0 ? (row.total / forecastMax) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Prices */}
        <section className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t("admin.revenue.pricesTitle")}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{t("admin.revenue.pricesNote")}</p>
            </div>
            <Link
              to="/admin/settings?tab=payments"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Pencil size={13} aria-hidden="true" />
              {t("admin.revenue.editPrices")}
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {["3months", "6months", "yearly"].map((plan) => (
              <li key={plan} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm font-medium text-slate-700">{t(`admin.home.plans.${plan}`)}</span>
                <span className="font-bold tabular-nums text-slate-900">
                  <Money value={report.prices[plan]} currency={report.currency} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default AdminRevenuePage;
