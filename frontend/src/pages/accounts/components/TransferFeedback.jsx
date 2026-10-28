import { formatNumber, currencyLabel } from "../../../utils/formatAmount";

function TransferFeedback({ status, error, formError, lastTransfer, t }) {
  if (formError || error) {
    return (
      <p className="mb-4 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">
        {formError || error}
      </p>
    );
  }
  if (status !== "succeeded" || !lastTransfer) return null;

  return (
    <p className="mb-4 rounded-xl bg-income-soft px-4 py-2.5 text-sm font-medium text-income">
      {t("transfer.successMessage", {
        fromName: lastTransfer.from.name,
        fromBalance: formatNumber(lastTransfer.from.balance),
        fromCurrency: currencyLabel(lastTransfer.from.currency),
        toName: lastTransfer.to.name,
        toBalance: formatNumber(lastTransfer.to.balance),
        toCurrency: currencyLabel(lastTransfer.to.currency),
      })}
    </p>
  );
}

export default TransferFeedback;
