import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Camera, Languages, Mail, Palette, ShieldCheck, Trash2 } from "lucide-react";
import { useTheme } from "../../../utils/theme";
import { deleteAdminPhoto, uploadAdminPhoto } from "../../../api/adminSettingsApi";
import { setAdminProfile } from "../../../store/slices/adminAuthSlice";
import { errorClass, requestError } from "./styles";
import { avatarDataUrl } from "../../../utils/avatarImage";

// Who's signed in: the photo on its cover (change / remove) on one side, their details on the other.
function AdminProfileCard({ admin, t }) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initial = (admin?.name || admin?.email || "?").trim()[0]?.toUpperCase();

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    // Shrunk to 256px before upload: the photo travels with every login and page load.
    avatarDataUrl(file)
      .then(async (avatar) => {
        const { data } = await uploadAdminPhoto(avatar);
        dispatch(setAdminProfile(data.data));
      })
      .catch((uploadError) => setError(requestError(uploadError, t("profile.avatarError"))))
      .finally(() => setBusy(false));
  };

  const handleRemovePhoto = async () => {
    setError("");
    setBusy(true);
    try {
      const { data } = await deleteAdminPhoto();
      dispatch(setAdminProfile(data.data));
    } catch (removeError) {
      setError(requestError(removeError, t("profile.avatarError")));
    }
    setBusy(false);
  };

  const details = [
    { icon: Mail, label: t("profile.email.sectionTitle"), value: admin?.email, ltr: true },
    { icon: Languages, label: t("admin.settings.languageTitle"), value: i18n.language === "ar" ? "العربية" : "English" },
    { icon: Palette, label: t("layout.theme"), value: t(`theme.${theme}.name`) },
  ];

  return (
    <section className="card-shadow overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid md:grid-cols-[18rem_1fr]">
        {/* Photo on its cover (same size as before) */}
        <div className="border-slate-100 md:border-e">
          <div className="relative h-24 bg-linear-to-br from-hero-start to-hero-end">
          </div>
          <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
            <div className="relative">
              {admin?.avatar ? (
                <img src={admin.avatar} alt={admin.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white" />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-3xl font-bold text-white ring-4 ring-white">
                  {initial}
                </span>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                aria-label={t("profile.changePhoto")}
                title={t("profile.changePhoto")}
                className="absolute bottom-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-slate-200 transition hover:text-brand-700 disabled:opacity-60 inset-e-0"
              >
                <Camera size={16} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
              >
                <Camera size={13} />
                {t("profile.changePhoto")}
              </button>
              {admin?.avatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-expense-soft hover:text-expense disabled:opacity-60"
                >
                  <Trash2 size={13} />
                  {t("profile.removePhoto")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details beside it */}
        <div className="flex flex-col justify-center gap-5 border-t border-slate-100 p-5 sm:p-6 md:border-t-0">
          <div>
            <p className="text-xs font-medium text-slate-500">{t("admin.settings.welcomeBack")}</p>
            <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900">{admin?.name}</h2>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <ShieldCheck size={13} />
              {t("admin.settings.role")}
            </span>
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            {details.map(({ icon: Icon, label, value, ltr }) => (
              <div key={label} className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100">
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold text-slate-400">{label}</dt>
                  <dd dir={ltr ? "ltr" : undefined} className={`truncate text-sm font-bold text-slate-800 ${ltr ? "rtl:text-right" : ""}`}>
                    {value || "—"}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          {error && <p className={errorClass}>{error}</p>}
        </div>
      </div>
    </section>
  );
}

export default AdminProfileCard;
