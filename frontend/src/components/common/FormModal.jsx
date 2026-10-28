import { useId } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

// Add/create form shown as a dialog over the page: title and an X to close at the top.
// Clicking the backdrop closes it too, unless `closeDisabled` (e.g. while saving).
function FormModal({ title, onClose, closeDisabled = false, children }) {
  const { t } = useTranslation();
  const titleId = useId();
  const close = () => {
    if (!closeDisabled) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4" onClick={close}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={close}
            disabled={closeDisabled}
            aria-label={t("common.close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-65"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default FormModal;
