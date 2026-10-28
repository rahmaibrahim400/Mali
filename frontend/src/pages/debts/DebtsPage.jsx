import { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { activityLogged, insufficientBalanceDetected } from "../../store/slices/notificationsSlice";
import { Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { getDebtPayments } from "../../api/debtsApi";
import { fetchAccounts } from "../../store/slices/accountsSlice";
import {
  fetchDebts,
  createDebtThunk,
  updateDebtThunk,
  deleteDebtThunk,
  markDebtPaidThunk,
  addDebtPaymentThunk,
} from "../../store/slices/debtsSlice";
import { formatAmount, formatMoney, currencyLabel } from "../../utils/formatAmount";
import ConfirmModal from "../../components/common/ConfirmModal";
import { getTodayString, EMPTY_DEBT_FORM } from "./constants";
import { getErrorMessage } from "./utils";
import DebtsHeader from "./components/DebtsHeader";
import DebtNotifications from "./components/DebtNotifications";
import DebtForm from "./components/DebtForm";
import SuccessToast from "../../components/common/SuccessToast";
import DebtTabs from "./components/DebtTabs";
import DebtsList from "./components/DebtsList";
import PaymentModal from "./components/PaymentModal";

function DebtsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: accounts } = useSelector((state) => state.accounts);
  const { items: debts, status: debtsLoadingStatus } = useSelector((state) => state.debts);

  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const closeToast = useCallback(() => setToastMessage(""), []);

  // Tabs: "active" | "completed" | "all"
  const [activeTab, setActiveTab] = useState("all");

  // New Debt Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [debtForm, setDebtForm] = useState(EMPTY_DEBT_FORM);
  const [savingDebt, setSavingDebt] = useState(false);
  const [editingDueDateId, setEditingDueDateId] = useState(null);
  const [editingDueDate, setEditingDueDate] = useState("");
  const [savingDueDate, setSavingDueDate] = useState(false);

  // Payment Modal state
  const [paymentModalDebt, setPaymentModalDebt] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: getTodayString(),
    accountId: "",
    notes: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [balanceWarning, setBalanceWarning] = useState(false);

  // Expanded History state (debtId -> boolean) & history data (debtId -> array)
  const [expandedHistoryDebtId, setExpandedHistoryDebtId] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState({});
  const [loadingHistoryDebtId, setLoadingHistoryDebtId] = useState(null);

  // Active accounts for paying debts
  const activeAccounts = useMemo(
    () => accounts.filter((acc) => acc.isActive !== false && !acc.isArchived),
    [accounts]
  );

  // Separate active vs completed debts
  const activeDebts = useMemo(
    () =>
      debts.filter(
        (d) =>
          d.status !== "paid" &&
          (d.remainingAmount === undefined || d.remainingAmount > 0)
      ),
    [debts]
  );

  const completedDebts = useMemo(
    () =>
      debts.filter(
        (d) =>
          d.status === "paid" ||
          (d.remainingAmount !== undefined && d.remainingAmount <= 0)
      ),
    [debts]
  );

  const displayedDebts = useMemo(() => {
    if (activeTab === "active") return activeDebts;
    if (activeTab === "completed") return completedDebts;
    return debts;
  }, [activeTab, activeDebts, completedDebts, debts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchDebts());
      dispatch(fetchAccounts());
    }, 0);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // Handle new debt form input
  // X on the add form: hide it and discard what was typed
  function closeAddForm() {
    setShowAddForm(false);
    setDebtForm({ ...EMPTY_DEBT_FORM, startDate: getTodayString() });
    setError("");
  }

  function handleDebtFormChange({ target }) {
    setDebtForm((prev) => ({ ...prev, [target.name]: target.value }));
  }

  // Submit new debt
  async function handleCreateDebt(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (
      !debtForm.creditor.trim() ||
      !debtForm.totalAmount ||
      Number(debtForm.totalAmount) <= 0 ||
      !debtForm.currency ||
      !debtForm.startDate ||
      !debtForm.dueDate
    ) {
      setError(t("debts.createValidationError"));
      return;
    }

    setSavingDebt(true);
    try {
      await dispatch(
        createDebtThunk({
          ...debtForm,
          creditor: debtForm.creditor.trim(),
          totalAmount: Number(debtForm.totalAmount),
        })
      ).unwrap();

      setDebtForm({ ...EMPTY_DEBT_FORM, startDate: getTodayString() });
      setShowAddForm(false);
      dispatch(
        activityLogged({
          type: "debtAdded",
          data: { source: "debtPayment", creditor: debtForm.creditor.trim(), amount: Number(debtForm.totalAmount), currency: debtForm.currency },
        })
      );
      setActiveTab("active");
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("debts.createError")));
    } finally {
      setSavingDebt(false);
    }
  }

  async function handleUpdateDueDate(debt, event) {
    event.preventDefault();
    if (!editingDueDate) return;
    setSavingDueDate(true);
    setError("");
    try {
      await dispatch(
        updateDebtThunk({ id: debt._id, payload: { dueDate: editingDueDate } })
      ).unwrap();
      setEditingDueDateId(null);
      setSuccessMessage(t("debts.dueDateUpdateSuccess"));
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("debts.dueDateUpdateError")));
    } finally {
      setSavingDueDate(false);
    }
  }

  // Delete debt
  function handleDeleteDebt(id, e) {
    if (e) e.stopPropagation();
    setConfirmAction({ type: "delete", id });
  }

  async function performDeleteDebt(id) {
    try {
      await dispatch(deleteDebtThunk(id)).unwrap();
      if (expandedHistoryDebtId === id) setExpandedHistoryDebtId(null);
      setSuccessMessage(t("debts.deleteSuccess"));
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("debts.deleteError")));
    }
  }

  // US-506: Mark debt as fully paid with confirmation
  function handleMarkPaid(debt, e) {
    if (e) e.stopPropagation();
    setConfirmAction({ type: "paid", debt });
  }

  async function performMarkPaid(debt) {
    try {
      await dispatch(markDebtPaidThunk(debt._id)).unwrap();
      // The result goes to the notifications bell, not a banner on the page.
      dispatch(activityLogged({ type: "debtPaid", data: { source: "debtPayment", creditor: debt.creditor } }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("debts.markPaidError")));
    }
  }

  async function runConfirmedAction() {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;
    if (action.type === "delete") await performDeleteDebt(action.id);
    if (action.type === "paid") await performMarkPaid(action.debt);
  }

  // Open Payment Modal
  function openPaymentModal(debt, e) {
    if (e) e.stopPropagation();
    setPaymentModalDebt(debt);
    setPaymentForm({
      amount: "",
      date: getTodayString(),
      accountId: activeAccounts[0]?._id || "",
      notes: "",
    });
    setError("");
  }

  // Submit Payment
  async function handleSavePayment(e) {
    e.preventDefault();
    if (!paymentModalDebt) return;

    const remaining = Number(
      paymentModalDebt.remainingAmount ??
        paymentModalDebt.totalAmount - paymentModalDebt.paidAmount
    );
    const amountNum = Number(paymentForm.amount);

    if (!amountNum || amountNum <= 0) {
      setError(t("debts.paymentAmountPositiveError"));
      return;
    }
    if (amountNum > remaining) {
      setError(
        t("debts.paymentExceedsRemainingError", {
          remaining: formatAmount(remaining),
          currency: currencyLabel(paymentModalDebt.currency),
        })
      );
      return;
    }
    if (!paymentForm.accountId) {
      setError(t("debts.paymentAccountRequiredError"));
      return;
    }
    if (!paymentForm.date) {
      setError(t("debts.paymentDateRequiredError"));
      return;
    }

    const account = activeAccounts.find(
      (acc) => String(acc._id) === String(paymentForm.accountId)
    );
    if (account && amountNum > Number(account.balance)) {
      dispatch(insufficientBalanceDetected({ source: "debtPayment", account, amount: amountNum }));
      setBalanceWarning(true);
      return;
    }

    await performPayment();
  }

  // Actually submit the debt payment (after validations and balance confirmation)
  async function performPayment() {
    const amountNum = Number(paymentForm.amount);

    setSavingPayment(true);
    setError("");
    try {
      await dispatch(
        addDebtPaymentThunk({
          id: paymentModalDebt._id,
          payload: {
            amount: amountNum,
            date: paymentForm.date,
            accountId: paymentForm.accountId,
            notes: paymentForm.notes.trim(),
          },
        })
      ).unwrap();

      // The history stays as it was (closed by default); refresh it only if it is open.
      if (expandedHistoryDebtId === paymentModalDebt._id) await fetchHistory(paymentModalDebt._id);

      // Update account balance in Redux
      dispatch(fetchAccounts());

      dispatch(
        activityLogged({
          type: "debtPaymentAdded",
          data: { source: "debtPayment", creditor: paymentModalDebt.creditor, amount: amountNum, currency: paymentModalDebt.currency || "EGP" },
        })
      );
      setPaymentModalDebt(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("debts.paymentError")));
    } finally {
      setSavingPayment(false);
    }
  }

  // Fetch payment history directly from backend API
  async function fetchHistory(debtId) {
    setLoadingHistoryDebtId(debtId);
    try {
      const res = await getDebtPayments(debtId);
      setPaymentHistory((prev) => ({ ...prev, [debtId]: res.data.data || [] }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("debts.historyFetchError")));
    } finally {
      setLoadingHistoryDebtId(null);
    }
  }

  // Toggle payment history view and fetch fresh from backend
  async function toggleHistory(debtId) {
    if (expandedHistoryDebtId === debtId) {
      setExpandedHistoryDebtId(null);
    } else {
      setExpandedHistoryDebtId(debtId);
      await fetchHistory(debtId);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <DebtsHeader
        setShowAddForm={setShowAddForm}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />

      <DebtNotifications
        error={error}
        setError={setError}
        successMessage={successMessage}
        setSuccessMessage={setSuccessMessage}
      />

      {showAddForm && (
        <DebtForm
          onClose={closeAddForm}
          error={error}
          debtForm={debtForm}
          handleDebtFormChange={handleDebtFormChange}
          handleCreateDebt={handleCreateDebt}
          savingDebt={savingDebt}
        />
      )}

      <SuccessToast message={toastMessage} onClose={closeToast} />

      <DebtTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDebts={activeDebts}
        completedDebts={completedDebts}
        debts={debts}
      />

      <DebtsList
        debtsLoadingStatus={debtsLoadingStatus}
        debts={debts}
        displayedDebts={displayedDebts}
        activeTab={activeTab}
        expandedHistoryDebtId={expandedHistoryDebtId}
        paymentHistory={paymentHistory}
        loadingHistoryDebtId={loadingHistoryDebtId}
        activeAccounts={activeAccounts}
        editingDueDateId={editingDueDateId}
        setEditingDueDateId={setEditingDueDateId}
        editingDueDate={editingDueDate}
        setEditingDueDate={setEditingDueDate}
        savingDueDate={savingDueDate}
        handleUpdateDueDate={handleUpdateDueDate}
        openPaymentModal={openPaymentModal}
        handleMarkPaid={handleMarkPaid}
        handleDeleteDebt={handleDeleteDebt}
        toggleHistory={toggleHistory}
      />

      <PaymentModal
        paymentModalDebt={paymentModalDebt}
        setPaymentModalDebt={setPaymentModalDebt}
        handleSavePayment={handleSavePayment}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        activeAccounts={activeAccounts}
        savingPayment={savingPayment}
      />

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        icon={confirmAction?.type === "delete" ? Trash2 : CheckCircle2}
        title={t("debts.confirmTitle")}
        description={
          confirmAction?.type === "paid"
            ? t("debts.markPaidConfirm", { creditor: confirmAction.debt.creditor })
            : t("debts.deleteConfirm")
        }
        cancelLabel={t("debts.cancel")}
        confirmLabel={
          confirmAction?.type === "paid" ? t("debts.actions.markPaid") : t("debts.actions.delete")
        }
        confirmVariant={confirmAction?.type === "delete" ? "destructive" : "primary"}
      />

      <ConfirmModal
        isOpen={balanceWarning}
        onClose={() => setBalanceWarning(false)}
        onConfirm={async () => {
          setBalanceWarning(false);
          await performPayment();
        }}
        icon={AlertTriangle}
        confirmVariant="destructive"
        title={t("debts.insufficientBalance.title")}
        description={(() => {
          const account = activeAccounts.find(
            (acc) => String(acc._id) === String(paymentForm.accountId)
          );
          if (!account) return "";
          return t("debts.insufficientBalance.message", {
            account: account.name,
            balance: formatMoney(account.balance, account.currency),
            amount: formatMoney(Number(paymentForm.amount), account.currency),
          });
        })()}
        cancelLabel={t("debts.insufficientBalance.cancel")}
        confirmLabel={t("debts.insufficientBalance.confirm")}
      />

    </div>
  );
}

export default DebtsPage;
