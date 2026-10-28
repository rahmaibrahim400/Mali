import { ArrowUp, ArrowDown } from "lucide-react";
import { formatDate, formatPercent } from "../../../utils/formatAmount";
import Money from "../../../components/common/Money";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";
import { StatsSkeleton } from "../../../components/common/Skeleton";

const PERIOD_OPTIONS = ["month", "last_month", "3months", "custom"];

function MonthlySummaryCard({
  data,
  status,
  period,
  onPeriodChange,
  from,
  to,
  onFromChange,
  onToChange,
  currency = "EGP",
  t,
}) {
  const income = data?.income?.total ?? 0;
  const expenses = data?.expenses?.total ?? 0;
  const net = data?.netBalance ?? income - expenses;
  const isPositive = net >= 0;
  const previous = data?.prev;
  const formatPeriodDate = (date) => formatDate(date);
  const selectedPeriod = data?.period;
  const selectedPeriodLabel = selectedPeriod?.start && selectedPeriod?.end
    ? `${formatPeriodDate(selectedPeriod.start)} - ${formatPeriodDate(selectedPeriod.end)}`
    : period === "custom" && from && to
      ? `${formatPeriodDate(from)} - ${formatPeriodDate(to)}`
      : t(`dashboard.period.${period}`);

  const prevIncome = previous?.income?.total;
  const prevExpenses = previous?.expenses?.total;
  const hasPrevNet = prevIncome != null || prevExpenses != null;
  const prevNet = hasPrevNet ? Number(prevIncome || 0) - Number(prevExpenses || 0) : null;
  const savingsRate = income > 0 ? (net / income) * 100 : null;

  // One compact row under each tile: the change badge (when there's something to compare)
  // alongside the previous-period figure, instead of two disconnected blocks with a gap between them.
  // currencyClassName: the deficit card passes "" so its currency keeps the card's red.
  const renderComparison = (current, previousValue, type, currencyClassName) => {
    const hasPrevious = previousValue !== null && previousValue !== undefined;
    const difference = hasPrevious ? current - previousValue : 0;
    const showBadge = hasPrevious && previousValue !== 0 && difference !== 0;
    const percentage = showBadge ? Math.abs((difference / Math.abs(previousValue)) * 100) : 0;
    const isImprovement = type === "expenses" ? difference < 0 : difference > 0;
    const Icon = difference > 0 ? ArrowUp : ArrowDown;

    return (
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {showBadge ? (
          <span
            className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${
              isImprovement ? "text-income" : "text-expense"
            }`}
          >
            <Icon size={12} strokeWidth={2.5} />
            <span className="tabular-amount">{formatPercent(percentage, percentage < 10 ? 1 : 0)}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">{t("dashboard.summary.noComparison")}</span>
        )}
        <span className="truncate text-xs text-slate-400">
          {t("dashboard.summary.previousPeriod")}{" "}
          <span className="tabular-amount font-semibold text-slate-600">
            {hasPrevious ? (
              <Money value={previousValue} currency={currency} currencyClassName={currencyClassName} />
            ) : (
              t("dashboard.summary.notAvailable")
            )}
          </span>
        </span>
      </div>
    );
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">{t("dashboard.summary.title")}</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {t("dashboard.period.selected")}: <span className="font-semibold text-slate-700">{selectedPeriodLabel}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value)}
            className="min-w-48 bg-slate-50/60 px-4 py-2 text-sm font-medium text-slate-700"
          >
            {PERIOD_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {t(`dashboard.period.${key}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {period === "custom" && (
        <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
          <div>
            <label htmlFor="summary-from" className="text-xs font-semibold text-slate-600">{t("dashboard.period.from")}</label>
            <DatePicker
              id="summary-from"
              value={from}
              max={to || undefined}
              onChange={onFromChange}
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            />
          </div>
          <div>
            <label htmlFor="summary-to" className="text-xs font-semibold text-slate-600">{t("dashboard.period.to")}</label>
            <DatePicker
              id="summary-to"
              value={to}
              min={from || undefined}
              onChange={onToChange}
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            />
          </div>
        </div>
      )}

      {period === "custom" && from && to && from > to && (
        <p className="mt-2 text-xs font-semibold text-expense">{t("dashboard.period.invalid")}</p>
      )}

      {status === "loading" && !data ? (
        <StatsSkeleton bare count={3} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3" label={t("dashboard.summary.loading")} />
      ) : (
        <div data-reveal-stagger className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card-hover rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-xs font-semibold text-slate-500">{t("dashboard.summary.income")}</span>
            <p className="tabular-amount mt-1.5 text-2xl font-extrabold text-slate-900"><Money value={income} currency={currency} /></p>
            {renderComparison(income, prevIncome, "income")}
          </div>

          <div className="card-hover rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-xs font-semibold text-slate-500">{t("dashboard.summary.expenses")}</span>
            <p className="tabular-amount mt-1.5 text-2xl font-extrabold text-slate-900"><Money value={expenses} currency={currency} /></p>
            {renderComparison(expenses, prevExpenses, "expenses")}
          </div>

          <div className="card-hover rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {isPositive ? t("dashboard.summary.net") : t("dashboard.summary.deficit")}
              </span>
              {savingsRate !== null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {t("dashboard.summary.savingsRate")}{" "}
                  <span className="tabular-amount font-bold text-slate-900">{formatPercent(savingsRate, 0)}</span>
                </span>
              )}
            </div>
            <p className={`tabular-amount mt-1.5 text-2xl font-extrabold ${isPositive ? "text-income" : "text-expense"}`}>
              <Money value={Math.abs(net)} currency={currency} currencyClassName={isPositive ? undefined : ""} />
            </p>
            {renderComparison(net, prevNet, "income", isPositive ? undefined : "")}
          </div>
        </div>
      )}
    </section>
  );
}

export default MonthlySummaryCard;
