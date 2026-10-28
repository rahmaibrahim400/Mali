import { useState } from "react";
import { useDispatch } from "react-redux";
import { BadgeCheck, ChevronDown, ChevronUp, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { changeAdminEmail, changeAdminPassword } from "../../../api/adminSettingsApi";
import { setAdminProfile } from "../../../store/slices/adminAuthSlice";
import { errorClass, inputClass, labelClass, linkButton, primaryButton, requestError, successClass } from "./styles";

// One expandable row (icon, title, description, toggle) like the user's security tab.
function SecurityRow({ icon: Icon, title, detail, description, open, onToggle, openLabel, closeLabel, children }) {
  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {detail && <p className="mt-1 truncate text-sm font-medium text-slate-700" dir="ltr">{detail}</p>}
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <button type="button" onClick={onToggle} aria-expanded={open} className={linkButton}>
          {open ? closeLabel : openLabel}
          {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
      </div>
      {open && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">{children}</div>}
    </div>
  );
}

function EmailRow({ admin, t, open, onToggle }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const toggle = () => {
    setEmail("");
    setCurrentPassword("");
    setError("");
    setStatus("idle");
    onToggle();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("loading");
    try {
      const { data } = await changeAdminEmail(email.trim(), currentPassword);
      dispatch(setAdminProfile(data.data));
      setStatus("succeeded");
      setEmail("");
      setCurrentPassword("");
    } catch (saveError) {
      setError(requestError(saveError, t("admin.settings.saveError")));
      setStatus("idle");
    }
  };

  return (
    <SecurityRow
      icon={Mail}
      title={t("profile.email.sectionTitle")}
      detail={admin?.email || "—"}
      description={t("admin.settings.emailDescription")}
      open={open}
      onToggle={toggle}
      openLabel={t("profile.email.changeEmail")}
      closeLabel={t("profile.email.cancel")}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-new-email" className={labelClass}>{t("profile.email.newEmailLabel")}</label>
            <input
              id="admin-new-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email-password" className={labelClass}>{t("profile.password.currentLabel")}</label>
            <input
              id="admin-email-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            {error && <p role="alert" className={errorClass}>{error}</p>}
            {status === "succeeded" && (
              <p role="status" className={`${successClass} inline-flex items-center gap-2`}>
                <BadgeCheck size={17} aria-hidden="true" />
                {t("profile.email.changeSuccess")}
              </p>
            )}
          </div>
          <button type="submit" disabled={status === "loading"} className={`${primaryButton} sm:ms-auto`}>
            {status === "loading" ? t("profile.saving") : t("admin.settings.saveEmail")}
          </button>
        </div>
      </form>
    </SecurityRow>
  );
}

const EMPTY_PASSWORDS = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordRow({ t, open, onToggle }) {
  const [form, setForm] = useState(EMPTY_PASSWORDS);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const toggle = () => {
    setForm(EMPTY_PASSWORDS);
    setError("");
    setStatus("idle");
    onToggle();
  };

  const handleChange = ({ target }) => {
    setForm((previous) => ({ ...previous, [target.name]: target.value }));
    setError("");
    if (status === "succeeded") setStatus("idle");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError(t("profile.password.mismatch"));
      return;
    }
    setError("");
    setStatus("loading");
    try {
      await changeAdminPassword(form);
      setStatus("succeeded");
      setForm(EMPTY_PASSWORDS);
    } catch (saveError) {
      setError(requestError(saveError, t("admin.settings.saveError")));
      setStatus("idle");
    }
  };

  const field = (name, label, autoComplete, wide = false) => (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={`admin-${name}`} className={labelClass}>{label}</label>
      <input
        id={`admin-${name}`}
        name={name}
        type="password"
        autoComplete={autoComplete}
        minLength={name === "currentPassword" ? undefined : 8}
        value={form[name]}
        onChange={handleChange}
        required
        className={inputClass}
      />
    </div>
  );

  return (
    <SecurityRow
      icon={KeyRound}
      title={t("profile.password.sectionTitle")}
      description={t("profile.password.description")}
      open={open}
      onToggle={toggle}
      openLabel={t("profile.password.title")}
      closeLabel={t("profile.password.cancel")}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("currentPassword", t("profile.password.currentLabel"), "current-password", true)}
          {field("newPassword", t("profile.password.newLabel"), "new-password")}
          {field("confirmPassword", t("profile.password.confirmLabel"), "new-password")}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">{t("profile.password.hint")}</p>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            {error && <p role="alert" className={errorClass}>{error}</p>}
            {status === "succeeded" && (
              <p role="status" className={`${successClass} inline-flex items-center gap-2`}>
                <BadgeCheck size={17} aria-hidden="true" />
                {t("profile.password.success")}
              </p>
            )}
          </div>
          <button type="submit" disabled={status === "loading"} className={`${primaryButton} sm:ms-auto`}>
            {status === "loading" ? t("profile.password.submitting") : t("profile.password.submit")}
          </button>
        </div>
      </form>
    </SecurityRow>
  );
}

function AdminSecurityTab({ admin, t, openSection, setOpenSection }) {
  const toggle = (section) => setOpenSection((current) => (current === section ? null : section));

  return (
    <section className="card-shadow h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-start gap-3 px-5 py-5 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("profile.security.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("profile.security.subtitle")}</p>
        </div>
      </header>
      <div className="divide-y divide-slate-100 border-t border-slate-100">
        <EmailRow admin={admin} t={t} open={openSection === "email"} onToggle={() => toggle("email")} />
        <PasswordRow t={t} open={openSection === "password"} onToggle={() => toggle("password")} />
      </div>
    </section>
  );
}

export default AdminSecurityTab;
