import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BadgeCheck, Pencil, Phone } from "lucide-react";
import { clearProfileError, updateProfile } from "../../../store/slices/authSlice";
import { localizeDigits, normalizeDigits } from "../../../utils/formatAmount";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const labelClass = "text-sm font-semibold text-slate-700";
const errorClass = "rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";
const successClass = "rounded-xl bg-income-soft px-4 py-2.5 text-sm font-medium text-income";

function PhoneChangeSection({ user, t, securityRequest, onClearRequest }) {
  const dispatch = useDispatch();
  const { profileStatus, profileError } = useSelector((state) => state.auth);
  const [phone, setPhone] = useState(user?.phone || "");
  const [manualEditing, setManualEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const requestedEdit = securityRequest.section === "phone";
  const editing = requestedEdit || manualEditing;

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearProfileError());
    setSaved(false);

    const result = await dispatch(updateProfile({ name: user?.name || "", phone: phone.trim() }));
    if (updateProfile.fulfilled.match(result)) {
      setSaved(true);
      setManualEditing(false);
      onClearRequest();
    }
  };

  const handleCancel = () => {
    setPhone(user?.phone || "");
    setManualEditing(false);
    setSaved(false);
    dispatch(clearProfileError());
    onClearRequest();
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Phone size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{t("profile.phone.sectionTitle")}</h3>
          {!editing && (
            <p className="mt-1 text-sm font-medium text-slate-700" dir="ltr">
              {phone ? localizeDigits(phone) : t("profile.phone.notSet")}
            </p>
          )}
          <p className="mt-1 text-sm leading-6 text-slate-500">{t("profile.phone.description")}</p>
          {saved && (
            <p role="status" className={`${successClass} mt-2 inline-flex items-center gap-2`}>
              <BadgeCheck size={17} aria-hidden="true" />
              {t("profile.phone.success")}
            </p>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              dispatch(clearProfileError());
              setSaved(false);
              setManualEditing(true);
            }}
            className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 sm:self-center"
          >
            <Pencil size={15} aria-hidden="true" />
            {t("profile.editPhone")}
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-1.5 sm:max-w-lg">
            <label htmlFor="security-phone" className={labelClass}>
              {t("profile.phoneLabel")}
            </label>
            <input
              id="security-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={localizeDigits(phone)}
              onChange={(event) => {
                setPhone(normalizeDigits(event.target.value));
                setSaved(false);
              }}
              placeholder={t("profile.phonePlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2" aria-live="polite">
              {profileError && <p role="alert" className={errorClass}>{profileError}</p>}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:ms-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
              >
                {t("profile.phone.cancel")}
              </button>
              <button
                type="submit"
                disabled={profileStatus === "loading"}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-wait disabled:opacity-65"
              >
                {profileStatus === "loading" ? t("profile.saving") : t("profile.save")}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default PhoneChangeSection;
