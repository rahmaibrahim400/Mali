import { useTranslation } from "react-i18next";
import { formatNumber } from "../../../utils/formatAmount";

function DebtTabs({ activeTab, setActiveTab, activeDebts, completedDebts, debts }) {
  const { t } = useTranslation();

  return (
    <>
    <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-200">
      {/* "All" first: the page opens on it. */}
      <button
        type="button"
        onClick={() => setActiveTab("all")}
        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
          activeTab === "all"
            ? "border-slate-800 text-slate-800"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        <span>{t("debts.tabs.all")}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            activeTab === "all"
              ? "bg-slate-200 text-slate-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {formatNumber(debts.length)}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("active")}
        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
          activeTab === "active"
            ? "border-brand-600 text-brand-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        <span>{t("debts.tabs.active")}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            activeTab === "active"
              ? "bg-brand-100 text-brand-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {formatNumber(activeDebts.length)}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("completed")}
        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
          activeTab === "completed"
            ? "border-emerald-600 text-emerald-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        <span>{t("debts.tabs.completed")}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            activeTab === "completed"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {formatNumber(completedDebts.length)}
        </span>
      </button>
    </div>
    </>
  );
}

export default DebtTabs;
