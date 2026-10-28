import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Pencil } from "lucide-react";
import { updateProfile, clearProfileError } from "../../../store/slices/authSlice";
import { localizeDigits } from "../../../utils/formatAmount";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const labelClass = "text-sm font-semibold text-slate-700";
const errorClass = "rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";
const successClass = "rounded-xl bg-income-soft px-4 py-2.5 text-sm font-medium text-income";

function ProfileForm({ user, t, onEditSecurity }) {
  const dispatch = useDispatch();
  const { profileStatus, profileError } = useSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const nameInputRef = useRef(null);

  const handleChange = (event) => {
    setName(event.target.value);
    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearProfileError());
    setSaved(false);

    const result = await dispatch(updateProfile({ name: name.trim(), phone: user?.phone || "" }));
    if (updateProfile.fulfilled.match(result)) {
      setSaved(true);
      setEditingField(null);
    }
  };

  const startEditing = () => {
    setEditingField("name");
    setSaved(false);
    nameInputRef.current?.focus();
  };

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">{t("profile.editTitle")}</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-rows-[auto_auto_1fr]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="name" className={labelClass}>
              {t("profile.nameLabel")}
            </label>
            {editingField !== "name" && (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
              >
                <Pencil size={14} aria-hidden="true" />
                {t("profile.editName")}
              </button>
            )}
          </div>
          <input
            ref={nameInputRef}
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={handleChange}
            readOnly={editingField !== "name"}
            required
            className={`${inputClass} read-only:bg-slate-50 read-only:text-slate-600`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="profile-email" className={labelClass}>
              {t("profile.email.sectionTitle")}
            </label>
            <button
              type="button"
              onClick={() => onEditSecurity("email")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
            >
              <Pencil size={14} aria-hidden="true" />
              {t("profile.editEmail")}
            </button>
          </div>
          <input
            id="profile-email"
            type="email"
            dir="ltr"
            value={user?.email || ""}
            readOnly
            className={`${inputClass} read-only:bg-slate-50 read-only:text-slate-600`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="profile-phone" className={labelClass}>
              {t("profile.phoneLabel")}
            </label>
            <button
              type="button"
              onClick={() => onEditSecurity("phone")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
            >
              <Pencil size={14} aria-hidden="true" />
              {t("profile.editPhone")}
            </button>
          </div>
          <input
            id="profile-phone"
            type="tel"
            dir="ltr"
            value={localizeDigits(user?.phone || "")}
            readOnly
            placeholder={t("profile.phonePlaceholder")}
            className={`${inputClass} read-only:bg-slate-50 read-only:text-slate-600`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="profile-password" className={labelClass}>
              {t("profile.password.sectionTitle")}
            </label>
            <button
              type="button"
              onClick={() => onEditSecurity("password")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
            >
              <Pencil size={14} aria-hidden="true" />
              {t("profile.editPassword")}
            </button>
          </div>
          <input
            id="profile-password"
            type="text"
            dir="ltr"
            value="********"
            readOnly
            aria-label={t("profile.password.hidden")}
            className={`${inputClass} read-only:bg-slate-50 read-only:text-slate-600`}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:self-end">
          <div className="space-y-2" aria-live="polite">
            {profileError && <p role="alert" className={errorClass}>{profileError}</p>}
            {saved && <p role="status" className={successClass}>{t("profile.saveSuccess")}</p>}
          </div>
          <button
            type="submit"
            disabled={profileStatus === "loading"}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-wait disabled:opacity-65 sm:ms-auto"
          >
            {profileStatus === "loading" ? t("profile.saving") : t("profile.save")}
          </button>
        </div>
      </form>

    </section>
  );
}

export default ProfileForm;
