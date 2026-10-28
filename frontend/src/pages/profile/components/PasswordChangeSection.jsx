import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BadgeCheck, ChevronDown, ChevronUp, KeyRound } from "lucide-react";
import { changePassword, resetPasswordChangeState } from "../../../store/slices/authSlice";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const labelClass = "text-sm font-semibold text-slate-700";
const errorClass = "rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";
const successClass = "rounded-xl bg-income-soft px-4 py-2.5 text-sm font-medium text-income";

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordChangeSection({ t, securityRequest, onClearRequest }) {
  const dispatch = useDispatch();
  const { passwordStatus, passwordError } = useSelector((state) => state.auth);
  const [form, setForm] = useState(EMPTY_FORM);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const requestedOpen = securityRequest.section === "password";
  const open = requestedOpen || manualOpen;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
    setLocalError("");
  };

  const handleToggle = () => {
    if (open) {
      setManualOpen(false);
      setForm(EMPTY_FORM);
      setLocalError("");
      setSuccess(false);
      dispatch(resetPasswordChangeState());
      onClearRequest();
      return;
    }

    dispatch(resetPasswordChangeState());
    setManualOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(resetPasswordChangeState());
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setLocalError(t("profile.password.mismatch"));
      return;
    }

    const result = await dispatch(changePassword(form));
    if (changePassword.fulfilled.match(result)) {
      setSuccess(true);
      setForm(EMPTY_FORM);
    }
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <KeyRound size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{t("profile.password.sectionTitle")}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{t("profile.password.description")}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          aria-controls="password-change-panel"
          className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 sm:self-center"
        >
          {open ? t("profile.password.cancel") : t("profile.password.title")}
          {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <form
          id="password-change-panel"
          onSubmit={handleSubmit}
          className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="currentPassword" className={labelClass}>
                {t("profile.password.currentLabel")}
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPassword" className={labelClass}>
                {t("profile.password.newLabel")}
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={form.newPassword}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className={labelClass}>
                {t("profile.password.confirmLabel")}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">{t("profile.password.hint")}</p>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              {(localError || passwordError) && <p role="alert" className={errorClass}>{localError || passwordError}</p>}
              {success && (
                <p role="status" className={`${successClass} inline-flex items-center gap-2`}>
                  <BadgeCheck size={17} aria-hidden="true" />
                  {t("profile.password.success")}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={passwordStatus === "loading"}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-wait disabled:opacity-65 sm:ms-auto"
            >
              {passwordStatus === "loading" ? t("profile.password.submitting") : t("profile.password.submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default PasswordChangeSection;
