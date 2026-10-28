import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { extractError } from "../../../utils/errorHandler";
import ConfirmModal from "../../../components/common/ConfirmModal";

// compact: an icon-only trigger (the income list's row actions); the label moves to aria-label/title.
export default function DeleteIncomeButton({ incomeId, incomeName, onConfirmDelete, compact = false }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await onConfirmDelete?.(incomeId);
      setOpen(false);
    } catch (err) {
      setError(extractError(err, t("income.delete.error")));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={compact ? t("income.delete.trigger") : undefined}
        title={compact ? t("income.delete.trigger") : undefined}
        className={
          compact
            ? "flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            : "inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
        }
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M8.75 1A1.75 1.75 0 0 0 7 2.75V3H4a.75.75 0 0 0 0 1.5h.5v10.75A2.75 2.75 0 0 0 7.25 18h5.5a2.75 2.75 0 0 0 2.75-2.75V4.5h.5a.75.75 0 0 0 0-1.5h-3v-.25A1.75 1.75 0 0 0 11.25 1h-2.5ZM8.5 2.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3v-.25ZM6 4.5h8v10.75c0 .69-.56 1.25-1.25 1.25h-5.5c-.69 0-1.25-.56-1.25-1.25V4.5Z"
            clipRule="evenodd"
          />
        </svg>
        {!compact && t("income.delete.trigger")}
      </button>

      {/* The site's shared confirm dialog; it can't be dismissed while the delete is in flight. */}
      <ConfirmModal
        isOpen={open}
        onClose={() => !deleting && setOpen(false)}
        onConfirm={handleDelete}
        icon={Trash2}
        title={t("income.delete.confirmTitle")}
        description={
          <>
            {t("income.delete.confirmMessage", { name: incomeName })}
            {error && <span className="mt-2 block font-medium text-expense">{error}</span>}
          </>
        }
        cancelLabel={t("income.delete.cancel")}
        confirmLabel={deleting ? t("income.delete.deleting") : t("income.delete.confirm")}
        confirmVariant="destructive"
      />
    </>
  );
}
