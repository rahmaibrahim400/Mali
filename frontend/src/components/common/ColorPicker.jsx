import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pipette } from "lucide-react";
import { useTheme } from "../../utils/theme";

// The first two swatches are the active theme's own colors.
const THEME_SWATCHES = {
  mali: ["#334155", "#ff9b51"],
  emerald: ["#1e2a38", "#10b981"],
};

const SHARED_SWATCHES = [
  "#4f46e5",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#7c3aed",
];

// Preset swatches and a custom-color button (opens the native picker).
function ColorPicker({ id, name, value, onChange, swatches: swatchesProp, labelledBy }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const swatches = swatchesProp || [...THEME_SWATCHES[theme], ...SHARED_SWATCHES];
  const generatedId = useId();
  const inputId = id || `color-${generatedId}`;
  const current = (value || "").toLowerCase();
  const isCustom = current && !swatches.includes(current);

  const emit = (color) => onChange?.({ target: { name, value: color } });

  return (
    <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 sm:gap-3 sm:px-3">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="grid w-full grid-cols-7 items-center gap-y-2 sm:grid-cols-12"
      >
        {swatches.map((color, index) => {
          const selected = current === color;
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color}
              title={color.toUpperCase()}
              onClick={() => emit(color)}
              className={`flex h-6 w-6 items-center justify-center justify-self-center rounded-full transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-7 sm:w-7 ${
                index >= 6 && !selected ? "hidden sm:flex" : ""
              } ${
                selected ? "ring-2 ring-slate-900/15 ring-offset-2" : ""
              }`}
              style={{ backgroundColor: color, outlineColor: color }}
            >
              {selected && <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />}
            </button>
          );
        })}

        {/* Custom color: the native input sits on top of the button so a click opens the picker. */}
        <span
          className={`relative flex h-6 w-6 items-center justify-center justify-self-center rounded-full transition hover:scale-110 sm:h-7 sm:w-7 ${
            isCustom ? "ring-2 ring-slate-900/15 ring-offset-2" : ""
          }`}
          style={{
            background: isCustom
              ? current
              : "conic-gradient(#ef4444, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #ef4444)",
          }}
          title={t("common.colorPicker.custom")}
        >
          {isCustom ? (
            <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />
          ) : (
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm">
              <Pipette size={11} strokeWidth={2.5} />
            </span>
          )}
          <input
            id={inputId}
            type="color"
            value={current || swatches[0]}
            onChange={(event) => emit(event.target.value.toLowerCase())}
            aria-label={t("common.colorPicker.custom")}
            className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0"
          />
        </span>
      </div>

    </div>
  );
}

export default ColorPicker;
