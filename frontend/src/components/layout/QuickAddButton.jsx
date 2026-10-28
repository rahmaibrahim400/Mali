import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { fetchAccounts } from "../../store/slices/accountsSlice";
import Select from "../common/Select";
import NumberInput from "../common/NumberInput";
import { createExpense } from "../../api/expenseApi";
import { listCategories } from "../../api/categoryApi";
import { extractError } from "../../utils/errorHandler";
import { todayISODate } from "../../utils/formatAmount";
import { categoryLabel } from "../../pages/categories/components/mandatoryCategories";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500";

function QuickAddButton() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const { items: accounts } = useSelector((state) => state.accounts);

  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const cashAccount = accounts.find((account) => account.type === "cash" && !account.isArchived);

  useEffect(() => {
    if (!open) return;
    dispatch(fetchAccounts());
    listCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [open, dispatch]);

  const close = () => {
    setOpen(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0 || !category) {
      setError(t("quickAdd.required"));
      return;
    }
    if (!cashAccount) {
      setError(t("quickAdd.noCashAccount"));
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createExpense({
        amount: value,
        description: description.trim() || t("quickAdd.defaultDescription"),
        date: todayISODate(),
        paymentMethod: "cash",
        expenseType: "daily",
        category,
        accountId: cashAccount._id,
        currency: cashAccount.currency || "EGP",
        status: "confirmed",
      });
      setAmount("");
      setCategory("");
      setDescription("");
      setOpen(false);
      setToast(t("quickAdd.success"));
      setTimeout(() => setToast(""), 3500);
      dispatch(fetchAccounts());
    } catch (err) {
      setError(extractError(err, t("quickAdd.error")));
    } finally {
      setSaving(false);
    }
  };

  // On the chat page the floating button would cover the message box's send button.
  const onChatPage = pathname.startsWith("/chat");

  return createPortal(
    <>
      {!onChatPage && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("quickAdd.button")}
        aria-label={t("quickAdd.button")}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] inset-e-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-accent-500 text-navy ring-1 ring-white shadow-md shadow-accent-500/30 transition hover:bg-accent-600 emerald:bg-brand-600 emerald:text-white emerald:shadow-[0_8px_24px_-4px_rgb(30_42_56_/_0.35)] emerald:[--tw-shadow-color:initial] emerald:hover:bg-brand-700 lg:bottom-6 lg:inset-e-5"
      >
        <Plus size={20} />
      </button>
      )}

      {toast && (
        <div className="fixed bottom-[calc(13.5rem+env(safe-area-inset-bottom,0px))] inset-e-5 z-50 lg:bottom-40 lg:inset-e-5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => !saving && close()}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{t("quickAdd.title")}</h2>
              <button type="button" onClick={close} aria-label={t("quickAdd.cancel")} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              {t("quickAdd.amount")}
              <NumberInput
                autoFocus
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              {t("quickAdd.category")}
              <Select required value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
                <option value="">{t("quickAdd.selectCategory")}</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.name} value={cat.name}>
                    {categoryLabel(cat.name)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              {t("quickAdd.description")}
              <input value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} />
            </label>

            {error && <p className="rounded-xl bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} disabled={saving} className="min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:w-auto">
                {t("quickAdd.cancel")}
              </button>
              <button type="submit" disabled={saving} className="min-h-11 w-full rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto">
                {saving ? t("quickAdd.submitting") : t("quickAdd.submit")}
              </button>
            </div>
          </form>
        </div>
      )}
    </>,
    document.body
  );
}

export default QuickAddButton;
