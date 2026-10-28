import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Pencil, UserRound } from "lucide-react";
import { updateAdminProfile } from "../../../api/adminSettingsApi";
import { setAdminProfile } from "../../../store/slices/adminAuthSlice";
import { errorClass, inputClass, labelClass, primaryButton, requestError, successClass } from "./styles";

const editLink =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15";

// Name (editable), email and password (those two open the security tab).
function AdminInfoTab({ admin, t, onEditSecurity }) {
  const dispatch = useDispatch();
  const nameInputRef = useRef(null);
  const [name, setName] = useState(admin?.name || "");
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const { data } = await updateAdminProfile(name.trim());
      dispatch(setAdminProfile(data.data));
      setSaved(true);
      setEditingName(false);
    } catch (saveError) {
      setError(requestError(saveError, t("admin.settings.saveError")));
    }
    setSaving(false);
  };

  return (
      <section className="card-shadow flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <UserRound size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("profile.editTitle")}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t("admin.settings.infoSubtitle")}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-rows-[auto_auto_1fr]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="admin-name" className={labelClass}>{t("profile.nameLabel")}</label>
              {!editingName && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(true);
                    setSaved(false);
                    nameInputRef.current?.focus();
                  }}
                  className={editLink}
                >
                  <Pencil size={14} aria-hidden="true" />
                  {t("profile.editName")}
                </button>
              )}
            </div>
            <input
              ref={nameInputRef}
              id="admin-name"
              type="text"
              autoComplete="name"
              maxLength={100}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
              readOnly={!editingName}
              required
              className={`${inputClass} read-only:bg-slate-50 read-only:text-slate-600`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="admin-email" className={labelClass}>{t("profile.email.sectionTitle")}</label>
              <button type="button" onClick={() => onEditSecurity("email")} className={editLink}>
                <Pencil size={14} aria-hidden="true" />
                {t("profile.editEmail")}
              </button>
            </div>
            <input
              id="admin-email"
              type="email"
              dir="ltr"
              value={admin?.email || ""}
              readOnly
              className={`${inputClass} read-only:bg-slate-50 read-only:text-slate-600`}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="admin-password" className={labelClass}>{t("profile.password.sectionTitle")}</label>
              <button type="button" onClick={() => onEditSecurity("password")} className={editLink}>
                <Pencil size={14} aria-hidden="true" />
                {t("profile.editPassword")}
              </button>
            </div>
            <input
              id="admin-password"
              type="text"
              dir="ltr"
              value="********"
              readOnly
              aria-label={t("profile.password.hidden")}
              className={`${inputClass} read-only:bg-slate-50 read-only:text-slate-600`}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:self-end">
            <div aria-live="polite">
              {error && <p role="alert" className={errorClass}>{error}</p>}
              {saved && <p role="status" className={successClass}>{t("profile.saveSuccess")}</p>}
            </div>
            <button type="submit" disabled={saving || !editingName} className={`${primaryButton} sm:ms-auto`}>
              {saving ? t("profile.saving") : t("profile.save")}
            </button>
          </div>
        </form>
      </section>
  );
}

export default AdminInfoTab;
