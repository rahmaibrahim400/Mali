import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowLeft,
  Ban,
  ChartNoAxesColumn,
  Clock3,
  History,
  MessagesSquare,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchAdminDashboard, fetchAdminStats } from "../../api/adminAuthApi";
import { formatMoney, formatPercent } from "../../utils/formatAmount";
import { toIntlLocale } from "../../i18n/locale";
import Money from "../../components/common/Money";
import { useTheme } from "../../utils/theme";
import ChartTooltip from "../../components/charts/ChartTooltip";
import { BAR_CURSOR, BAR_RADIUS, CHART_COLORS, GRID_PROPS, useChartLayout } from "../../components/charts/chartTheme";

const EMPTY_STATS = { total: 0, active: 0, expiring: 0, expired: 0, suspended: 0 };
const PLAN_TYPES = [
  // Trial is most users; a neutral grey keeps the paid plans readable next to it.
  { type: "trial", color: "#cbd5e1" },
  { type: "3months", color: "#818cf8" },
  { type: "6months", color: "#34d399" },
  { type: "yearly", color: "#f59e0b" },
  { type: "custom", color: "#f472b6" },
];
const DONUT_SIZE = 184;

// h-full: cards in the same row line up at the same height.
const cardClass = "card-shadow h-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
// Always underlined; on hover the link and its underline take the theme color (orange in Mali).
const viewAllClass =
  "text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-accent-600 hover:decoration-current emerald:hover:text-brand-600";

// Card heading: a small muted icon beside the title, the explanation under it.
function CardTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Icon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ErrorBox({ children }) {
  return <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{children}</div>;
}

