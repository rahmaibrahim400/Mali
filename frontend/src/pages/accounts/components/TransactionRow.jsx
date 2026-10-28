import { formatMoney } from "../../../utils/formatAmount";

function TransactionRow({ transaction, formatDate, t }) {
  const isCredit = transaction.type === "credit";
  const isDebit = transaction.type === "debit";
  const amountClass = isCredit ? "text-income" : isDebit ? "text-expense" : "text-slate-900";
  const currency = transaction.account?.currency;
  const signedAmount = isDebit ? -Math.abs(Number(transaction.amount)) : Number(transaction.amount);

  return (
    <article className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
      <div>
        <span className="block text-xs font-medium text-slate-500">{t("accounts.transactions.date")}</span>
        <span className="text-sm text-slate-700">{formatDate(transaction.date)}</span>
      </div>
      <div>
        <span className="block text-xs font-medium text-slate-500">{t("accounts.transactions.description")}</span>
        <span className="text-sm text-slate-700">{transaction.description}</span>
      </div>
      <div>
        <span className="block text-xs font-medium text-slate-500">{t("accounts.transactions.amount")}</span>
        <span className={`tabular-amount text-sm font-bold ${amountClass}`}>
          {formatMoney(signedAmount, currency, { signDisplay: isCredit || isDebit ? "exceptZero" : "auto" })}
        </span>
      </div>
      <div>
        <span className="block text-xs font-medium text-slate-500">{t("accounts.transactions.balanceAfter")}</span>
        <span className="tabular-amount text-sm font-bold text-slate-900">
          {formatMoney(transaction.balanceAfter, currency)}
        </span>
      </div>
    </article>
  );
}

export default TransactionRow;
