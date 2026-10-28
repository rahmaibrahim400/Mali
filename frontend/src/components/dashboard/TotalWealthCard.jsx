import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff, Wallet, Scale } from "lucide-react";
import { formatMoney, currencyName } from "../../utils/formatAmount";
import Money from "../common/Money";

const HIDE_KEY = "hideTotalWealth";

function TotalWealthCard({
  label,
  amount,
  currency,
  onOpenAccounts,
  trendData = [],
  accountsCount,
  periodIncome,
  periodExpenses,
  periodLabel,
  currencies = [],
  onCurrencyChange,
}) {
  const { t } = useTranslation();
  const [grown, setGrown] = useState(false);
  // Hide the amounts (e.g. in public); remembered on this device.
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggleHidden = (event) => {
    event.stopPropagation();
    setHidden((value) => {
      try {
        localStorage.setItem(HIDE_KEY, value ? "0" : "1");
      } catch {
        // Storage blocked: the choice lasts for this visit.
      }
      return !value;
    });
  };
  const masked = (content) => (hidden ? "••••••" : content);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const maxTrendValue = trendData.length ? Math.max(...trendData, 1) : 0;
  const showPeriod = Number.isFinite(periodIncome) || Number.isFinite(periodExpenses);
  const net = Number(periodIncome || 0) - Number(periodExpenses || 0);

  // text-income/text-expense are tuned for white cards; on this dark card they read as dull/washed
  // out, so the brighter dark-mode-friendly tints below are used here instead.
  const stats = [
    { key: "income", icon: ArrowUpRight, tone: "text-emerald-300", label: t("dashboard.wealth.income"), value: periodIncome },
    { key: "expenses", icon: ArrowDownRight, tone: "text-rose-300", label: t("dashboard.wealth.expenses"), value: periodExpenses },
    { key: "net", icon: Scale, tone: net >= 0 ? "text-sky-300" : "text-rose-300", label: t("dashboard.wealth.net"), value: net },
  ];

  return (
    <div className="relative h-full">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpenAccounts}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onOpenAccounts();
        }}
        className={`relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-brand-600 p-6 text-white shadow-(--hero-shadow) transition-all emerald:bg-navy-900 duration-300 ease-out sm:p-8 ${
          grown ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Top row: label, currency switcher + accounts count on the other side.
            Wraps to its own line on narrow screens instead of squeezing everything into one row. */}
        <div className="relative flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
          <span className="text-base font-semibold text-white/90">{label}</span>

          <div className="flex flex-wrap items-center gap-2">
            {currencies.length > 1 && (
              <div
                role="group"
                aria-label={t("dashboard.summary.currency")}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex rounded-full bg-white/15 p-1 ring-1 ring-white/10"
              >
                {currencies.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onCurrencyChange?.(code)}
                    aria-pressed={code === currency}
                    title={currencyName(code)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      code === currency ? "bg-white text-brand-700 shadow-sm" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}

            {Number.isFinite(accountsCount) && accountsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-white/85">
                <Wallet size={16} />
                {t("dashboard.wealth.accounts", { count: accountsCount })}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="relative flex items-center gap-3">
          <span className="tabular-amount block text-4xl font-extrabold tracking-tight sm:text-5xl">
            {masked(<Money value={amount} currency={currency} currencyClassName="text-hero-accent" />)}
          </span>
          <button
            type="button"
            onClick={toggleHidden}
            onKeyDown={(event) => event.stopPropagation()}
            aria-pressed={hidden}
            aria-label={hidden ? t("common.showAmount") : t("common.hideAmount")}
            title={hidden ? t("common.showAmount") : t("common.hideAmount")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Period income / expenses / net + trend bars */}
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          {showPeriod && (
            <div className="min-w-0 flex-1">
              {periodLabel && <p className="mb-2.5 text-sm font-semibold text-white/85">{periodLabel}</p>}
              <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-0">
                {stats.map(({ key, icon: Icon, tone, label: statLabel, value }, index) => (
                  <div
                    key={key}
                    className={`min-w-0 ${index > 0 ? "sm:border-s sm:border-white/20 sm:ps-6 sm:ms-6" : ""}`}
                  >
                    <div className="flex min-w-0 items-center gap-1.5 text-white/85">
                      <Icon size={15} strokeWidth={2.25} className={`shrink-0 rtl:-scale-x-100 ${tone}`} />
                      <span className="truncate text-xs font-medium sm:text-sm">{statLabel}</span>
                    </div>
                    <div className="mt-0.5 min-w-0">
                      <span className={`tabular-amount block truncate text-base font-bold sm:text-lg ${tone}`} dir="ltr">
                        {masked(
                          <>
                            {key === "net" && value > 0 ? "+" : ""}
                            {formatMoney(value || 0, currency)}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trendData.length > 0 && (
            <div className="ms-auto hidden flex-col items-end gap-1.5 sm:flex">
              <span className="text-xs font-medium text-white/75">{t("dashboard.wealth.trend")}</span>
              <div aria-hidden="true" className="flex h-16 items-end justify-end gap-2 border-b-2 border-white/20 pb-1">
                {trendData.map((value, index) => {
                  const heightPct = Math.max((value / maxTrendValue) * 100, 8);
                  return (
                    <div
                      key={index}
                      // The latest month stands out; earlier ones are softer.
                      className={`w-2.5 rounded-full transition-all duration-500 ease-out ${
                        index === trendData.length - 1 ? "bg-white/90 emerald:bg-brand-400" : "bg-white/40 emerald:bg-brand-400/50"
                      }`}
                      style={{
                        height: grown ? `${heightPct}%` : "0%",
                        transitionDelay: `${150 + index * 40}ms`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TotalWealthCard;
