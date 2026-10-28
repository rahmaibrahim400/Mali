import { useState, useEffect, useCallback } from "react";
import { ChevronDown, AlertCircle, Calendar, Wallet, Loader2 } from "lucide-react";



function formatMoney(amount, currency) {
  return `${Number(amount || 0).toLocaleString("ar-EG")} ${currency}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function computeDebt(debt) {
  const totalPaid = debt.paidAmount || 0;
  const remaining = Math.max((debt.totalAmount || 0) - totalPaid, 0);
  const percent = debt.totalAmount > 0 ? Math.min((totalPaid / debt.totalAmount) * 100, 100) : 0;
  const isSettled = debt.status === "paid";
  const isOverdue = debt.status === "overdue";
  return { totalPaid, remaining, percent, isSettled, isOverdue };
}

function DebtCard({ debt, apiBaseUrl, authHeaders }) {
  const [expanded, setExpanded] = useState(false);
  const [payments, setPayments] = useState(null); // null = not loaded yet
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);

  const { totalPaid, remaining, percent, isSettled, isOverdue } = computeDebt(debt);

  const barColor = isSettled ? "bg-emerald-500" : isOverdue ? "bg-red-500" : "bg-amber-500";
  const borderColor = isOverdue ? "border-red-300" : "border-slate-200";

  const toggleExpand = useCallback(async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && payments === null && !loadingPayments) {
      setLoadingPayments(true);
      setPaymentsError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/${debt._id}/payments`, {
          headers: { ...authHeaders },
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "تعذر تحميل الدفعات");
        setPayments(json.data);
      } catch (err) {
        setPaymentsError(err.message);
      } finally {
        setLoadingPayments(false);
      }
    }
  }, [expanded, payments, loadingPayments, apiBaseUrl, authHeaders, debt._id]);

  return (
    <div className={`rounded-xl border ${borderColor} bg-white overflow-hidden transition-shadow hover:shadow-md`}>
      <button onClick={toggleExpand} className="w-full text-right px-5 py-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-slate-800 text-base truncate">{debt.creditor}</span>
            {isOverdue && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                <AlertCircle size={13} />
                متأخر
              </span>
            )}
            {isSettled && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                تم السداد
              </span>
            )}
          </div>
          <ChevronDown
            size={18}
            className={`text-slate-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-right">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">المبلغ الأصلي</div>
            <div className="text-sm font-medium text-slate-700">
              {formatMoney(debt.totalAmount, debt.currency)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">إجمالي المدفوع</div>
            <div className="text-sm font-medium text-slate-700">
              {formatMoney(totalPaid, debt.currency)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">المتبقي</div>
            <div className={`text-sm font-semibold ${isOverdue ? "text-red-600" : "text-slate-800"}`}>
              {formatMoney(remaining, debt.currency)}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">نسبة الإنجاز</span>
            <span className="text-xs font-medium text-slate-600">{Math.round(percent)}٪</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 text-xs ${
            isOverdue ? "text-red-600 font-medium" : "text-slate-500"
          }`}
        >
          <Calendar size={13} />
          <span>تاريخ السداد المتوقع: {formatDate(debt.dueDate)}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          {debt.description && <p className="text-xs text-slate-500 mb-3">{debt.description}</p>}
          <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <Wallet size={13} />
            سجل الدفعات {payments ? `(${payments.length})` : ""}
          </div>

          {loadingPayments && (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
              <Loader2 size={14} className="animate-spin" />
              جاري تحميل الدفعات...
            </div>
          )}

          {paymentsError && <p className="text-xs text-red-500">{paymentsError}</p>}

          {!loadingPayments && !paymentsError && payments && payments.length === 0 && (
            <p className="text-xs text-slate-400">لا توجد دفعات مسجلة بعد</p>
          )}

          {!loadingPayments && !paymentsError && payments && payments.length > 0 && (
            <ul className="flex flex-col gap-2">
              {payments.map((p) => (
                <li
                  key={p._id}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100"
                >
                  <span className="text-sm font-medium text-slate-700">{formatMoney(p.amount, debt.currency)}</span>
                  <span className="text-xs text-slate-500">{p.notes || "—"}</span>
                  <span className="text-xs text-slate-400">{formatDate(p.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function DebtStatusList({ apiBaseUrl = "/api/debts", authHeaders = {} }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiBaseUrl, { headers: { ...authHeaders }, credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "تعذر تحميل الديون");
        if (!cancelled) setDebts(json.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, authHeaders]);

  return (
    <div dir="rtl" className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-3">
      <h2 className="text-lg font-bold text-slate-800 mb-1">حالة الديون</h2>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
          <Loader2 size={16} className="animate-spin" />
          جاري التحميل...
        </div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3 text-center">{error}</div>
      )}

      {!loading && !error && debts.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">لا توجد ديون مسجلة</p>
      )}

      {!loading &&
        !error &&
        debts.map((debt) => (
          <DebtCard key={debt._id} debt={debt} apiBaseUrl={apiBaseUrl} authHeaders={authHeaders} />
        ))}
    </div>
  );
}
