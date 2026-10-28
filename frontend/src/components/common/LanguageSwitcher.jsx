import { useTranslation } from "react-i18next";
import useChangeLanguage from "../../i18n/useChangeLanguage";

// Compact AR/EN toggle for the auth pages and the admin panel (users switch in Settings).
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const changeLanguage = useChangeLanguage();

  const baseBtn =
    "px-3.5 py-2.5 text-xs font-bold transition-colors sm:px-3 sm:py-1.5 emerald:rounded-lg emerald:py-2 emerald:sm:py-1.5";

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white emerald:gap-1 emerald:overflow-visible emerald:rounded-xl emerald:bg-slate-100 emerald:p-1">
      <button
        type="button"
        onClick={() => changeLanguage("ar")}
        className={`${baseBtn} ${
          i18n.language === "ar"
            ? "bg-brand-600 text-white emerald:bg-white emerald:text-slate-900 emerald:shadow-sm"
            : "text-slate-600 hover:bg-slate-100 emerald:text-slate-500 emerald:hover:bg-transparent emerald:hover:text-slate-700"
        }`}
      >
        AR
      </button>
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        className={`${baseBtn} ${
          i18n.language === "en"
            ? "bg-brand-600 text-white emerald:bg-white emerald:text-slate-900 emerald:shadow-sm"
            : "text-slate-600 hover:bg-slate-100 emerald:text-slate-500 emerald:hover:bg-transparent emerald:hover:text-slate-700"
        }`}
      >
        EN
      </button>
    </div>
  );
}

export default LanguageSwitcher;
