import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { insufficientBalanceDetected } from "../../store/slices/notificationsSlice";
import {
  createAccount,
  fetchAccounts,
  transferFunds,
} from "../../store/slices/accountsSlice";
import { formatMoney } from "../../utils/formatAmount";
import CashHeader from "./components/CashHeader";
import CashBalanceCard from "./components/CashBalanceCard";
import NoCashAccount from "./components/NoCashAccount";
import WithdrawCashForm from "./components/WithdrawCashForm";
import SuccessToast from "../../components/common/SuccessToast";
import { ArrowDownLeft } from "lucide-react";

function CashPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items, status, error, transferStatus, transferError, createStatus, createError } = useSelector(
    (state) => state.accounts
  );
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const closeToast = useCallback(() => setToastMessage(""), []);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const activeAccounts = useMemo(
    () => items.filter((account) => account.isActive !== false && !account.isArchived),
    [items]
  );
  const sourceAccounts = useMemo(
    () => activeAccounts.filter((account) => account.type !== "cash"),
    [activeAccounts]
  );
  const cashAccounts = useMemo(
    () => activeAccounts.filter((account) => account.type === "cash"),
    [activeAccounts]
  );
  // Cash balance per currency (largest first); different currencies are never added together.
  const cashTotals = Object.entries(
    cashAccounts.reduce((acc, account) => {
      const code = account.currency || "EGP";
      acc[code] = (acc[code] || 0) + Number(account.balance || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  async function handleCreateCashAccount() {
    setFormError("");
    try {
      const account = await dispatch(createAccount({ name: t("nav.cash"), type: "cash", balance: 0 })).unwrap();
      setToId(account._id);
    } catch {
      setFormError(createError || t("cash.createAccountError"));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const amountNumber = Number(amount);
    setFormError("");
    if (!fromId || !toId) {
      setFormError(t("cash.selectAccountsError"));
      return;
    }
    if (!amountNumber || amountNumber <= 0) {
      setFormError(t("cash.amountPositiveError"));
      return;
    }

    const fromAccount = sourceAccounts.find((account) => String(account._id) === String(fromId));
    if (fromAccount && amountNumber > Number(fromAccount.balance)) {
      dispatch(insufficientBalanceDetected({ source: "cash", account: fromAccount, amount: amountNumber }));
      setFormError(
        t("cash.insufficientBalance.message", {
          account: fromAccount.name,
          balance: formatMoney(fromAccount.balance, fromAccount.currency),
          amount: formatMoney(amountNumber, fromAccount.currency),
        })
      );
      return;
    }

    try {
      await dispatch(transferFunds({ fromId, toId, amount: amountNumber, description: t("cash.internalTransfer") })).unwrap();
      setAmount("");
      setIsWithdrawOpen(false);
      setToastMessage(t("cash.withdrawSuccess"));
      await dispatch(fetchAccounts());
    } catch {
      // The Redux slice exposes the API error below the form.
    }
  }

  const requestError = formError || transferError || error || createError;

  // X on the withdraw form: hide it and discard what was typed
  const closeWithdrawForm = () => {
    setIsWithdrawOpen(false);
    setFromId("");
    setAmount("");
    setFormError("");
  };


  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <CashHeader />

      <CashBalanceCard cashTotals={cashTotals} hasCashAccount={cashAccounts.length > 0} />

      {cashAccounts.length === 0 ? (
        <NoCashAccount handleCreateCashAccount={handleCreateCashAccount} createStatus={createStatus} />
      ) : !isWithdrawOpen && (
        <div className="flex justify-center pt-10 pb-4 sm:pt-14">
          <button
            type="button"
            onClick={() => setIsWithdrawOpen(true)}
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
          >
            <ArrowDownLeft size={20} strokeWidth={2.5} />
            {t("cash.withdrawTitle")}
          </button>
        </div>
      )}

      {isWithdrawOpen && cashAccounts.length > 0 && (
        <WithdrawCashForm
          handleSubmit={handleSubmit}
          onClose={closeWithdrawForm}
          fromId={fromId}
          setFromId={setFromId}
          toId={toId}
          setToId={setToId}
          amount={amount}
          setAmount={setAmount}
          sourceAccounts={sourceAccounts}
          cashAccounts={cashAccounts}
          requestError={requestError}
          transferStatus={transferStatus}
          status={status}
        />
      )}

      <SuccessToast message={toastMessage} onClose={closeToast} title={t("cash.withdrawDone")} />
    </div>
  );
}

export default CashPage;
