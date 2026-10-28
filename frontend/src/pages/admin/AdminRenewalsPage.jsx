import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { activityLogged } from "../../store/slices/notificationsSlice";
import { ArrowRight, BadgeCheck, ClipboardCheck, Eye, Inbox, PartyPopper, Landmark, Loader2, ShieldCheck, Smartphone, X } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { approveRenewal, fetchRenewalProof, fetchRenewals, rejectRenewal } from "../../api/adminExtrasApi";
import { formatMoney } from "../../utils/formatAmount";
import Money from "../../components/common/Money";
import { toIntlLocale } from "../../i18n/locale";

const TABS = ["pending", "approved", "rejected"];
const METHOD_ICON = { vodafone_cash: Smartphone, instapay: Landmark };
const STATUS_PILL = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

// Users asking to renew: approve (the plan starts right away) or reject, with an optional note.
function AdminRenewalsPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [status, setStatus] = useState("loading");
  const [busyId, setBusyId] = useState(""); // "<id>:approve" | "<id>:reject" while a decision is sent
  const [responses, setResponses] = useState({});
  const [error, setError] = useState("");
  const [proof, setProof] = useState(null); // { url, item } while the screenshot is open
  const [proofLoadingId, setProofLoadingId] = useState("");
  const dateFormat = new Intl.DateTimeFormat(toIntlLocale(i18n.language), { dateStyle: "medium" });

  const load = useCallback(async () => {
    try {
      const { data } = await fetchRenewals({ status: tab });
      setItems(data.data);
      setPendingCount(data.pendingCount);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [tab]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);


  const openProof = async (item) => {
    setProofLoadingId(item._id);
    setError("");
    try {
      const { data } = await fetchRenewalProof(item._id);
      setProof({ url: URL.createObjectURL(data), item });
    } catch {
      setError(t("admin.renewals.proofError"));
    }
    setProofLoadingId("");
  };

  const closeProof = () => {
    if (proof) URL.revokeObjectURL(proof.url);
    setProof(null);
  };

  const decide = async (item, approve) => {
    closeProof();
    setError("");
    setBusyId(`${item._id}:${approve ? "approve" : "reject"}`);
    try {
      await (approve ? approveRenewal : rejectRenewal)(item._id, responses[item._id] || "");
      setItems((current) => current.filter((entry) => entry._id !== item._id));
      setPendingCount((count) => Math.max(0, count - 1));
      // The result goes to the bell, not a toast over the page.
      dispatch(
        activityLogged({
          type: approve ? "renewalApprovedByAdmin" : "renewalRejectedByAdmin",
          data: { source: "renewals", name: item.user?.name || item.user?.email || "", plan: item.plan },
        })
      );
    } catch (decideError) {
      setError(decideError.response?.data?.message || t("admin.renewals.actionError"));
    }
    setBusyId("");
  };

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <PageHeader icon={ClipboardCheck} title={t("admin.renewals.title")} subtitle={t("admin.renewals.subtitle")} />

      <div role="tablist" aria-label={t("admin.renewals.title")} className="no-scrollbar mb-5 flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-fit">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setStatus("loading");
              setTab(key);
            }}
            className={`inline-flex min-h-10 flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition sm:flex-none sm:gap-2 sm:px-4 ${
              tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t(`admin.renewals.tabs.${key}`)}
            {key === "pending" && pendingCount > 0 && (
              <span className="tabular-amount inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">{error}</p>}

      {status === "loading" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden="true">
          {[0, 1].map((item) => <span key={item} className="skeleton block h-48 rounded-2xl" />)}
        </div>
      ) : status === "error" ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{t("admin.renewals.loadError")}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            {tab === "pending" ? <PartyPopper size={22} /> : <Inbox size={22} />}
          </span>
          <p className="text-sm text-slate-500">{t(`admin.renewals.empty.${tab}`)}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => (
            <li key={item._id} className="@container card-hover flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="p-5">
                {/* Who, and when they asked */}
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {(item.user?.name || item.user?.email || "?").trim()[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    {item.user ? (
                      <Link to={`/admin/users/${item.user._id}`} className="block truncate text-sm font-semibold text-slate-900 hover:underline">
                        {item.user.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-500">{t("admin.auditLogs.deletedPerson")}</p>
                    )}
                    <p dir="ltr" className="mt-0.5 truncate text-xs text-slate-500 rtl:text-right">{item.user?.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[item.status]}`}>
                      {t(`admin.renewals.tabs.${item.status}`)}
                    </span>
                    <time dateTime={item.createdAt} title={t("admin.renewals.requestedOn")} className="text-[11px] text-slate-400">
                      {dateFormat.format(new Date(item.createdAt))}
                    </time>
                  </div>
                </div>

                {/* The change being asked for, and what it costs */}
                <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">{t("admin.renewals.requestedPlan")}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-500" title={t("admin.renewals.currentPlan")}>
                        {item.user ? t(`admin.home.plans.${item.user.subscriptionType}`, { defaultValue: item.user.subscriptionType }) : "—"}
                      </span>
                      <ArrowRight size={14} className="shrink-0 text-slate-300 rtl:rotate-180" aria-hidden="true" />
                      <span className="text-lg font-bold text-slate-900">{t(`admin.home.plans.${item.plan}`)}</span>
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-[11px] font-medium text-slate-500">{t("admin.renewals.price")}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      <Money value={item.price} currency={item.currency} />
                    </p>
                  </div>
                </div>

                {item.payment?.method && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
                        {(() => {
                          const MethodIcon = METHOD_ICON[item.payment.method] || ShieldCheck;
                          return <MethodIcon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />;
                        })()}
                        <span className="truncate">{t(`subscription.methods.${item.payment.method}`)}</span>
                        {item.payment.verifiedAt && (
                          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <ShieldCheck size={12} />
                            {t("admin.renewals.verified")}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => openProof(item)}
                        disabled={proofLoadingId === item._id}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-current disabled:opacity-60"
                      >
                        {proofLoadingId === item._id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                        {t("admin.renewals.viewProof")}
                      </button>
                    </div>
                    <dl className="mt-3 space-y-2 text-xs">
                      {[
                        [t("subscription.checkout.reference"), item.payment.reference],
                        [t(`subscription.checkout.sender.${item.payment.method}`), item.payment.sender],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-baseline justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">{label}</dt>
                          <dd dir="ltr" className="tabular-amount min-w-0 truncate text-[13px] font-semibold text-slate-800">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {item.note && (
                  <p className="mt-4 whitespace-pre-wrap break-words border-s-2 border-slate-200 ps-3 text-sm text-slate-600">
                    {item.note}
                  </p>
                )}
              </div>

              {/* Footer strip: reply and decision (pending), or who handled it */}
              {item.status === "pending" ? (
                <div className="mt-auto space-y-3 border-t border-slate-100 bg-slate-50/70 p-4">
                  <input
                    value={responses[item._id] || ""}
                    maxLength={500}
                    onChange={(event) => setResponses((current) => ({ ...current, [item._id]: event.target.value }))}
                    placeholder={t("admin.renewals.responsePlaceholder")}
                    aria-label={t("admin.renewals.responsePlaceholder")}
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
                  />
                  {(() => {
                    const busy = busyId.startsWith(`${item._id}:`);
                    const approving = busyId === `${item._id}:approve`;
                    const rejecting = busyId === `${item._id}:reject`;
                    return (
                      // Two equal buttons: the main action first, the destructive one beside it.
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(item, true)}
                          className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                        >
                          {approving ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <BadgeCheck size={17} className="shrink-0" />}
                          <span className="truncate">{item.payment?.method ? t("admin.renewals.confirmPayment") : t("admin.renewals.approve")}</span>
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(item, false)}
                          className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                        >
                          {rejecting ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <X size={16} className="shrink-0" />}
                          <span className="truncate">{item.payment?.method ? t("admin.renewals.rejectPayment") : t("admin.renewals.reject")}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p className="mt-auto border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500">
                  {t("admin.renewals.handledBy", {
                    name: item.handledByName || "—",
                    date: item.handledAt ? dateFormat.format(new Date(item.handledAt)) : "—",
                  })}
                  {item.response && <span className="mt-1 block text-slate-600">“{item.response}”</span>}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Payment screenshot */}
      {proof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4" onClick={closeProof}>
          <div className="max-h-full w-full max-w-lg overflow-auto rounded-2xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{t("admin.renewals.proofTitle", { name: proof.item.user?.name || "" })}</p>
                <p className="text-xs text-slate-500">
                  {formatMoney(proof.item.price, proof.item.currency)} · {t(`subscription.methods.${proof.item.payment.method}`)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeProof}
                aria-label={t("common.close")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <img src={proof.url} alt={t("subscription.checkout.proof")} className="w-full rounded-xl bg-slate-50 object-contain" />
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{t("admin.renewals.verifyHint")}</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminRenewalsPage;
