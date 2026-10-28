import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Palette } from "lucide-react";
import { THEME_OPTIONS, setTheme, useTheme } from "../../utils/theme";
import useDismiss from "../layout/appLayout/useDismiss";
import ThemePreview from "./ThemePreview";

// Navbar icon that opens a small menu of the themes (also offered in Profile → Appearance).
function ThemeMenu() {
  const { t } = useTranslation();
  const current = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("layout.theme")}
        title={t("layout.theme")}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 sm:h-10 sm:w-10"
      >
        <Palette size={18} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("layout.theme")}
          className="absolute top-full z-40 mt-2 w-72 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl inset-e-0"
        >
          <p className="px-3 pb-1.5 pt-2 text-xs font-bold text-slate-500">{t("layout.theme")}</p>
          {THEME_OPTIONS.map(({ id, preview }) => {
            const selected = current === id;
            return (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(id);
                  close();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-slate-100 ${
                  selected ? "bg-slate-50" : ""
                }`}
              >
                <ThemePreview preview={preview} className="h-8 w-11 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">{t(`theme.${id}.name`)}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-slate-500">{t(`theme.${id}.description`)}</span>
                </span>
                {selected && <Check size={16} className="shrink-0 text-brand-600" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThemeMenu;
