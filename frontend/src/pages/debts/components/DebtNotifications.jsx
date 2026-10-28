import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

function DebtNotifications({ error, setError, successMessage, setSuccessMessage }) {
  const { t } = useTranslation();
  return (
    <>
    {error && (
      <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => setError("")}
          aria-label={t("common.close")}
          className="text-red-500 hover:text-red-700"
        >
          <X size={16} />
        </button>
      </div>
    )}

    {successMessage && (
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
        <button
          type="button"
          onClick={() => setSuccessMessage("")}
          aria-label={t("common.close")}
          className="text-emerald-600 hover:text-emerald-800"
        >
          <X size={16} />
        </button>
      </div>
    )}

    </>
  );
}

export default DebtNotifications;
