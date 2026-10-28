import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { insufficientBalanceDetected } from "../../store/slices/notificationsSlice";
import { Plus, Trash2, Goal } from "lucide-react";
import { fetchAccounts } from "../../store/slices/accountsSlice";
import {
  fetchGoals,
  createGoalThunk,
  updateGoalThunk,
  deleteGoalThunk,
  depositToGoalThunk,
  withdrawFromGoalThunk,
  completeGoalThunk,
  archiveGoalThunk,
  fetchGoalTransactionsThunk,
} from "../../store/slices/savingsSlice";
import ConfirmModal from "../../components/common/ConfirmModal";
import { formatMoney } from "../../utils/formatAmount";
import { getTodayString, EMPTY_GOAL_FORM } from "./constants";
import { getErrorMessage } from "./utils";
import GoalForm from "./components/GoalForm";
import GoalCard from "./components/GoalCard";
import GoalActionModal from "./components/GoalActionModal";
import AccountPickerModal from "./components/AccountPickerModal";
import { CardGridSkeleton } from "../../components/common/Skeleton";
import PageHeader from "../../components/common/PageHeader";
import TotalsCard from "../../components/common/TotalsCard";

function SavingsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: accounts } = useSelector((state) => state.accounts);
  const { items: goals, status, transactionsByGoal, transactionsStatus } = useSelector((state) => state.savings);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tab, setTab] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState(EMPTY_GOAL_FORM);
  const [saving, setSaving] = useState(false);

  const [actionModal, setActionModal] = useState(null); // { goal, mode: "deposit"|"withdraw" }
  const [actionForm, setActionForm] = useState({ amount: "", accountId: "", date: getTodayString(), note: "" });
  const [actionSaving, setActionSaving] = useState(false);

  const [pickerModal, setPickerModal] = useState(null); // { goal, action: "complete"|"archive"|"delete" }
  const [pickerAccountId, setPickerAccountId] = useState("");
  const [pickerSaving, setPickerSaving] = useState(false);

  const [expandedGoalId, setExpandedGoalId] = useState(null);

  const activeAccounts = useMemo(
    () => accounts.filter((acc) => acc.isActive !== false && !acc.isArchived),
    [accounts]
  );

  const filteredGoals = useMemo(() => {
    if (tab === "active") return goals.filter((g) => g.status === "active");
    if (tab === "completed") return goals.filter((g) => g.status === "completed");
    if (tab === "archived") return goals.filter((g) => g.status === "archived");
    return goals;
  }, [tab, goals]);

  // Money currently held in goals (active and completed), per currency. Archived goals are left out.
  const savedByCurrency = useMemo(() => {
    const totals = {};
    for (const goal of goals) {
      if (goal.status === "archived") continue;
      const currency = goal.currency || "EGP";
      totals[currency] = (totals[currency] || 0) + (Number(goal.currentAmount) || 0);
    }
    return Object.entries(totals);
  }, [goals]);

  useEffect(() => {
    dispatch(fetchGoals());
    dispatch(fetchAccounts());
  }, [dispatch]);

  function openCreateForm() {
    setEditingGoal(null);
    setForm(EMPTY_GOAL_FORM);
    setShowForm(true);
    setError("");
  }

  function openEditForm(goal) {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      emoji: goal.emoji,
      targetAmount: goal.targetAmount,
      currency: goal.currency,
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : "",
      description: goal.description || "",
    });
    setShowForm(true);
    setError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmitForm(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.targetAmount || Number(form.targetAmount) <= 0) {
      setError(t("savings.createValidationError"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingGoal) {
        await dispatch(updateGoalThunk({ id: editingGoal._id, payload: form })).unwrap();
        setSuccessMessage(t("savings.updateSuccess"));
      } else {
        await dispatch(createGoalThunk(form)).unwrap();
        setSuccessMessage(t("savings.createSuccess"));
      }
      setShowForm(false);
      setForm(EMPTY_GOAL_FORM);
      setEditingGoal(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("savings.createError")));
    } finally {
      setSaving(false);
    }
  }

  function openActionModal(goal, mode) {
    setActionModal({ goal, mode });
    setActionForm({ amount: "", accountId: activeAccounts[0]?._id || "", date: getTodayString(), note: "" });
    setError("");
  }

  async function handleSubmitAction(event) {
    event.preventDefault();
    const amt = Number(actionForm.amount);
    if (!amt || amt <= 0) {
      setError(t("savings.actionModal.amountRequiredError"));
      return;
    }

    if (actionModal.mode === "deposit" && actionForm.accountId) {
      const account = activeAccounts.find(
        (acc) => String(acc._id) === String(actionForm.accountId)
      );
      if (account && amt > Number(account.balance)) {
        dispatch(insufficientBalanceDetected({ source: "savings", account, amount: amt }));
        setError(
          t("savings.insufficientBalance.message", {
            account: account.name,
            balance: formatMoney(account.balance, account.currency),
            amount: formatMoney(amt, account.currency),
          })
        );
        return;
      }
    }

    setActionSaving(true);
    setError("");
    try {
      const payload = {
        amount: amt,
        accountId: actionForm.accountId || undefined,
        date: actionForm.date,
        note: actionForm.note.trim(),
      };
      if (actionModal.mode === "deposit") {
        await dispatch(depositToGoalThunk({ id: actionModal.goal._id, payload })).unwrap();
        setSuccessMessage(t("savings.deposit.success"));
      } else {
        await dispatch(withdrawFromGoalThunk({ id: actionModal.goal._id, payload })).unwrap();
        setSuccessMessage(t("savings.withdraw.success"));
      }
      if (actionForm.accountId) dispatch(fetchAccounts());
      if (expandedGoalId === actionModal.goal._id) dispatch(fetchGoalTransactionsThunk(actionModal.goal._id));
      setActionModal(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("savings.actionModal.error")));
    } finally {
      setActionSaving(false);
    }
  }

  function openPicker(goal, action) {
    setPickerModal({ goal, action });
    setPickerAccountId(activeAccounts[0]?._id || "");
    setError("");
  }

  async function handleConfirmPicker() {
    const { goal, action } = pickerModal;
    setPickerSaving(true);
    setError("");
    try {
      if (action === "complete") {
        await dispatch(completeGoalThunk({ id: goal._id, accountId: pickerAccountId })).unwrap();
        setSuccessMessage(t("savings.complete.success"));
      } else if (action === "archive") {
        await dispatch(archiveGoalThunk({ id: goal._id, accountId: pickerAccountId })).unwrap();
        setSuccessMessage(t("savings.archive.success"));
      } else if (action === "delete") {
        await dispatch(deleteGoalThunk({ id: goal._id, accountId: pickerAccountId })).unwrap();
        setSuccessMessage(t("savings.deleteAction.success"));
      }
      dispatch(fetchAccounts());
      setPickerModal(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("savings.actionModal.error")));
    } finally {
      setPickerSaving(false);
    }
  }

  function handleDeleteClick(goal) {
    if (goal.currentAmount > 0) {
      openPicker(goal, "delete");
    } else {
      setPickerModal({ goal, action: "delete", noBalance: true });
    }
  }

  async function performSimpleDelete(goal) {
    setPickerSaving(true);
    setError("");
    try {
      await dispatch(deleteGoalThunk({ id: goal._id })).unwrap();
      setSuccessMessage(t("savings.deleteAction.success"));
      setPickerModal(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("savings.actionModal.error")));
    } finally {
      setPickerSaving(false);
    }
  }

  async function toggleExpand(goalId) {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
    } else {
      setExpandedGoalId(goalId);
      dispatch(fetchGoalTransactionsThunk(goalId));
    }
  }

  const TABS = ["all", "active", "completed", "archived"];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        icon={Goal}
        title={t("savings.title")}
        subtitle={t("savings.subtitle")}
        actions={
          <button type="button" onClick={() => (showForm ? setShowForm(false) : openCreateForm())} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700">
            <Plus size={16} />
            {t("savings.addGoal")}
          </button>
        }
      />

      {(error || successMessage) && (
        <div>
          {error && (
            <div className="flex items-center justify-between rounded-xl bg-expense-soft px-4 py-3 text-sm font-medium text-expense">
              {error}
              <button type="button" onClick={() => setError("")} aria-label={t("common.close")} className="ms-3 font-bold">×</button>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center justify-between rounded-xl bg-income-soft px-4 py-3 text-sm font-medium text-income">
              {successMessage}
              <button type="button" onClick={() => setSuccessMessage("")} aria-label={t("common.close")} className="ms-3 font-bold">×</button>
            </div>
          )}
        </div>
      )}

      <TotalsCard className="" title={t("savings.totalSaved")} totals={savedByCurrency} />

      <GoalForm
        show={showForm}
        onClose={() => setShowForm(false)}
        form={form}
        onChange={handleFormChange}
        onSubmit={handleSubmitForm}
        saving={saving}
        isEdit={Boolean(editingGoal)}
      />

      <div className="flex gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === key ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t(`savings.tabs.${key}`)}
          </button>
        ))}
      </div>

      {status === "loading" ? (
        <CardGridSkeleton cards={4} className="grid grid-cols-1 gap-4 sm:grid-cols-2" label={t("savings.loading")} />
      ) : filteredGoals.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-100">
          {t("savings.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              expanded={expandedGoalId === goal._id}
              onToggleExpand={toggleExpand}
              transactions={transactionsByGoal[goal._id]}
              loadingTransactions={expandedGoalId === goal._id && transactionsStatus === "loading"}
              onEdit={openEditForm}
              onDeposit={(g) => openActionModal(g, "deposit")}
              onWithdraw={(g) => openActionModal(g, "withdraw")}
              onComplete={(g) => openPicker(g, "complete")}
              onArchive={(g) => openPicker(g, "archive")}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {actionModal && (
        <GoalActionModal
          goal={actionModal.goal}
          mode={actionModal.mode}
          onClose={() => setActionModal(null)}
          form={actionForm}
          setForm={setActionForm}
          onSubmit={handleSubmitAction}
          saving={actionSaving}
          accounts={activeAccounts}
        />
      )}

      {pickerModal && !pickerModal.noBalance && (
        <AccountPickerModal
          goal={pickerModal.goal}
          action={pickerModal.action}
          onClose={() => setPickerModal(null)}
          accountId={pickerAccountId}
          setAccountId={setPickerAccountId}
          onConfirm={handleConfirmPicker}
          saving={pickerSaving}
          accounts={activeAccounts}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(pickerModal?.noBalance)}
        onClose={() => setPickerModal(null)}
        onConfirm={() => performSimpleDelete(pickerModal.goal)}
        icon={Trash2}
        title={t("savings.deleteAction.title")}
        description={t("savings.deleteAction.confirmNoBalance")}
        cancelLabel={t("savings.cancel")}
        confirmLabel={t("savings.actions.delete")}
        confirmVariant="destructive"
      />
    </div>
  );
}

export default SavingsPage;
