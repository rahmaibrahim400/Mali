import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const passwordInputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 pe-11 text-sm outline-none transition focus:border-brand-500";

function PasswordField({ id, name, label, value, onChange, t, minLength }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <label htmlFor={id} className="mb-1.5 mt-3 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {/* Left-to-right like the email field above it, so both read from the same side in Arabic. */}
      <div className="relative" dir="ltr">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          minLength={minLength}
          className={passwordInputClass}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 inset-e-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
          aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </>
  );
}

export default PasswordField;
