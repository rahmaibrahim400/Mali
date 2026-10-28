import { useCallback, useEffect, useState } from "react";
import { CreditCard, Landmark, Smartphone, Tags, Wallet } from "lucide-react";
import { fetchPaymentSettings, updatePaymentSettings } from "../../../api/adminExtrasApi";
import { errorClass, inputClass, labelClass, primaryButton, requestError, successClass } from "./styles";

const PAID_PLANS = ["3months", "6months", "yearly"];
const EMPTY = {
  vodafoneCashNumber: "",
  vodafoneCashName: "",
  instapayAddress: "",
  instapayName: "",
  instructions: "",
  planPrices: { "3months": "", "6months": "", yearly: "" },
};
// Prices travel as strings in the form (so a field can be cleared while typing).
const fromServer = (data) => ({
  ...EMPTY,
  ...data,
  planPrices: Object.fromEntries(PAID_PLANS.map((plan) => [plan, String(data?.planPrices?.[plan] ?? "")])),
});

// Where users send money when they renew. A method is offered only once its details are filled in.
function AdminPaymentsTab({ t }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await fetchPaymentSettings();
      setForm(fromServer(data.data));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const change = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
    setSaved(false);
  };
  const changePrice = (plan, value) => {
    setForm((current) => ({ ...current, planPrices: { ...current.planPrices, [plan]: value.replace(/[^0-9]/g, "") } }));
    setSaved(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    // An empty price isn't sent, so it keeps its current value.
    const planPrices = Object.fromEntries(
      PAID_PLANS.filter((plan) => form.planPrices[plan] !== "").map((plan) => [plan, Number(form.planPrices[plan])])
    );
    try {
      const { data } = await updatePaymentSettings({ ...form, planPrices });
      setForm(fromServer(data.data));
      setSaved(true);
    } catch (saveError) {
      setError(requestError(saveError, t("admin.settings.saveError")));
    }
    setSaving(false);
  };

  if (status === "loading") return <span className="skeleton block h-96 rounded-2xl" aria-hidden="true" />;
  if (status === "error") return <p role="alert" className={errorClass}>{t("admin.payments.loadError")}</p>;

  const section = (Icon, tone, title, active, children) => (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
            <Icon size={16} />
          </span>
          {title}
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {active ? t("admin.payments.enabled") : t("admin.payments.disabled")}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );

  return (
    <form onSubmit={submit} className="card-shadow h-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Wallet size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("admin.payments.title")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("admin.payments.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Plan prices: what users see and pay from the next request on. */}
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Tags size={16} />
            </span>
            {t("admin.payments.pricesTitle")}
          </p>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">{t("admin.payments.pricesNote")}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {PAID_PLANS.map((plan) => (
              <label key={plan} className={labelClass}>
                {t(`admin.home.plans.${plan}`)}
                <span className="relative mt-1.5 block">
                  <input
                    value={form.planPrices[plan]}
                    onChange={(event) => changePrice(plan, event.target.value)}
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={7}
                    required
                    aria-describedby="plan-prices-currency"
                    className={`${inputClass} pr-14 tabular-amount`}
                  />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400">
                    {t("admin.payments.currency")}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <span id="plan-prices-currency" className="sr-only">{t("admin.payments.currency")}</span>
        </div>

        {section(Smartphone, "bg-slate-100 text-slate-500", t("subscription.methods.vodafone_cash"), Boolean(form.vodafoneCashNumber), (
          <>
            <label className={labelClass}>
              {t("admin.payments.walletNumber")}
              <input name="vodafoneCashNumber" value={form.vodafoneCashNumber} onChange={change} dir="ltr" maxLength={30} placeholder="010xxxxxxxx" className={`mt-1.5 ${inputClass}`} />
            </label>
            <label className={labelClass}>
              {t("admin.payments.accountName")}
              <input name="vodafoneCashName" value={form.vodafoneCashName} onChange={change} maxLength={80} className={`mt-1.5 ${inputClass}`} />
            </label>
          </>
        ))}

        {section(Landmark, "bg-slate-100 text-slate-500", t("subscription.methods.instapay"), Boolean(form.instapayAddress), (
          <>
            <label className={labelClass}>
              {t("admin.payments.instapayAddress")}
              <input name="instapayAddress" value={form.instapayAddress} onChange={change} dir="ltr" maxLength={80} placeholder="name@instapay" className={`mt-1.5 ${inputClass}`} />
            </label>
            <label className={labelClass}>
              {t("admin.payments.accountName")}
              <input name="instapayName" value={form.instapayName} onChange={change} maxLength={80} className={`mt-1.5 ${inputClass}`} />
            </label>
          </>
        ))}

        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <CreditCard size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{t("subscription.methods.card")}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{t("admin.payments.cardNote")}</p>
          </div>
        </div>

        <label className={`block ${labelClass}`}>
          {t("admin.payments.instructions")}
          <textarea
            name="instructions"
            value={form.instructions}
            onChange={change}
            maxLength={500}
            rows={3}
            placeholder={t("admin.payments.instructionsPlaceholder")}
            className={`mt-1.5 min-h-0 resize-none py-2.5 ${inputClass}`}
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          {error && <p role="alert" className={errorClass}>{error}</p>}
          {saved && <p role="status" className={successClass}>{t("admin.payments.saved")}</p>}
        </div>
        <button type="submit" disabled={saving} className={`${primaryButton} sm:ms-auto`}>
          {saving ? t("profile.saving") : t("profile.save")}
        </button>
      </div>
    </form>
  );
}

export default AdminPaymentsTab;
