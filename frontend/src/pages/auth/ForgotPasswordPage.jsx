import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { forgotPassword, clearAuthError } from "../../store/slices/authSlice";
import AuthCard from "./components/AuthCard";
import AuthFormHeader from "./components/AuthFormHeader";
import AuthBanner from "./components/AuthBanner";
import AuthSubmitButton from "./components/AuthSubmitButton";

function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      setSent(true);
    }
  };

  return (
    <AuthCard onSubmit={handleSubmit}>
      <AuthFormHeader title={t("auth.forgotPassword.title")} />

      {sent ? (
        <AuthBanner variant="success">{t("auth.forgotPassword.sentMessage")}</AuthBanner>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">{t("auth.forgotPassword.instructions")}</p>

          {error && <AuthBanner>{error}</AuthBanner>}

          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
            {t("auth.forgotPassword.emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500"
          />

          <AuthSubmitButton
            loading={status === "loading"}
            loadingLabel={t("auth.forgotPassword.submitting")}
            label={t("auth.forgotPassword.submit")}
          />
        </>
      )}

      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </p>
    </AuthCard>
  );
}

export default ForgotPasswordPage;
