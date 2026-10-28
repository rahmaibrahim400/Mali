import { useTranslation } from "react-i18next";
import { ReceiptText } from "lucide-react";
import DebtCard from "./DebtCard";
import { CardGridSkeleton } from "../../../components/common/Skeleton";

function DebtsList({ debtsLoadingStatus, debts, displayedDebts, activeTab, ...cardProps }) {
  const { t } = useTranslation();

  return (
    <>
    {debtsLoadingStatus === "loading" && debts.length === 0 ? (
      <CardGridSkeleton
        cards={2}
        className="grid grid-cols-1 gap-4"
        label={t("debts.loading")}
      />
    ) : displayedDebts.length === 0 ? (
      <div className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-sm ring-1 ring-slate-100">
        <ReceiptText className="mx-auto mb-3 text-slate-300" size={42} />
        <p className="text-base font-semibold text-slate-700">
          {activeTab === "active"
            ? t("debts.empty.activeTitle")
            : activeTab === "completed"
            ? t("debts.empty.completedTitle")
            : t("debts.empty.allTitle")}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {activeTab === "active"
            ? t("debts.empty.activeSubtitle")
            : t("debts.empty.otherSubtitle")}
        </p>
      </div>
    ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* One debt per row: opening a card's payment history only moves the cards below it. */}
          {displayedDebts.map((debt) => (
            <div key={debt._id} className="min-w-0">
              <DebtCard debt={debt} {...cardProps} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default DebtsList;
