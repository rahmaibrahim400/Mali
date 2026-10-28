import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resetPassword, clearAuthError } from "../../store/slices/authSlice";
import AuthCard from "./components/AuthCard";
import AuthFormHeader from "./components/AuthFormHeader";
import AuthBanner from "./components/AuthBanner";
import PasswordField from "./components/PasswordField";
import AuthSubmitButton from "./components/AuthSubmitButton";

function ResetPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslation();
  const { status, error } = useSelector((state) => state.auth);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    dispatch(clearAuthError());

    if (password !== confirmPassword) {
      setFormError(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    const result = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(result)) {
      navigate("/login", { state: { passwordReset: true } });
    }
  };

  if (!token) {
    return (
      <AuthCard as="div" className="text-center">
        <AuthFormHeader title={t("auth.resetPassword.invalidTitle")} />
        <AuthBanner>{t("auth.resetPassword.invalidMessage")}</AuthBanner>
        <p className="text-sm">
          <Link to="/forgot-password" className="font-semibold text-brand-600 hover:underline">
            {t("auth.resetPassword.requestNewLink")}
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard onSubmit={handleSubmit}>
      <AuthFormHeader title={t("auth.resetPassword.title")} />

      {(formError || error) && <AuthBanner>{formError || error}</AuthBanner>}

      <PasswordField
        id="password"
        name="password"
        label={t("auth.resetPassword.newPasswordLabel")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        t={t}
        minLength={6}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label={t("auth.resetPassword.confirmPasswordLabel")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        t={t}
        minLength={6}
      />

      <AuthSubmitButton
        loading={status === "loading"}
        loadingLabel={t("auth.resetPassword.submitting")}
        label={t("auth.resetPassword.submit")}
      />
    </AuthCard>
  );
}

export default ResetPasswordPage;
