import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, X } from "lucide-react";

const TOAST_DURATION = 4000;

// Success alert that slides in at the top of the screen and closes itself.
function SuccessToast({ message, onClose, title }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-60 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="toast-enter pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-100"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-income-soft text-income">
          <CheckCircle2 size={22} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold text-slate-900">{title || t("common.added")}</p>
          <p className="mt-0.5 text-sm text-slate-500">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} />
        </button>
        <span
          aria-hidden="true"
          className="toast-progress absolute inset-x-0 bottom-0 h-1 bg-income"
          style={{ animationDuration: `${TOAST_DURATION}ms` }}
        />
      </div>
    </div>
  );
}

export default SuccessToast;
