import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { clearAuthError, loginAccount } from "../../store/slices/authSlice";
import { clearAdminError } from "../../store/slices/adminAuthSlice";
import AuthCard from "./components/AuthCard";
import AuthFormHeader from "./components/AuthFormHeader";
import AuthBanner from "./components/AuthBanner";
import PasswordField from "./components/PasswordField";
import AuthSubmitButton from "./components/AuthSubmitButton";
import { createPortal } from "react-dom";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { status, error, token } = useSelector((state) => state.auth);
  const { token: adminToken, sessionExpired } = useSelector((state) => state.adminAuth);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
    rememberMe: false,
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(clearAdminError());
    const result = await dispatch(loginAccount(form));
    if (loginAccount.fulfilled.match(result)) {
      navigate(result.payload.accountType === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  };

  // Signed in: go straight to the account. For the instant before it appears, cover the whole
  // login screen with the app's plain background so no (empty) form card flashes.
  if (adminToken || token) {
    return (
      <>
        <Navigate to={adminToken ? "/admin" : "/dashboard"} replace />
        {createPortal(<div aria-hidden="true" className="fixed inset-0 z-50 bg-slate-50" />, document.body)}
      </>
    );
  }

  return (
    <AuthCard onSubmit={handleSubmit}>
      <AuthFormHeader title={t("auth.login.title")} subtitle={t("auth.login.subtitle")} />

      {location.state?.registered && (
        <AuthBanner variant="success">{t("auth.login.registeredSuccess")}</AuthBanner>
      )}
      {location.state?.passwordReset && (
        <AuthBanner variant="success">{t("auth.login.passwordResetSuccess")}</AuthBanner>
      )}
      {sessionExpired && <AuthBanner>{t("admin.login.sessionExpired")}</AuthBanner>}
      {error && <AuthBanner>{error}</AuthBanner>}

      <label htmlFor="email" className="mb-1.5 mt-3 block text-sm font-semibold text-slate-700">
        {t("auth.login.emailLabel")}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        dir="ltr"
        autoComplete="email"
        value={form.email}
        onChange={handleChange}
        required
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500"
      />

      <PasswordField
        id="password"
        name="password"
        label={t("auth.login.passwordLabel")}
        value={form.password}
        onChange={handleChange}
        t={t}
      />

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={form.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
          />
          {t("auth.login.rememberMe")}
        </label>

        <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">
          {t("auth.login.forgotPassword")}
        </Link>
      </div>

      <AuthSubmitButton
        loading={status === "loading"}
        loadingLabel={t("auth.login.submitting")}
        label={t("auth.login.submit")}
      />

      <p className="mt-4 text-center text-sm text-slate-500">
        {t("auth.login.noAccount")}{" "}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          {t("auth.login.registerLink")}
        </Link>
      </p>
    </AuthCard>
  );
}

export default LoginPage;
