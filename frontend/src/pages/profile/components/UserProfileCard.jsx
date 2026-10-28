import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Camera, Languages, Mail, Palette, Trash2, UserRound } from "lucide-react";
import { deleteAvatar, uploadAvatar } from "../../../store/slices/authSlice";
import { useTheme } from "../../../utils/theme";
import { avatarDataUrl } from "../../../utils/avatarImage";

const errorClass = "rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";

// Who's signed in: the photo on its cover (change / remove) on one side, their details on the other.
// Same layout as the admin's settings card.
function UserProfileCard({ user, t }) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initial = (user?.name || user?.email || "?").trim()[0]?.toUpperCase();

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    // Shrunk to 256px before upload: the photo travels with every login and page load.
    avatarDataUrl(file)
      .then(async (avatar) => {
        const result = await dispatch(uploadAvatar(avatar));
        if (!uploadAvatar.fulfilled.match(result)) setError(result.payload || t("profile.avatarError"));
      })
      .catch(() => setError(t("profile.avatarError")))
      .finally(() => setBusy(false));
  };

  const handleRemovePhoto = async () => {
    setError("");
    setBusy(true);
    const result = await dispatch(deleteAvatar());
    if (!deleteAvatar.fulfilled.match(result)) setError(result.payload || t("profile.avatarError"));
    setBusy(false);
  };

  const details = [
    { icon: Mail, label: t("profile.email.sectionTitle"), value: user?.email, ltr: true },
    { icon: Languages, label: t("admin.settings.languageTitle"), value: i18n.language === "ar" ? "العربية" : "English" },
    { icon: Palette, label: t("layout.theme"), value: t(`theme.${theme}.name`) },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <div className="grid md:grid-cols-[18rem_1fr]">
        {/* Photo on its cover */}
        <div className="border-slate-100 md:border-e">
          <div className="relative h-24 bg-linear-to-br from-navy-800 to-navy-900">
            <span aria-hidden="true" className="absolute -top-10 h-32 w-32 rounded-full bg-brand-500/25 blur-2xl inset-e-4" />
          </div>
          <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white" />
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
              {user?.avatar && (
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
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{t("admin.settings.welcomeBack")}</p>
            <h2 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-slate-900">{user?.name}</h2>
            {user?.subscriptionType && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                <UserRound size={13} />
                {t(`admin.home.plans.${user.subscriptionType}`, { defaultValue: user.subscriptionType })}
              </span>
            )}
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

export default UserProfileCard;
