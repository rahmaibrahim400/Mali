import { useTranslation } from "react-i18next";
import TotalsCard from "../../../components/common/TotalsCard";
import { errorClass } from "../constants";

function IncomeTotalCard({ displayedTotal, totalsByCurrency, summaryCurrency, summaryStatus, summaryError }) {
  const { t } = useTranslation();
  const totals =
    summaryCurrency === "ALL" ? Object.entries(totalsByCurrency || {}) : [[summaryCurrency, displayedTotal]];

  return (
    <TotalsCard title={t("income.totalLabel")} totals={totals}>
      {summaryStatus === "loading" && (
        <p className="mt-3 text-sm text-hero-muted">
          {t("income.summaryUpdating")}
        </p>
      )}

      {summaryError && (
        <p className={`mt-3 ${errorClass}`}>
          {summaryError}
        </p>
      )}
    </TotalsCard>
  );
}

export default IncomeTotalCard;
