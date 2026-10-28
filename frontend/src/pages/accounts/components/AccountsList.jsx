import AccountCard from "./AccountCard";
import { CardGridSkeleton } from "../../../components/common/Skeleton";

function AccountsList({ accounts, showArchived, status, error, adjustStatus, onToggleView, onAdjust, onToggleArchive, t }) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t("accounts.listTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {showArchived ? t("accounts.archivedTitle") : t("accounts.activeTitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleView}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
        >
          {showArchived ? t("accounts.viewActive") : t("accounts.viewArchived")}
        </button>
      </div>

      {status === "loading" && <CardGridSkeleton cards={3} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" label={t("accounts.loading")} />}
      {error && (
        <p className="mt-4 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">{error}</p>
      )}
      {status === "succeeded" && accounts.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
          {showArchived ? t("accounts.emptyArchived") : t("accounts.empty")}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard
            key={account._id}
            account={account}
            adjustStatus={adjustStatus}
            onAdjust={onAdjust}
            onToggleArchive={onToggleArchive}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}

export default AccountsList;
