import { useTranslation } from "react-i18next";
import { Plus, ReceiptText } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";

function DebtsHeader({ setShowAddForm, setError, setSuccessMessage }) {
  const { t } = useTranslation();

  return (
    <PageHeader
      icon={ReceiptText}
      title={t("nav.debts")}
      subtitle={t("debts.subtitle")}
      actions={
      <button
        type="button"
        onClick={() => {
          setShowAddForm(true);
          setError("");
          setSuccessMessage("");
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
      >
        <Plus size={18} />
        {t("debts.addNew")}
      </button>
      }
    />
  );
}

export default DebtsHeader;
