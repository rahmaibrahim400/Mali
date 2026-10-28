import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../../../utils/formatAmount";
import NumberInput from "../../../components/common/NumberInput";
import { extractError } from "../../../utils/errorHandler";

const DEFAULT_TRIGGER_CLASS =
  "inline-flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-brand-50 px-3 text-sm font-bold text-brand-700 transition hover:bg-brand-100";

// triggerClassName: restyle the opening button (the Mali account card uses a lighter one).
export default function AdjustBalanceButton({ account, onSubmit, onUpdated, triggerClassName = DEFAULT_TRIGGER_CLASS }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "confirm"
  const [newBalance, setNewBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const currency = account?.currency || "EGP";

  function resetAndClose() {
    setOpen(false);
    setStep("form");
    setNewBalance("");
    setNotes("");
    setError("");
    setSaving(false);
  }

  function handleContinue(e) {
    e.preventDefault();
    setError("");

    if (newBalance.trim() === "" || isNaN(Number(newBalance))) {
      setError(t("accounts.adjustBalance.invalidBalance"));
      return;
    }
    if (Number(newBalance) === account.balance) {
      setError(t("accounts.adjustBalance.sameBalance"));
      return;
    }
    setStep("confirm");
  }

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const updatedAccount = await onSubmit({
        accountId: account._id,
        newBalance: Number(newBalance),
        notes: notes.trim() || undefined,
      });
      onUpdated?.(updatedAccount);
      resetAndClose();
    } catch (err) {
      setError(extractError(err, t("accounts.adjustBalance.genericError")));
      setSaving(false);
    }
  }

  const diff = Number(newBalance) - (account?.balance ?? 0);
  const diffLabel = !isNaN(diff) && diff !== 0 ? formatMoney(diff, currency, { signDisplay: "exceptZero" }) : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
          <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.878.507l-3 .8a.5.5 0 0 1-.612-.612l.8-3a2 2 0 0 1 .507-.878l8.5-8.5Z" />
        </svg>
        {t("accounts.adjustBalance.trigger")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={resetAndClose}
        >
          <div
            className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {step === "form" && (
              <form onSubmit={handleContinue}>
                <h2 className="text-base font-semibold text-slate-900">
                  {t("accounts.adjustBalance.title", { name: account?.name })}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("accounts.adjustBalance.currentBalance")}:{" "}
                  <span className="font-medium text-slate-700">{formatMoney(account?.balance, currency)}</span>
                </p>

                <label htmlFor={`new-balance-${account._id}`} className="mt-4 block text-sm font-medium text-slate-700">
                  {t("accounts.adjustBalance.newBalanceLabel")}
                </label>
                <NumberInput
                  id={`new-balance-${account._id}`}
                  step="0.01"
                  required
                  autoFocus
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                />

                <label htmlFor={`adjust-notes-${account._id}`} className="mt-3 block text-sm font-medium text-slate-700">
                  {t("accounts.adjustBalance.notesLabel")}
                </label>
                <textarea
                  id={`adjust-notes-${account._id}`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("accounts.adjustBalance.notesPlaceholder")}
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                />

                {error && <p className="mt-2 text-sm text-expense">{error}</p>}

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="min-h-11 w-full rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:w-auto"
                  >
                    {t("accounts.adjustBalance.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="min-h-11 w-full rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 sm:w-auto"
                  >
                    {t("accounts.adjustBalance.continue")}
                  </button>
                </div>
              </form>
            )}

            {step === "confirm" && (
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {t("accounts.adjustBalance.confirmTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("accounts.adjustBalance.confirmQuestion", { name: account?.name })}
                </p>

                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{t("accounts.adjustBalance.currentBalance")}</span>
                    <span className="font-medium text-slate-700">{formatMoney(account?.balance, currency)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">{t("accounts.adjustBalance.newBalanceLabel")}</span>
                    <span className="font-semibold text-brand-700">{formatMoney(newBalance, currency)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
                    <span className="text-slate-500">{t("accounts.adjustBalance.difference")}</span>
                    <span className={diff >= 0 ? "font-medium text-income" : "font-medium text-expense"}>
                      {diffLabel}
                    </span>
                  </div>
                  {notes.trim() && (
                    <div className="mt-2 border-t border-slate-200 pt-2 text-sm text-slate-600">
                      <span className="text-slate-500">{t("accounts.adjustBalance.notePrefix")} </span>
                      {notes.trim()}
                    </div>
                  )}
                </div>

                {error && <p className="mt-2 text-sm text-expense">{error}</p>}

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    disabled={saving}
                    className="min-h-11 w-full rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 sm:w-auto"
                  >
                    {t("accounts.adjustBalance.back")}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={saving}
                    className="min-h-11 w-full rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
                  >
                    {saving ? t("accounts.adjustBalance.saving") : t("accounts.adjustBalance.confirmSave")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
