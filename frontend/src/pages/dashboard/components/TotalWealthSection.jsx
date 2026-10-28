import TotalWealthCard from "../../../components/dashboard/TotalWealthCard";


function TotalWealthSection({
  status,
  totalCurrencies,
  accountsCount,
  trendData,
  onOpenAccounts,
  periodIncome,
  periodExpenses,
  periodLabel,
  summaryCurrency = "EGP",
  currencies = [],
  onCurrencyChange,
  t,
}) {
  if (status === "loading") {
    return (
      <div role="status" aria-live="polite" className="h-full rounded-3xl bg-brand-600 p-6 text-white shadow-(--hero-shadow) sm:p-8 emerald:bg-navy-900">
        <span className="sr-only">{t("accounts.loading")}</span>
        <p className="text-sm font-medium text-white/70">{t("accounts.totalWealth")}</p>
        <div aria-hidden="true" className="mt-6 flex items-end justify-between gap-4">
          <span className="block h-11 w-48 animate-pulse rounded-full bg-white/20" />
          <span className="hidden h-16 flex-1 items-end justify-end gap-1 sm:flex">
            {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
              <span key={i} className="block w-1.5 animate-pulse rounded-full bg-white/20" style={{ height: `${h}%` }} />
            ))}
          </span>
        </div>
      </div>
    );
  }

  if (totalCurrencies.length === 0) {
    return (
      <div className="h-full rounded-3xl bg-brand-600 p-6 text-white shadow-(--hero-shadow) sm:p-8 emerald:bg-navy-900">
        <p className="text-sm font-medium text-white/70">{t("accounts.totalWealth")}</p>
        <p className="mt-2 text-lg font-semibold text-white/90">{t("accounts.noBalance")}</p>
      </div>
    );
  }

  // Show one card for the active currency; the switcher inside it drives both this card and the summary below.
  const activeEntry = totalCurrencies.find(([code]) => code === summaryCurrency) || totalCurrencies[0];
  const [currency, total] = activeEntry;

  return (
    <div className="h-full">
      <TotalWealthCard
        label={t("accounts.totalWealth")}
        amount={total}
        currency={currency}
        onOpenAccounts={onOpenAccounts}
        accountsCount={accountsCount}
        trendData={trendData}
        periodIncome={periodIncome}
        periodExpenses={periodExpenses}
        periodLabel={periodLabel}
        currencies={currencies}
        onCurrencyChange={onCurrencyChange}
      />
    </div>
  );
}

export default TotalWealthSection;
