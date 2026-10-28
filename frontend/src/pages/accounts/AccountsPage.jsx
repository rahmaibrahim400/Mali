import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import {
  createAccount,
  fetchAccounts,
  resetCreateAccountStatus,
  adjustBalance,
  toggleArchiveAccount,
} from "../../store/slices/accountsSlice";
import AccountForm from "./components/AccountForm";
import AccountsList from "./components/AccountsList";
import WealthSummary from "./components/WealthSummary";
import PageHeader from "../../components/common/PageHeader";
import SuccessToast from "../../components/common/SuccessToast";
import { Wallet, Plus } from "lucide-react";
import { getTheme } from "../../utils/theme";

// A new account starts with the active theme's main color (the first ColorPicker swatch).
const defaultColor = () => (getTheme() === "emerald" ? "#1e2a38" : "#334155");
const emptyForm = () => ({
  name: "",
  type: "",
  initialBalance: "",
  currency: "EGP",
  color: defaultColor(),
});

function AccountsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items, status, error, createStatus, createError, adjustStatus } = useSelector(
    (state) => state.accounts
  );
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const closeToast = useCallback(() => setToastMessage(""), []);

  useEffect(() => {
    dispatch(fetchAccounts());
    return () => dispatch(resetCreateAccountStatus());
  }, [dispatch]);

  const handleChange = ({ target }) => {
    setForm((previous) => ({ ...previous, [target.name]: target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(createAccount({
      name: form.name.trim(),
      type: form.type,
      balance: Number(form.initialBalance),
      currency: form.currency,
      color: form.color || defaultColor(),
    }));
    if (createAccount.fulfilled.match(result)) {
      setForm(emptyForm());
      setIsCreateOpen(false);
      setToastMessage(t("accounts.success"));
    }
  };

  // X on the add form: hide it and discard what was typed
  const closeCreateForm = () => {
    setIsCreateOpen(false);
    setForm(emptyForm());
    dispatch(resetCreateAccountStatus());
  };

  const handleAdjustBalance = ({ accountId, newBalance, notes }) =>
    dispatch(adjustBalance({ accountId, newBalance, notes })).unwrap();

  const handleToggleArchive = (accountId) => dispatch(toggleArchiveAccount(accountId));
  const displayedAccounts = items.filter((account) => Boolean(account.isArchived) === showArchived);

  // Phones: this button sits under the total-wealth card; from sm it lives in the page header.
  const addAccountButton = (extraClass) => (
    <button
      type="button"
      onClick={() => setIsCreateOpen(true)}
      className={`min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 ${extraClass}`}
    >
      <Plus size={18} strokeWidth={2.5} />
      {t("accounts.submit")}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={Wallet}
        title={t("accounts.title")}
        subtitle={t("accounts.formDescription")}
        actions={addAccountButton("hidden sm:inline-flex sm:w-auto")}
      />

      <WealthSummary accounts={items} t={t} />
      {addAccountButton("mt-4 inline-flex sm:hidden")}
      {isCreateOpen && (
        <AccountForm
          form={form}
          createStatus={createStatus}
          createError={createError}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeCreateForm}
          t={t}
        />
      )}
      <SuccessToast message={toastMessage} onClose={closeToast} />
      <AccountsList
        accounts={displayedAccounts}
        showArchived={showArchived}
        status={status}
        error={error}
        adjustStatus={adjustStatus}
        onToggleView={() => setShowArchived((previous) => !previous)}
        onAdjust={handleAdjustBalance}
        onToggleArchive={handleToggleArchive}
        t={t}
      />
    </div>
  );
}

export default AccountsPage;
