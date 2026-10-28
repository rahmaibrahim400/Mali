import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BadgeCheck, ChevronDown, ChevronUp, Mail } from "lucide-react";
import {
  requestEmailChange,
  confirmEmailChange,
  resetEmailChangeState,
} from "../../../store/slices/authSlice";
import { localizeDigits, normalizeDigits } from "../../../utils/formatAmount";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const labelClass = "text-sm font-semibold text-slate-700";
const errorClass = "rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";
const successClass = "rounded-xl bg-income-soft px-4 py-2.5 text-sm font-medium text-income";

function EmailChangeSection({ t, currentEmail, securityRequest, onClearRequest }) {
  const dispatch = useDispatch();
  const { emailRequestStatus, emailRequestError, emailConfirmStatus, emailConfirmError } = useSelector(
    (state) => state.auth
  );
  const [manualOpen, setManualOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const requestedOpen = securityRequest.section === "email";
  const open = requestedOpen || manualOpen;

  const codeSent = emailRequestStatus === "succeeded" && !confirmed;

  const close = () => {
    setManualOpen(false);
    setNewEmail("");
    setCode("");
    setConfirmed(false);
    dispatch(resetEmailChangeState());
    onClearRequest();
  };

  const handleToggle = () => {
    if (open) {
      close();
      return;
    }
    dispatch(resetEmailChangeState());
    setManualOpen(true);
  };

  const handleRequestCode = async (event) => {
    event.preventDefault();
    await dispatch(requestEmailChange(newEmail.trim()));
  };

  const handleConfirmCode = async (event) => {
    event.preventDefault();
    const result = await dispatch(confirmEmailChange(code.trim()));
    if (confirmEmailChange.fulfilled.match(result)) setConfirmed(true);
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Mail size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{t("profile.email.sectionTitle")}</h3>
          <p className="mt-1 truncate text-sm font-medium text-slate-700" dir="ltr">{currentEmail || "—"}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{t("profile.email.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          aria-controls="email-change-panel"
          className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 sm:self-center"
        >
          {open ? t("profile.email.cancel") : t("profile.email.changeEmail")}
          {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div
          id="email-change-panel"
          className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
        >
          {confirmed ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" className={`${successClass} inline-flex items-center gap-2`}>
                <BadgeCheck size={17} aria-hidden="true" />
                {t("profile.email.changeSuccess")}
              </p>
              <button
                type="button"
                onClick={close}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
              >
                {t("profile.email.done")}
              </button>
            </div>
          ) : codeSent ? (
            <form onSubmit={handleConfirmCode}>
              <p className="text-sm leading-6 text-slate-600">{t("profile.email.codeSentMessage")}</p>
              <div className="mt-4 flex flex-col gap-1.5 sm:max-w-sm">
                <label htmlFor="email-code" className={labelClass}>
                  {t("profile.email.codeLabel")}
                </label>
                <input
                  id="email-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={localizeDigits(code)}
                  onChange={(event) => setCode(normalizeDigits(event.target.value).replace(/\D/g, "").slice(0, 6))}
                  required
                  className={inputClass}
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div aria-live="polite">
                  {emailConfirmError && <p role="alert" className={errorClass}>{emailConfirmError}</p>}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:ms-auto">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
                  >
                    {t("profile.email.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={emailConfirmStatus === "loading"}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-wait disabled:opacity-65"
                  >
                    {emailConfirmStatus === "loading" ? t("profile.email.confirming") : t("profile.email.confirm")}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRequestCode}>
              <div className="flex flex-col gap-1.5 sm:max-w-lg">
                <label htmlFor="new-email" className={labelClass}>
                  {t("profile.email.newEmailLabel")}
                </label>
                <input
                  id="new-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div aria-live="polite">
                  {emailRequestError && <p role="alert" className={errorClass}>{emailRequestError}</p>}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:ms-auto">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
                  >
                    {t("profile.email.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={emailRequestStatus === "loading"}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-wait disabled:opacity-65"
                  >
                    {emailRequestStatus === "loading" ? t("profile.email.sending") : t("profile.email.sendCode")}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default EmailChangeSection;
