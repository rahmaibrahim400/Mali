import TransactionRow from "./TransactionRow";
import { ListSkeleton } from "../../../components/common/Skeleton";

function TransactionList({ transactions, status, error, formatDate, t }) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80" aria-live="polite">
      {status === "loading" && <ListSkeleton rows={5} label={t("accounts.transactions.loading")} />}
      {error && (
        <p className="rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">{error}</p>
      )}
      {status === "succeeded" && transactions.length === 0 && (
        <p className="text-slate-500">{t("accounts.transactions.empty")}</p>
      )}

      <div className="flex flex-col divide-y divide-slate-100">
        {transactions.map((transaction) => (
          <TransactionRow key={transaction._id} transaction={transaction} formatDate={formatDate} t={t} />
        ))}
      </div>
    </section>
  );
}

export default TransactionList;
