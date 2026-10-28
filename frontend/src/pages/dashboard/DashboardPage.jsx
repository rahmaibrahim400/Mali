import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchAccounts } from "../../store/slices/accountsSlice";
import { fetchDebts } from "../../store/slices/debtsSlice";
import { fetchDashboardSummary } from "../../store/slices/dashboardSlice";
import DashboardGreeting from "./components/DashboardGreeting";
import TotalWealthSection from "./components/TotalWealthSection";
import QuickLinks from "./components/QuickLinks";
import AccountsPreview from "./components/AccountsPreview";
import DashboardDebtsCard from "./components/DashboardDebtsCard";
import MonthlySummaryCard from "./components/MonthlySummaryCard";
import ExpenseCategoryChart from "./components/ExpenseCategoryChart";
import CashBalanceWidget from "./components/CashBalanceWidget";
import { Skeleton } from "../../components/common/Skeleton";
import ScrollReveal from "../../components/common/ScrollReveal";

function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, status } = useSelector((state) => state.accounts);
  const { items: debts, status: debtsStatus } = useSelector((state) => state.debts);
  const { data: summaryData, status: summaryStatus } = useSelector((state) => state.dashboard);

  const [period, setPeriod] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  // null = let the server pick (EGP, or the user's first currency).
  const [currency, setCurrency] = useState(null);

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchDebts());
  }, [dispatch]);

  useEffect(() => {
    if (period === "custom" && (!from || !to || from > to)) return;
    const params = period === "custom" ? { period, from, to } : { period };
    if (currency) params.currency = currency;
    dispatch(fetchDashboardSummary(params));
  }, [dispatch, period, from, to, currency]);

  const activeAccounts = items.filter((account) => !account.isArchived);
  const cashAccount = activeAccounts.find((account) => account.type === "cash");
  const totalsByCurrency = summaryData?.accountBalancesByCurrency || {};
  const totalCurrencies = Object.entries(totalsByCurrency);
  // Every summary amount (income, expenses, categories, debts) is in this one currency.
  const summaryCurrency = summaryData?.currency || "EGP";
  const summaryCurrencies = summaryData?.currencies || [];
  // Sections start revealing once everything has loaded: before that the page is short and
  // every section counts as "in view", so the ones further down would play unseen.
  const settled = (value) => value !== "idle" && value !== "loading";
  const pageReady = settled(summaryStatus) && settled(status) && settled(debtsStatus);

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardGreeting user={user} t={t} />

      {/*
        Phones keep the DOM order (wealth, cash, shortcuts, summary, chart, debts, accounts).
        From lg up the same items are re-placed on a 12-column grid with order utilities:
          shortcuts → wealth beside cash → summary → chart beside debts (xl) → accounts row.
      */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ScrollReveal ready={pageReady} index={1} className="lg:order-2 lg:col-span-8">
          <TotalWealthSection
            status={summaryStatus}
            totalCurrencies={totalCurrencies}
            accountsCount={activeAccounts.length}
            trendData={summaryData?.wealthTrend || []}
            onOpenAccounts={() => navigate("/accounts")}
            summaryCurrency={summaryCurrency}
            periodIncome={summaryData?.income?.total}
            periodExpenses={summaryData?.expenses?.total}
            periodLabel={period === "custom" ? t("dashboard.period.custom") : t(`dashboard.period.${period}`)}
            currencies={summaryCurrencies}
            onCurrencyChange={setCurrency}
            t={t}
          />
        </ScrollReveal>
        <ScrollReveal ready={pageReady} index={2} className="lg:order-3 lg:col-span-4">
          {status === "loading" ? (
            <Skeleton className="h-[84px] rounded-2xl lg:h-full lg:min-h-40" />
          ) : (
            <CashBalanceWidget
              cashAccount={cashAccount}
              totalWealth={cashAccount ? totalsByCurrency[cashAccount.currency || "EGP"] : undefined}
              t={t}
            />
          )}
        </ScrollReveal>
        <ScrollReveal ready={pageReady} index={0} className="lg:order-1 lg:col-span-12">
          <QuickLinks t={t} />
        </ScrollReveal>

        <ScrollReveal ready={pageReady} index={3} className="lg:order-4 lg:col-span-12">
          <MonthlySummaryCard
            data={summaryData}
            status={summaryStatus}
            period={period}
            onPeriodChange={setPeriod}
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
            currency={summaryCurrency}
            t={t}
          />
        </ScrollReveal>

        <ScrollReveal ready={pageReady} index={4} className="lg:order-5 lg:col-span-12 xl:col-span-7">
          <ExpenseCategoryChart
            categories={summaryData?.expenseCategories || []}
            loading={summaryStatus === "loading" && !summaryData}
            currency={summaryCurrency}
            t={t}
          />
        </ScrollReveal>
        <ScrollReveal ready={pageReady} index={5} className="lg:order-6 lg:col-span-12 xl:col-span-5">
          <DashboardDebtsCard debts={debts} debtSummary={summaryData?.debts} currency={summaryCurrency} status={debtsStatus} />
        </ScrollReveal>
        <ScrollReveal ready={pageReady} index={6} className="lg:order-7 lg:col-span-12">
          <AccountsPreview status={status} accounts={activeAccounts} t={t} />
        </ScrollReveal>
      </div>
    </div>
  );
}

export default DashboardPage;
