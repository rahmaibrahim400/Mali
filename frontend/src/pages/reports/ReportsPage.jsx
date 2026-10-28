import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as reportsApi from "../../api/reportsApi";
import ReportPeriodSelector from "./components/ReportPeriodSelector";
import IncomeExpensesSection from "./components/IncomeExpensesSection";
import CategoriesSection from "./components/CategoriesSection";
import CashFlowSection from "./components/CashFlowSection";
import SavingsRateSection from "./components/SavingsRateSection";
import NetWorthSection from "./components/NetWorthSection";
import DebtProgressSection from "./components/DebtProgressSection";
import SpendingHabitsSection from "./components/SpendingHabitsSection";
import { extractError } from "../../utils/errorHandler";
import PageHeader from "../../components/common/PageHeader";
import { BarChart3 } from "lucide-react";

const TABS = [
  { key: "incomeExpenses", fetcher: reportsApi.getIncomeExpenses, usesPeriod: true },
  { key: "categories", fetcher: reportsApi.getCategories, usesPeriod: true },
  { key: "cashFlow", fetcher: reportsApi.getCashFlow, usesPeriod: true },
  { key: "savingsRate", fetcher: reportsApi.getSavingsRate, usesPeriod: true },
  { key: "netWorth", fetcher: reportsApi.getNetWorth, usesPeriod: true },
  { key: "debtProgress", fetcher: reportsApi.getDebtProgress, usesPeriod: false },
  { key: "habits", fetcher: reportsApi.getSpendingHabits, usesPeriod: true },
];

function ReportsPage() {
  const { t } = useTranslation();
  const [months, setMonths] = useState(6);
  const [activeTab, setActiveTab] = useState("incomeExpenses");
  const [dataByTab, setDataByTab] = useState({});
  const [loadingTab, setLoadingTab] = useState(null);
  const [error, setError] = useState("");

  const currentTab = TABS.find((tab) => tab.key === activeTab);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingTab(activeTab);
      setError("");
      try {
        const res = await currentTab.fetcher(currentTab.usesPeriod ? months : undefined);
        if (!cancelled) {
          setDataByTab((prev) => ({ ...prev, [activeTab]: res.data.data }));
        }
      } catch (err) {
        if (!cancelled) setError(extractError(err, t("reports.loadError")));
      } finally {
        if (!cancelled) setLoadingTab(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, months]);

  const isLoading = loadingTab === activeTab;
  const data = dataByTab[activeTab];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        icon={BarChart3}
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        actions={currentTab.usesPeriod && <ReportPeriodSelector months={months} onChange={setMonths} />}
      />

      <div className="flex gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {TABS.map(({ key }) => (
          <button
            key={key}
            type="button"
            onClick={(event) => {
              setActiveTab(key);
              // Phones: the tab strip scrolls sideways, so bring the chosen tab into view.
              event.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === key ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t(`reports.tabs.${key}`)}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-expense-soft px-4 py-3 text-sm font-medium text-expense">
          {error}
          <button type="button" onClick={() => setError("")} aria-label={t("common.close")} className="ms-3 font-bold">×</button>
        </div>
      )}

      {activeTab === "incomeExpenses" && <IncomeExpensesSection data={data} loading={isLoading} />}
      {activeTab === "categories" && <CategoriesSection data={data} loading={isLoading} />}
      {activeTab === "cashFlow" && <CashFlowSection data={data} loading={isLoading} />}
      {activeTab === "savingsRate" && <SavingsRateSection data={data} loading={isLoading} />}
      {activeTab === "netWorth" && <NetWorthSection data={data} loading={isLoading} />}
      {activeTab === "debtProgress" && <DebtProgressSection data={data} loading={isLoading} />}
      {activeTab === "habits" && <SpendingHabitsSection data={data} loading={isLoading} />}
    </div>
  );
}

export default ReportsPage;
