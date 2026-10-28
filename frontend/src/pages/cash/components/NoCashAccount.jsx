import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

function NoCashAccount({ handleCreateCashAccount, createStatus }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="rounded-2xl bg-amber-50 p-5 text-amber-800">
        <p className="font-semibold">{t("cash.noAccount")}</p>
        <button
          type="button"
          onClick={handleCreateCashAccount}
          disabled={createStatus === "loading"}
          className="mt-3 flex w-fit items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Plus size={14} /> {t("cash.createAccount")}
        </button>
      </div>
    </>
  );
}

export default NoCashAccount;