/* ── hero: greeting, quick links and two headline numbers ── */
function Hero({ admin, kpis, loading, t, language }) {
  const numberFormat = new Intl.NumberFormat(toIntlLocale(language));
  const growing = (kpis.totalMoM ?? 0) >= 0;
  const TrendIcon = growing ? TrendingUp : TrendingDown;

  return (
    <section className="rounded-2xl bg-linear-to-br from-hero-start to-hero-end p-5 text-white shadow-(--hero-shadow) sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
            {t("admin.home.welcome", { name: admin?.name ?? "" })}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-300">{t("admin.home.subtitle")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/admin/users"
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 sm:flex-none"
            >
              <Users size={16} />
              {t("admin.home.usersLink")}
            </Link>
            <Link
              to="/admin/chat"
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 sm:flex-none"
            >
              <MessagesSquare size={16} />
              {t("admin.home.chatLink")}
            </Link>
          </div>
        </div>

        {/* Two headline numbers, split by a hairline rather than boxed. */}
        <dl className="grid grid-cols-2 divide-x divide-white/10 rtl:divide-x-reverse lg:w-96">
          <div className="pe-6">
            <dt className="text-xs font-medium text-slate-400">{t("admin.home.newThisMonth")}</dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums">{loading ? "…" : numberFormat.format(kpis.thisMonthNew ?? 0)}</dd>
            {!loading && (
              <dd className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${growing ? "text-emerald-300" : "text-rose-300"}`}>
                <TrendIcon size={13} />
                {t("admin.home.vsLastMonth", { value: `\u2066${growing ? "+" : ""}${formatPercent(kpis.totalMoM ?? 0)}\u2069` })}
              </dd>
            )}
          </div>
          <div className="ps-6">
            <dt className="text-xs font-medium text-slate-400">{t("admin.home.conversionRate")}</dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums">
              {loading ? "…" : formatPercent(kpis.conversionRate ?? 0)}
            </dd>
            <dd className="mt-1 text-xs text-slate-400">{t("admin.home.conversionHint")}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

/* ── status cards: number + share of all users, each opens the filtered list ── */
function StatCards({ stats, loading, error, t, language }) {
  const theme = useTheme();
  const numberFormat = new Intl.NumberFormat(toIntlLocale(language));
  const cards = [
    { key: "total", icon: Users, tone: "bg-sky-50 text-sky-600", bar: "bg-sky-400", link: "/admin/users" },
    { key: "active", icon: UserCheck, tone: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-400", link: "/admin/users?status=active" },
    { key: "expiring", icon: Clock3, tone: "bg-amber-50 text-amber-600", bar: "bg-amber-400", link: "/admin/users?status=expiring" },
    { key: "expired", icon: UserX, tone: "bg-slate-100 text-slate-600", bar: "bg-slate-400", link: "/admin/users?status=expired" },
    { key: "suspended", icon: Ban, tone: "bg-rose-50 text-rose-600", bar: "bg-rose-400", link: "/admin/users?status=suspended" },
  ];

  if (error) return <ErrorBox>{error}</ErrorBox>;

  // Mali: a white card with a status dot, the number, and a thin share bar in the same color.
  if (theme !== "emerald") {
    return (
      <section aria-label={t("admin.home.statsTitle")} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map(({ key, bar, link }) => {
          const value = stats[key] ?? 0;
          const share = stats.total ? Math.round((value / stats.total) * 100) : 0;
          return (
            <Link
              key={key}
              to={link}
              className={`group card-hover flex flex-col rounded-2xl border border-slate-200 bg-white p-4 ${
                key === "total" ? "col-span-2 md:col-span-1" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-500">
                  <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${bar}`} />
                  <span className="truncate">{t(`admin.home.stats.${key}`)}</span>
                </span>
                <ChevronRight size={14} className="shrink-0 text-slate-300 transition group-hover:text-slate-500 rtl:rotate-180" />
              </div>
              <p className="mt-3 text-[1.75rem] font-bold leading-none tabular-nums text-slate-900" aria-live="polite">
                {loading ? "…" : numberFormat.format(value)}
              </p>
              {key !== "total" && (
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                  <span className={`block h-full rounded-full ${bar} transition-[width] duration-700`} style={{ width: `${loading ? 0 : share}%` }} />
                </div>
              )}
            </Link>
          );
        })}
      </section>
    );
  }

  return (
    <section aria-label={t("admin.home.statsTitle")} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ key, icon: Icon, tone, bar, link }) => {
        const value = stats[key] ?? 0;
        const share = stats.total ? Math.round((value / stats.total) * 100) : 0;
        return (
          <Link
            key={key}
            to={link}
            className={`group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
              key === "total" ? "col-span-2 md:col-span-1" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={18} />
              </span>
              <ArrowLeft size={15} className="text-slate-300 transition group-hover:text-slate-500 ltr:rotate-180" />
            </div>
            <p className="mt-3 text-2xl font-extrabold tabular-nums text-slate-900" aria-live="polite">
              {loading ? "…" : numberFormat.format(value)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{t(`admin.home.stats.${key}`)}</p>
            {key !== "total" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <span className={`block h-full rounded-full ${bar} transition-[width] duration-700`} style={{ width: `${loading ? 0 : share}%` }} />
              </div>
            )}
          </Link>
        );
      })}
    </section>
  );
}

