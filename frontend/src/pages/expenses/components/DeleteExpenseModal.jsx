import { useTranslation } from "react-i18next";
import { formatMoney } from "../../../utils/formatAmount";
import { categoryLabel } from "../../categories/components/mandatoryCategories";

function DeleteExpenseModal({ deletingExpense, setDeletingExpense, deleteLoading, deleteError, handleConfirmDelete, getCategoryName }) {
  const { t } = useTranslation();

  return (
    <>
    {deletingExpense && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        onClick={() => !deleteLoading && setDeletingExpense(null)}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-slate-900">{t("expenses.deleteModal.title")}</h3>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            {t("expenses.deleteModal.confirmQuestion", {
              description: deletingExpense.description,
              amount: formatMoney(deletingExpense.amount, deletingExpense.currency),
              category: categoryLabel(getCategoryName(deletingExpense.category)),
            })}
          </p>

          {deletingExpense.account && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
              <svg className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 0 0-6 6c0 1.887.87 3.57 2.235 4.675A2 2 0 0 1 7 14.25v.75a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-.75a2 2 0 0 1 .765-1.575A6.002 6.002 0 0 0 16 8a6 6 0 0 0-6-6Zm-2 16a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.5H8V18Z" />
              </svg>
              <span>
                {t("expenses.deleteModal.refundNote", {
                  amount: formatMoney(deletingExpense.amount, deletingExpense.currency),
                  account: deletingExpense.account.name,
                })}
              </span>
            </div>
          )}

          {deleteError && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {deleteError}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => setDeletingExpense(null)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {t("expenses.deleteModal.cancel")}
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleConfirmDelete}
              className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
            >
              {deleteLoading ? t("expenses.deleteModal.deleting") : t("expenses.deleteModal.confirm")}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default DeleteExpenseModal;
