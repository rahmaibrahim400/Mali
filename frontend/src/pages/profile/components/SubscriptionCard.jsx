import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, CircleAlert, Clock, RefreshCw, X } from "lucide-react";
import { cancelMyRenewal, fetchMyRenewal } from "../../../api/userExtrasApi";
import { formatMoney } from "../../../utils/formatAmount";
import { toIntlLocale } from "../../../i18n/locale";
import Money from "../../../components/common/Money";
import RenewalCheckout from "./RenewalCheckout";
import SuccessToast from "../../../components/common/SuccessToast";

const STATUS_PILL = {
  active: "bg-emerald-50 text-emerald-700",
  expiring: "bg-amber-50 text-amber-700",
  expired: "bg-rose-50 text-rose-700",
  suspended: "bg-rose-50 text-rose-700",
};
// Months per paid plan, to compare plans by their monthly cost.
const PLAN_MONTHS = { "3months": 3, "6months": 6, yearly: 12 };
const DAY = 24 * 60 * 60 * 1000;

// The user's plan, and renewing it: pay, attach proof, wait for the admin to confirm.
function SubscriptionCard({ t, language }) {
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState("loading");
  const [checkoutPlan, setCheckoutPlan] = useState(null); // the plan the checkout opens on
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [now] = useState(() => Date.now());
  const dateFormat = new Intl.DateTimeFormat(toIntlLocale(language), { dateStyle: "medium" });

  const load = useCallback(async () => {
    try {
      const { data } = await fetchMyRenewal();
      setInfo(data.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const closeToast = useCallback(() => setToast(""), []);

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      await cancelMyRenewal();
      await load();
    } catch {
      setError(t("subscription.requestError"));
    }
    setBusy(false);
  };

  if (status === "loading") return <span className="skeleton block h-80 rounded-3xl" aria-hidden="true" />;
  if (status === "error" || !info?.subscription) {
    return (
      <section className="card-shadow h-full rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">{t("subscription.title")}</h2>
        <p role="alert" className="mt-3 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">{t("subscription.loadError")}</p>
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            load();
          }}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <RefreshCw size={15} />
          {t("subscription.retry")}
        </button>
      </section>
    );
  }

  const { subscription, latest, plans = [], currency } = info;
  const pending = latest?.status === "pending";
  const statusKey = STATUS_PILL[subscription._status] ? subscription._status : "active";
  const trial = subscription.subscriptionType === "trial";
  const expired = subscription._status === "expired";
  const planName = (plan) => t(`admin.home.plans.${plan}`, { defaultValue: plan });

  // Time left in the current plan, for the progress bar.
  const start = subscription.subscriptionStart ? new Date(subscription.subscriptionStart).getTime() : null;
  const end = subscription.subscriptionEnd ? new Date(subscription.subscriptionEnd).getTime() : null;
  const daysLeft = end ? Math.max(0, Math.ceil((end - now) / DAY)) : null;
  const used = start && end && end > start ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : null;

  // The plan with the lowest monthly cost gets a "best value" tag.
  const monthly = (option) => (PLAN_MONTHS[option.plan] ? option.price / PLAN_MONTHS[option.plan] : Infinity);
  const bestPlan = plans.length > 1 ? plans.reduce((best, option) => (monthly(option) < monthly(best) ? option : best)).plan : null;

  const openCheckout = (plan) => setCheckoutPlan(plan);

  return (
    <section className="card-shadow h-full rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      {/* Current plan */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{t("subscription.currentPlan")}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{planName(subscription.subscriptionType)}</h2>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[statusKey]}`}>
          {t(`admin.users.status.${subscription._status}`)}
        </span>
      </div>

      {end && (
        <div className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
            <span className={`font-semibold ${expired ? "text-expense" : subscription._status === "expiring" ? "text-amber-700" : "text-slate-700"}`}>
              {expired ? t("subscription.endedOn", { date: dateFormat.format(new Date(end)) }) : t("subscription.daysLeft", { count: daysLeft })}
            </span>
            <span className="text-slate-500">
              {start && `${dateFormat.format(new Date(start))} – `}
              {dateFormat.format(new Date(end))}
            </span>
          </div>
          {used !== null && (
            <div
              role="progressbar"
              aria-label={t("subscription.timeUsed")}
              aria-valuenow={Math.round(used)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className={`h-full rounded-full ${expired ? "bg-expense" : subscription._status === "expiring" ? "bg-amber-500" : "bg-accent-500 emerald:bg-brand-600"}`}
                style={{ width: `${used}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* The latest request: waiting, or how it went */}
      {pending ? (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-600 ring-1 ring-amber-200">
              <Clock size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900">{t("subscription.pendingTitle")}</p>
              <p className="mt-0.5 text-sm leading-6 text-amber-800">
                {latest.payment?.method
                  ? t("subscription.pendingPaid", {
                      plan: planName(latest.plan),
                      amount: formatMoney(latest.payment.amount, latest.payment.currency),
                      method: t(`subscription.methods.${latest.payment.method}`),
                    })
                  : t("subscription.pending", { plan: planName(latest.plan) })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
          >
            <X size={15} />
            {t("subscription.cancelRequest")}
          </button>
        </div>
      ) : (
        latest && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
              latest.status === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {latest.status === "approved" ? <BadgeCheck size={18} className="mt-0.5 shrink-0" /> : <CircleAlert size={18} className="mt-0.5 shrink-0" />}
            <p className="min-w-0 font-medium">
              {t(latest.status === "approved" ? "subscription.lastApproved" : "subscription.lastRejected", { plan: planName(latest.plan) })}
              {latest.response && <span className="mt-1 block text-xs font-normal opacity-80">“{latest.response}”</span>}
            </p>
          </div>
        )
      )}

      {/* Plans: the only place to pick one; choosing a card opens the checkout on it. */}
      {!pending && plans.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">{t("subscription.availablePlans")}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{t("subscription.howItWorks")}</p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {plans.map((option) => (
              <li key={option.plan}>
                <button
                  type="button"
                  onClick={() => openCheckout(option.plan)}
                  className={`card-hover relative flex h-full w-full flex-col rounded-2xl border bg-white p-4 text-start ${
                    option.plan === bestPlan ? "border-brand-600" : "border-slate-200"
                  }`}
                >
                  {option.plan === bestPlan && (
                    <span className="absolute -top-2.5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white inset-e-3">
                      {t("subscription.bestValue")}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-slate-700">{planName(option.plan)}</span>
                  <span className="mt-2 text-xl font-bold text-slate-900">
                    <Money value={option.price} currency={currency} />
                  </span>
                  {PLAN_MONTHS[option.plan] && (
                    <span className="mt-1 text-xs text-slate-500">
                      {t("subscription.perMonth", { amount: formatMoney(Math.round(monthly(option)), currency) })}
                    </span>
                  )}
                  {/* Pinned to the card's bottom so the three line up. */}
                  <span className="mt-auto block pt-4">
                    <span className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-700">
                      {trial ? t("subscription.subscribeNow") : t("subscription.renewWithPlan")}
                      <ArrowRight size={13} className="rtl:rotate-180" aria-hidden="true" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">{error}</p>}

      {checkoutPlan && (
        <RenewalCheckout
          t={t}
          info={info}
          initialPlan={checkoutPlan}
          bestPlan={bestPlan}
          trial={trial}
          onClose={() => setCheckoutPlan(null)}
          onDone={async () => {
            setCheckoutPlan(null);
            setToast(t("subscription.checkout.sent"));
            await load();
          }}
        />
      )}
      <SuccessToast message={toast} onClose={closeToast} title={t("subscription.checkout.sentTitle")} />
    </section>
  );
}

export default SubscriptionCard;