/* ── new users per month ── */
function UserGrowthChart({ monthly, loading, error, t, language }) {
  const [period, setPeriod] = useState(12);
  const numberFormat = new Intl.NumberFormat(toIntlLocale(language));
  const dateFormat = new Intl.DateTimeFormat(toIntlLocale(language), { month: "short", year: "2-digit" });
  const visibleMonths = monthly.slice(-period);
  const total = visibleMonths.reduce((sum, month) => sum + month.count, 0);
  const { xAxisProps, yAxisProps, animate } = useChartLayout();
  const chartData = visibleMonths.map((month, index) => ({
    key: `${month.year}-${month.month}`,
    month: dateFormat.format(new Date(month.year, month.month, 1)),
    count: month.count,
    current: index === visibleMonths.length - 1,
  }));
  // This month against last month, for the header.
  const thisMonth = monthly[monthly.length - 1]?.count ?? 0;
  const lastMonth = monthly[monthly.length - 2]?.count ?? 0;
  const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;

  return (
    <section aria-labelledby="admin-user-growth-title" className={cardClass}>
      <CardTitle
        icon={ChartNoAxesColumn}
        title={<span id="admin-user-growth-title">{t("admin.home.userGrowthTitle")}</span>}
        subtitle={t("admin.home.userGrowthSubtitle")}
        action={
          <div role="radiogroup" aria-label={t("admin.home.userGrowthPeriod")} className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {[3, 6, 12].map((months) => (
              <button
                key={months}
                type="button"
                role="radio"
                aria-checked={period === months}
                onClick={() => setPeriod(months)}
                className={`min-h-8 rounded-lg px-3 text-xs font-bold transition ${
                  period === months ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("admin.home.lastMonths", { months })}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <ErrorBox>{error}</ErrorBox>
      ) : loading ? (
        <div role="status" className="mt-6">
          <span className="sr-only">{t("common.loading")}</span>
          <span aria-hidden="true" className="skeleton block h-60 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <p className="flex items-baseline gap-2">
              <strong className="text-3xl font-extrabold tabular-nums text-slate-900">{numberFormat.format(total)}</strong>
              <span className="text-sm text-slate-500">{t("admin.home.userGrowthTotal", { months: period })}</span>
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">{t("admin.home.userGrowthThisMonth")}</span>
              <strong className="tabular-nums text-slate-900">{numberFormat.format(thisMonth)}</strong>
              {change !== null && (
                <span dir="ltr" className={`rounded-full px-2 py-0.5 text-xs font-semibold ${change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {change >= 0 ? "+" : ""}
                  {formatPercent(change)}
                </span>
              )}
            </div>
          </div>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="month" {...xAxisProps} interval="preserveStartEnd" />
                <YAxis {...yAxisProps} allowDecimals={false} />
                <Tooltip
                  cursor={BAR_CURSOR}
                  content={<ChartTooltip showNames={false} title={(label) => label} formatValue={(value) => numberFormat.format(value)} />}
                />
                <Bar dataKey="count" fill={CHART_COLORS.brand} radius={BAR_RADIUS} maxBarSize={28} minPointSize={2} isAnimationActive={animate}>
                  {/* The current month in the brand color, earlier months softer, empty months as a stub. */}
                  {chartData.map((month) => (
                    <Cell
                      key={month.key}
                      fill={month.count === 0 ? CHART_COLORS.empty : month.current ? CHART_COLORS.brand : CHART_COLORS.brandSoft}
                      fillOpacity={month.count === 0 || month.current ? 1 : 0.55}
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={6}
                    className="tabular-nums"
                    fill="var(--color-slate-500, #64748b)"
                    fontSize={11}
                    fontWeight={600}
                    formatter={(value) => (value > 0 ? numberFormat.format(value) : "")}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* The same values for screen readers. */}
          <ul className="sr-only" aria-label={t("admin.home.userGrowthChartLabel", { months: period })}>
            {chartData.map((month) => (
              <li key={month.key}>
                {t("admin.home.userGrowthMonthValue", { month: month.month, value: numberFormat.format(month.count) })}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* ── plan split (donut) ── */
function PlanDistributionChart({ plans, loading, error, t, language }) {
  const total = plans.reduce((sum, plan) => sum + plan.count, 0);
  const numberFormat = new Intl.NumberFormat(toIntlLocale(language));
  const { animate, donutTooltipProps } = useChartLayout();
  // name / fill ride on each slice for the tooltip; an empty ring shows when nobody subscribed.
  const slices = plans.map((plan) => ({ ...plan, name: t(`admin.home.plans.${plan.type}`), fill: plan.color }));
  const paying = plans.filter((plan) => plan.type !== "trial").reduce((sum, plan) => sum + plan.count, 0);

  return (
    <section aria-labelledby="admin-plan-distribution-title" className={cardClass}>
      <CardTitle
        icon={PieChartIcon}
        title={<span id="admin-plan-distribution-title">{t("admin.home.planDistributionTitle")}</span>}
        subtitle={t("admin.home.planDistributionSubtitle")}
      />

      {error ? (
        <ErrorBox>{error}</ErrorBox>
      ) : loading ? (
        <div role="status" className="mt-6 flex flex-col items-center gap-5">
          <span className="sr-only">{t("common.loading")}</span>
          <span aria-hidden="true" className="skeleton block h-[184px] w-[184px] rounded-full" />
          <span aria-hidden="true" className="skeleton block h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-6">
          <div className="relative h-[184px] w-[184px] shrink-0">
            <PieChart
              width={DONUT_SIZE}
              height={DONUT_SIZE}
              accessibilityLayer
              aria-label={t("admin.home.planDistributionChartLabel", { total: numberFormat.format(total) })}
            >
              {total === 0 ? (
                <Pie data={[{ value: 1 }]} dataKey="value" innerRadius={62} outerRadius={84} stroke="none" fill={CHART_COLORS.empty} isAnimationActive={false} />
              ) : (
                <Pie
                  data={slices}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={84}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={slices.filter((plan) => plan.count > 0).length > 1 ? 1.5 : 0}
                  cornerRadius={4}
                  stroke="none"
                  isAnimationActive={animate}
                >
                  {slices.map((plan) => (
                    <Cell key={plan.type} fill={plan.fill} className="outline-none" />
                  ))}
                </Pie>
              )}
              {total > 0 && (
                <Tooltip
                  {...donutTooltipProps}
                  content={
                    <ChartTooltip
                      formatValue={(value) => numberFormat.format(value)}
                      footer={(payload) => formatPercent(payload[0]?.payload?.percentage ?? 0, 1)}
                    />
                  }
                />
              )}
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <strong className="text-3xl font-extrabold tabular-nums text-slate-900">{numberFormat.format(total)}</strong>
              <span className="text-xs font-medium text-slate-500">{t("admin.home.planDistributionTotal")}</span>
              <span className="mt-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {t("admin.home.planDistributionPaying", { count: paying })}
              </span>
            </div>
          </div>

          <ul className="grid w-full grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1" aria-label={t("admin.home.planDistributionLegend")}>
            {plans.map((plan) => (
              <li key={plan.type} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-100">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="truncate text-sm font-semibold text-slate-700">{t(`admin.home.plans.${plan.type}`)}</span>
                </span>
                {/* Count, then its share in a fixed-width pill so the column lines up. */}
                <span className="flex shrink-0 items-center gap-2.5">
                  <strong className="text-sm font-bold tabular-nums text-slate-900">{numberFormat.format(plan.count)}</strong>
                  <span className="w-14 rounded-md bg-slate-100 py-0.5 text-center text-xs font-semibold tabular-nums text-slate-600">
                    {formatPercent(plan.percentage, 1)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ── revenue by plan ── */
function RevenueCard({ revenue, loading, error, t, language }) {
  const max = Math.max(1, ...revenue.byPlan.map((plan) => plan.revenue));
  const numberFormat = new Intl.NumberFormat(toIntlLocale(language));

  return (
    <section aria-labelledby="admin-revenue-title" className={cardClass}>
      <CardTitle
        icon={Wallet}
        title={<span id="admin-revenue-title">{t("admin.home.revenueTitle")}</span>}
        subtitle={t("admin.home.revenueBasis")}
      />
      {error ? (
        <ErrorBox>{error}</ErrorBox>
      ) : loading ? (
        <div className="mt-5 space-y-3" aria-hidden="true">
          <span className="skeleton block h-10 w-1/2 rounded-xl" />
          {[0, 1, 2].map((item) => <span key={item} className="skeleton block h-8 rounded-lg" />)}
        </div>
      ) : (
        <>
          <p className="mt-5 text-[1.75rem] font-bold leading-tight text-slate-900">
            <Money value={revenue.total} currency={revenue.currency} />
          </p>
          <ul className="mt-5 space-y-4">
            {revenue.byPlan.map((plan) => (
              <li key={plan.type}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-slate-700">{t(`admin.home.plans.${plan.type}`)}</span>
                    <span className="ms-2 text-xs text-slate-400">
                      {numberFormat.format(plan.count)} × {formatMoney(plan.price, revenue.currency)}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    <Money value={plan.revenue} currency={revenue.currency} />
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                  <span
                    className="block h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${(plan.revenue / max) * 100}%`, backgroundColor: PLAN_TYPES.find((p) => p.type === plan.type)?.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* ── subscriptions ending soon ── */
function ExpiringUsersList({ users, total, loading, error, t, language }) {
  const numberFormat = new Intl.NumberFormat(toIntlLocale(language));
  const dateFormat = new Intl.DateTimeFormat(toIntlLocale(language), { month: "short", day: "numeric" });

  return (
    <section aria-labelledby="admin-expiring-users-title" className={cardClass}>
      <CardTitle
        icon={Clock3}
        title={<span id="admin-expiring-users-title">{t("admin.home.expiringUsersTitle")}</span>}
        subtitle={t("admin.home.expiringUsersSubtitle")}
        action={
          total > 0 && (
            <Link to="/admin/users?status=expiring" className={viewAllClass}>
              {t("admin.home.viewAll")}
            </Link>
          )
        }
      />

      {error ? (
        <ErrorBox>{error}</ErrorBox>
      ) : loading ? (
        <div role="status" className="mt-5 space-y-2">
          <span className="sr-only">{t("common.loading")}</span>
          {[0, 1, 2].map((item) => <span key={item} aria-hidden="true" className="skeleton block h-14 rounded-xl" />)}
        </div>
      ) : users.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">{t("admin.home.noExpiringUsers")}</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {users.slice(0, 5).map((user) => (
            <li key={user._id}>
              <Link
                to={`/admin/users?search=${encodeURIComponent(user.email)}&status=expiring`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-amber-50/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                  {(user.name || user.email || "?").trim()[0]?.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {t(`admin.home.plans.${user.subscriptionType}`, { defaultValue: user.subscriptionType })}
                    {" · "}
                    {dateFormat.format(new Date(user.subscriptionEnd))}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                  {t("admin.home.daysRemaining", { days: numberFormat.format(user.daysLeft) })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── latest admin actions ── */
function RecentActivity({ logs, loading, error, t, language }) {
  const timeFormat = new Intl.DateTimeFormat(toIntlLocale(language), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <section aria-labelledby="admin-recent-activity-title" className={cardClass}>
      <CardTitle
        icon={History}
        title={<span id="admin-recent-activity-title">{t("admin.home.recentActivityTitle")}</span>}
        subtitle={t("admin.home.recentActivitySubtitle")}
        action={
          <Link to="/admin/logs" className={viewAllClass}>
            {t("admin.home.viewAll")}
          </Link>
        }
      />
      {error ? (
        <ErrorBox>{error}</ErrorBox>
      ) : loading ? (
        <div className="mt-5 space-y-2" aria-hidden="true">
          {[0, 1, 2].map((item) => <span key={item} className="skeleton block h-12 rounded-xl" />)}
        </div>
      ) : logs.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">{t("admin.auditLogs.empty")}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {logs.slice(0, 5).map((log) => (
            <li key={log._id} className="flex gap-3">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{t(`admin.auditLogs.actions.${log.action}`, { defaultValue: log.action })}</span>
                  {" · "}
                  <span className="text-slate-600">{log.userName}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {log.adminName} · {timeFormat.format(new Date(log.createdAt))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function AdminHomePage() {
  const { t, i18n } = useTranslation();
  const { admin } = useSelector((state) => state.adminAuth);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [request, setRequest] = useState({ status: "loading", error: "" });
  const [plans, setPlans] = useState([]);
  const [revenue, setRevenue] = useState({ currency: "EGP", total: 0, byPlan: [] });
  const [monthly, setMonthly] = useState([]);
  const [kpis, setKpis] = useState({});
  const [recentLogs, setRecentLogs] = useState([]);
  const [expiringUsers, setExpiringUsers] = useState([]);
  const [expiringUsersTotal, setExpiringUsersTotal] = useState(0);
  const [dashboardRequest, setDashboardRequest] = useState({ status: "loading", error: "" });

  const loadStats = useCallback(async (signal) => {
    try {
      const { data } = await fetchAdminStats({ signal });
      setStats({ ...EMPTY_STATS, ...data.data });
      setRequest({ status: "succeeded", error: "" });
    } catch (error) {
      if (signal?.aborted) return;
      setRequest({
        status: "failed",
        error: error.response?.data?.message ?? t("admin.home.statsError"),
      });
    }
  }, [t]);

  const loadDashboard = useCallback(async (signal) => {
    try {
      const { data } = await fetchAdminDashboard({ signal });
      const distribution = data.data.planDist ?? [];
      setKpis(data.data.kpis ?? {});
      setRecentLogs(data.data.recentLogs ?? []);
      setExpiringUsers(data.data.atRisk ?? []);
      setExpiringUsersTotal(Number(data.data.atRiskTotal ?? data.data.atRisk?.length ?? 0));
      setMonthly((data.data.monthly ?? []).map((month) => ({
        year: Number(month.y),
        month: Number(month.m),
        count: Number(month.count || 0),
      })));
      const revenueData = data.data.revenue ?? {};
      const byType = new Map(distribution.map((plan) => [plan.type, plan]));
      const total = distribution.reduce((sum, plan) => sum + Number(plan.count || 0), 0);
      setPlans(PLAN_TYPES.map(({ type, color }) => {
        const plan = byType.get(type);
        const count = Number(plan?.count || 0);
        return {
          type,
          color,
          count,
          percentage: Number(plan?.percentage ?? (total > 0 ? (count / total * 100).toFixed(1) : 0)),
        };
      }));
      setRevenue({
        currency: revenueData.currency ?? "EGP",
        total: Number(revenueData.total || 0),
        byPlan: PLAN_TYPES.map(({ type }) => {
          const plan = revenueData.byPlan?.find((item) => item.type === type);
          return {
            type,
            count: Number(plan?.count || 0),
            price: Number(plan?.price || 0),
            revenue: Number(plan?.revenue || 0),
          };
        }),
      });
      setDashboardRequest({ status: "succeeded", error: "" });
    } catch (error) {
      if (signal?.aborted) return;
      setDashboardRequest({
        status: "failed",
        error: error.response?.data?.message ?? t("admin.home.dashboardError"),
      });
    }
  }, [t]);

  const refreshDashboard = useCallback((signal) => {
    loadStats(signal);
    loadDashboard(signal);
  }, [loadDashboard, loadStats]);

  useEffect(() => {
    const controller = new AbortController();
    const initialLoad = window.setTimeout(() => refreshDashboard(controller.signal), 0);
    const refreshTimer = window.setInterval(() => refreshDashboard(), 60_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") refreshDashboard();
    };
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      controller.abort();
      window.clearTimeout(initialLoad);
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [refreshDashboard]);

  const dashboardLoading = dashboardRequest.status === "loading";
  const dashboardError = dashboardRequest.status === "failed" ? dashboardRequest.error : "";
  const shared = { t, language: i18n.language };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <Hero admin={admin} kpis={kpis} loading={dashboardLoading} {...shared} />

      <StatCards
        stats={stats}
        loading={request.status === "loading"}
        error={request.status === "failed" ? request.error : ""}
        {...shared}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UserGrowthChart monthly={monthly} loading={dashboardLoading} error={dashboardError} {...shared} />
        </div>
        <PlanDistributionChart plans={plans} loading={dashboardLoading} error={dashboardError} {...shared} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <RevenueCard revenue={revenue} loading={dashboardLoading} error={dashboardError} {...shared} />
        <ExpiringUsersList
          users={expiringUsers}
          total={expiringUsersTotal}
          loading={dashboardLoading}
          error={dashboardError}
          {...shared}
        />
        <div className="lg:col-span-2 xl:col-span-1">
          <RecentActivity logs={recentLogs} loading={dashboardLoading} error={dashboardError} {...shared} />
        </div>
      </div>
    </div>
  );
}

export default AdminHomePage;
