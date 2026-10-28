import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import switchLanguage from "../../utils/switchLanguage";

const LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
];

// Language picker: a button showing the current language that opens a small menu.
// placement "side" opens it beside the button on large screens (vertical menus), "below" always
// drops it down (horizontal bars). onChange lets the user app also save the choice to the account.
function LanguageMenu({ t, i18n, placement = "side", onChange = switchLanguage }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = LANGUAGES.find(({ code }) => code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (code) => {
    setOpen(false);
    onChange(code);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("admin.settings.languageTitle")}
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 ${
          open ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200" : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-slate-900"
        }`}
      >
        <Languages size={16} aria-hidden="true" />
        <span>{current.label}</span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("admin.settings.languageTitle")}
          className={`toast-enter absolute top-full z-30 mt-2 w-48 overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-slate-200 inset-e-0 ${placement === "side" ? "lg:top-1/2 lg:mt-0 lg:ms-3 lg:-translate-y-1/2 lg:inset-e-auto lg:inset-s-full" : ""}`}
        >
          <p className="px-3 pb-1.5 pt-2 text-xs font-semibold text-slate-400">{t("admin.settings.languageTitle")}</p>
          {LANGUAGES.map(({ code, label }) => {
            const selected = code === current.code;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(code)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
                  selected ? "bg-brand-50" : "hover:bg-slate-100"
                }`}
              >
                <span className={`flex-1 text-sm font-bold ${selected ? "text-brand-700" : "text-slate-800"}`}>{label}</span>
                {selected && <Check size={17} className="text-brand-600" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageMenu;
