import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Receipt } from "lucide-react";
import TotalsCard from "../../../components/common/TotalsCard";

function CashBalanceCard({ cashTotals = [], hasCashAccount }) {
  const { t } = useTranslation();
  const totals = cashTotals.length ? cashTotals : [["EGP", 0]];
  const [[, cashBalance]] = totals;

  return (
    <TotalsCard
      className=""
      title={t("cash.totalBalance")}
      totals={totals}
      action={
        hasCashAccount && (
          <Link
            to="/cash/expenses"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
          >
            <Receipt size={16} />
            {t("cash.viewExpenses")}
          </Link>
        )
      }
    >
      {hasCashAccount && cashBalance <= 0 && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-expense-soft px-3 py-2 text-sm font-semibold text-expense">
          {t("cash.emptyAlert")}
        </p>
      )}
    </TotalsCard>
  );
}

export default CashBalanceCard;
