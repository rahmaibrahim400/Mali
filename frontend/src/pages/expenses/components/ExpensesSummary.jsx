import { useTranslation } from "react-i18next";
import TotalsCard from "../../../components/common/TotalsCard";

// totalsByCurrency: [[currency, total], ...], largest first — one tile per currency.
function ExpensesSummary({ isFiltered, totalsByCurrency = [] }) {
  const { t } = useTranslation();
  const title = `${t("expenses.totalLabel")} ${isFiltered ? t("expenses.totalFilteredSuffix") : ""}`.trim();

  return <TotalsCard title={title} totals={totalsByCurrency.length ? totalsByCurrency : [["EGP", 0]]} />;
}

export default ExpensesSummary;
