import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, AlertTriangle } from "lucide-react";
import { getExpenses } from "../../../api/expenseApi";
import { formatPercent, formatNumber } from "../../../utils/formatAmount";
import { Skeleton } from "../../../components/common/Skeleton";
import Money from "../../../components/common/Money";

function CashBalanceWidget({ cashAccount, totalWealth, t }) {
  const balance = Number(cashAccount?.balance || 0);
  const currency = cashAccount?.currency || "EGP";
  const isEmpty = Boolean(cashAccount) && balance <= 0;
  const share = Number(totalWealth) > 0 ? Math.min(100, Math.max(0, (balance / Number(totalWealth)) * 100)) : null;

  // This month's cash spending (desktop details only).
  const cashAccountId = cashAccount?._id;
  const [monthExpenses, setMonthExpenses] = useState(null);
  useEffect(() => {
    if (!cashAccountId) return undefined;
    let cancelled = false;
    getExpenses({ account: cashAccountId, period: "month" })
      .then((res) => !cancelled && setMonthExpenses(res.data?.data || []))
      .catch(() => !cancelled && setMonthExpenses([]));
    return () => {
      cancelled = true;
    };
  }, [cashAccountId]);

  const spent = (monthExpenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="relative flex h-full flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 transition hover:ring-brand-300 lg:flex-col lg:flex-nowrap lg:items-stretch lg:justify-start lg:gap-4 lg:p-6">
      {/* The whole card opens /cash. */}
      <Link to="/cash" className="flex items-center gap-3 after:absolute after:inset-0 after:rounded-2xl">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 lg:h-11 lg:w-11">
          <Wallet size={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-500">{t("cash.widgetLabel")}</p>
          {cashAccount ? (
            <p className="tabular-amount text-lg font-extrabold text-slate-900 lg:text-2xl">
              <Money value={balance} currency={currency} />
            </p>
          ) : (
            <p className="text-sm font-semibold text-slate-500">{t("cash.widgetNoAccount")}</p>
          )}
        </div>
      </Link>

      {isEmpty && (
        <span className="flex items-center gap-1.5 self-start rounded-full bg-expense-soft px-3 py-1 text-xs font-semibold text-expense">
          <AlertTriangle size={14} />
          {t("cash.emptyAlert")}
        </span>
      )}

      {/* Desktop-only details so the tall tile carries useful information */}
      {cashAccount && (
        <div className="hidden flex-1 flex-col gap-3 lg:flex">
          {share !== null && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{t("dashboard.cash.shareOfWealth")}</span>
                <span className="tabular-amount font-bold text-slate-700">{formatPercent(share, share < 10 ? 1 : 0)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div data-reveal-bar className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(share, 2)}%` }} />
              </div>
            </div>
          )}

          <div className="mt-auto grid grid-cols-2 divide-x divide-slate-100 rounded-xl bg-slate-50 py-2.5 rtl:divide-x-reverse">
            <div className="px-3">
              <p className="text-[11px] font-medium text-slate-500">{t("dashboard.cash.spentThisMonth")}</p>
              {monthExpenses === null ? (
                <Skeleton className="mt-1 h-4 w-16" />
              ) : (
                <p className="tabular-amount text-sm font-bold text-slate-900"><Money value={spent} currency={currency} /></p>
              )}
            </div>
            <div className="px-3">
              <p className="text-[11px] font-medium text-slate-500">{t("dashboard.cash.transactions")}</p>
              {monthExpenses === null ? (
                <Skeleton className="mt-1 h-4 w-8" />
              ) : (
                <p className="tabular-amount text-sm font-bold text-slate-900">{formatNumber(monthExpenses.length)}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashBalanceWidget;
