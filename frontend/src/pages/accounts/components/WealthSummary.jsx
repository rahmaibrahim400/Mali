import TotalsCard from "../../../components/common/TotalsCard";

function WealthSummary({ accounts, t }) {
  const totalsByCurrency = accounts.reduce((totals, account) => {
    const currency = account.currency || "EGP";
    totals[currency] = (totals[currency] || 0) + (Number(account.balance) || 0);
    return totals;
  }, {});

  return (
    <TotalsCard
      title={t("accounts.totalWealth")}
      totals={Object.entries(totalsByCurrency)}
      emptyText={t("accounts.noBalance")}
    />
  );
}

export default WealthSummary;
