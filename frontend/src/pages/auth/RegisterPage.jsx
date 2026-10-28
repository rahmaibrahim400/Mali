import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { registerUser, clearAuthError } from "../../store/slices/authSlice";
import AuthCard from "./components/AuthCard";
import AuthFormHeader from "./components/AuthFormHeader";
import AuthBanner from "./components/AuthBanner";
import PasswordField from "./components/PasswordField";
import AuthSubmitButton from "./components/AuthSubmitButton";

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { status, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    dispatch(clearAuthError());

    if (form.password !== form.confirmPassword) {
      setFormError(t("auth.register.passwordMismatch"));
      return;
    }
    if (!form.agreeTerms) {
      setFormError(t("auth.register.mustAgreeTerms"));
      return;
    }

    const result = await dispatch(
      registerUser({ name: form.name, email: form.email, password: form.password })
    );
    if (registerUser.fulfilled.match(result)) {
      navigate("/login", { state: { registered: true, email: form.email } });
    }
  };

  return (
    <AuthCard onSubmit={handleSubmit}>
      <AuthFormHeader title={t("auth.register.title")} subtitle={t("auth.register.subtitle")} />

      {(formError || error) && <AuthBanner>{formError || error}</AuthBanner>}

      <label htmlFor="name" className="mb-1.5 mt-3 block text-sm font-semibold text-slate-700">
        {t("auth.register.nameLabel")}
      </label>
      <input
        id="name"
        name="name"
        type="text"
        value={form.name}
        onChange={handleChange}
        required
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500"
      />

      <label htmlFor="email" className="mb-1.5 mt-3 block text-sm font-semibold text-slate-700">
        {t("auth.register.emailLabel")}
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
        label={t("auth.register.passwordLabel")}
        value={form.password}
        onChange={handleChange}
        t={t}
        minLength={6}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label={t("auth.register.confirmPasswordLabel")}
        value={form.confirmPassword}
        onChange={handleChange}
        t={t}
        minLength={6}
      />

      <label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-600">
        <input
          id="agreeTerms"
          name="agreeTerms"
          type="checkbox"
          checked={form.agreeTerms}
          onChange={handleChange}
          className="h-4 w-4 rounded border-slate-300 text-brand-600"
        />
        {t("auth.register.agreeTerms")}
      </label>

      <AuthSubmitButton
        loading={status === "loading"}
        loadingLabel={t("auth.register.submitting")}
        label={t("auth.register.submit")}
      />

      <p className="mt-4 text-center text-sm text-slate-500">
        {t("auth.register.haveAccount")}{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          {t("auth.register.loginLink")}
        </Link>
      </p>
    </AuthCard>
  );
}

export default RegisterPage;
