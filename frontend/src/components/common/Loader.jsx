import { useTranslation } from "react-i18next";
import { ClipLoader } from "react-spinners";

// Brand color of the active theme.
const SPINNER_COLOR = "var(--color-brand-600)";

// ClipLoader's own animation also scales the ring (1 → 0.8 → 1); rotate only so it stays put.
const ROTATE_ONLY = { animation: "spinner-rotate 0.75s linear infinite" };

// Spinner only; the text is kept for screen readers (announced politely, never shown).
export function Spinner({ size = 28, label, color = SPINNER_COLOR, className = "" }) {
  const { t } = useTranslation();
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center justify-center ${className}`}>
      <ClipLoader size={size} color={color} cssOverride={ROTATE_ONLY} aria-hidden="true" />
      <span className="sr-only">{label || t("common.loading")}</span>
    </span>
  );
}

// Whole-screen loader shown while the app restores the session on reload.
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner size={34} />
    </div>
  );
}
