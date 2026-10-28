import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearIncomeCreateState,
  clearIncomeUpdateError,
  createIncomeEntry,
  deleteIncome,
  fetchIncomeSummary,
  fetchIncomes,
  updateIncomeEntry,
} from "../../store/slices/incomeSlice";
import { EMPTY_FORM, getCurrentMonth, getTodayString } from "./constants";
import { getAccounts } from "../../api/accountsApi";
import { convertAmount } from "../../utils/currencyConverter";
import IncomeHeader from "./components/IncomeHeader";
import IncomeTotalCard from "./components/IncomeTotalCard";
import IncomeAlerts from "./components/IncomeAlerts";
import IncomeForm from "./components/IncomeForm";
import IncomeSummaryFilter from "./components/IncomeSummaryFilter";
import IncomeList from "./components/IncomeList";
import EditIncomeModal from "./components/EditIncomeModal";
import SuccessToast from "../../components/common/SuccessToast";

const getEmptyCreateForm = () => ({
  name: "",
  category: "",
  amount: "",
  currency: "EGP",
  receivedDate: getTodayString(),
  recurrence: "once",
  accountId: "",
  notes: "",
});

function IncomePage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const {
    items,
    status,
    error,
    createStatus,
    createError,
    updateStatus,
    updateError,
    summary,
    summaryStatus,
    summaryError,
  } = useSelector((state) => state.incomes);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [successMessage, setSuccessMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const closeToast = useCallback(() => setToastMessage(""), []);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [summaryCurrency, setSummaryCurrency] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(getEmptyCreateForm);

  const [availableAccounts, setAvailableAccounts] = useState([]);

  // Fetch all incomes
  useEffect(() => {
    dispatch(fetchIncomes());
  }, [dispatch]);

  // Fetch accounts so income can optionally credit one of them
  const loadAccounts = () => {
    getAccounts()
      .then((res) => {
        const accs = res.data?.data || res.data || [];
        setAvailableAccounts(
          Array.isArray(accs) ? accs.filter((acc) => !acc.isArchived && acc.isActive !== false) : []
        );
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Fetch monthly income summary — always request ALL currencies so we can
  // convert on the client side when the user picks a specific display currency.
  useEffect(() => {
    const [year, month] = selectedMonth.split("-").map(Number);

    dispatch(
      fetchIncomeSummary({
        year,
        month: month - 1,
        currency: "ALL",
      })
    );
  }, [dispatch, selectedMonth]);

  // Clear update error after 3 seconds
  useEffect(() => {
    if (!updateError) return;

    const timer = setTimeout(() => {
      dispatch(clearIncomeUpdateError());
    }, 3000);

    return () => clearTimeout(timer);
  }, [updateError, dispatch]);

  // Clear create state after 3 seconds
  useEffect(() => {
    if (createStatus !== "succeeded") return;

    const timer = setTimeout(() => {
      dispatch(clearIncomeCreateState());
    }, 3000);

    return () => clearTimeout(timer);
  }, [createStatus, dispatch]);

  const rawItems = summary?.items || items;
  const rawTotalsByCurrency = summary?.totalsByCurrency || {};

  // Derive display data based on the selected currency filter.
  // When "ALL" → show each currency separately (no conversion).
  // When a specific currency → convert every item to that currency.
  const { summaryItems, displayedTotal, totalsByCurrency } = useMemo(() => {
    if (summaryCurrency === "ALL") {
      return {
        summaryItems: rawItems,
        displayedTotal: null,
        totalsByCurrency: rawTotalsByCurrency,
      };
    }

    const converted = rawItems.map((inc) => {
      const originalCurrency = inc.currency || "EGP";
      const monthlyAmt = inc.monthlyAmount ?? inc.amount ?? 0;
      const convertedAmt = convertAmount(monthlyAmt, originalCurrency, summaryCurrency);

      return {
        ...inc,
        monthlyAmount: convertedAmt,
        convertedAmount: convertedAmt,
      };
    });

    const total = converted.reduce(
      (sum, inc) => sum + (inc.convertedAmount ?? 0),
      0
    );

    return {
      summaryItems: converted,
      displayedTotal: Math.round(total * 100) / 100,
      totalsByCurrency: { [summaryCurrency]: Math.round(total * 100) / 100 },
    };
  }, [rawItems, rawTotalsByCurrency, summaryCurrency]);

  // Refresh summary after create/update/delete
  const refreshSummary = () => {
    const [year, month] = selectedMonth.split("-").map(Number);

    dispatch(
      fetchIncomeSummary({
        year,
        month: month - 1,
        currency: "ALL",
      })
    );
  };

  // Open edit modal
  const openEditModal = (income) => {
    setSelectedId(income._id);

    setForm({
      name: income.name || "",
      category: income.category || "salary",
      amount: income.amount ?? "",
      currency: income.currency || "EGP",
      receivedDate: income.receivedDate
        ? new Date(income.receivedDate).toISOString().slice(0, 10)
        : getTodayString(),
      recurrence: income.recurrence || "once",
      status: income.status || "cleared",
      accountId: income.account?._id || income.account || "",
      notes: income.notes || "",
    });

    setIsEditing(true);
    setSuccessMessage("");
  };

  // Close edit modal
  const closeEditModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  // Edit form change
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create form change
  const handleCreateChange = (event) => {
    const { name, value } = event.target;

    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create income
  const handleCreateSubmit = async (event) => {
    event.preventDefault();

    const result = await dispatch(
      createIncomeEntry({
        ...createForm,
        name: createForm.name.trim(),
        amount: Number(createForm.amount),
        notes: createForm.notes.trim(),
      })
    );

    if (createIncomeEntry.fulfilled.match(result)) {
      setCreateForm(getEmptyCreateForm());
      setIsCreateOpen(false);
      setToastMessage(t("income.success"));

      dispatch(fetchIncomes());
      refreshSummary();
      loadAccounts();
    }
  };

  // Show the add form
  const openCreateForm = () => {
    setSuccessMessage("");
    setIsCreateOpen(true);
  };

  // Cancel: hide the add form and discard what was typed
  const closeCreateForm = () => {
    setIsCreateOpen(false);
    setCreateForm(getEmptyCreateForm());
    dispatch(clearIncomeCreateState());
  };

  // Update income
  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      category: form.category,
      amount: Number(form.amount),
      currency: form.currency,
      receivedDate: form.receivedDate,
      recurrence: form.recurrence,
      status: form.status,
      accountId: form.accountId || null,
      notes: form.notes.trim(),
    };

    const result = await dispatch(
      updateIncomeEntry({
        id: selectedId,
        payload,
      })
    );

    if (updateIncomeEntry.fulfilled.match(result)) {
      setSuccessMessage(t("income.updateSuccess"));

      closeEditModal();

      dispatch(fetchIncomes());
      refreshSummary();
      loadAccounts();
    }
  };

  // Delete income
  const handleDeleteIncome = async (id) => {
    await dispatch(deleteIncome(id)).unwrap();

    dispatch(fetchIncomes());
    refreshSummary();
    loadAccounts();
  };


  // Phones: this button sits under the total card; from sm it lives in the page header.
  const addIncomeButton = (extraClass) =>
    !isCreateOpen && (
      <button
        type="button"
        onClick={openCreateForm}
        className={`min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 ${extraClass}`}
      >
        <Plus size={18} strokeWidth={2.5} />
        {t("income.formTitle")}
      </button>
    );

  return (
    <div className="mx-auto max-w-6xl">
      <IncomeHeader actions={addIncomeButton("hidden sm:inline-flex sm:w-auto")} />

      <IncomeTotalCard
        displayedTotal={displayedTotal}
        totalsByCurrency={totalsByCurrency}
        summaryCurrency={summaryCurrency}
        summaryStatus={summaryStatus}
        summaryError={summaryError}
      />
      {addIncomeButton("mt-4 inline-flex sm:hidden")}

      <IncomeAlerts error={error} updateError={updateError} successMessage={successMessage} />

      {isCreateOpen && (
        <IncomeForm
          form={createForm}
          createStatus={createStatus}
          createError={createError}
          onChange={handleCreateChange}
          onSubmit={handleCreateSubmit}
          onCancel={closeCreateForm}
          t={t}
        />
      )}


      <IncomeSummaryFilter
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        summaryCurrency={summaryCurrency}
        setSummaryCurrency={setSummaryCurrency}
      />

      <IncomeList
        items={summaryItems}
        status={summary ? summaryStatus : status}
        error={error}
        displayCurrency={summaryCurrency}
        totalAmount={displayedTotal}
        totalsByCurrency={totalsByCurrency}
        onEdit={openEditModal}
        onDeleted={handleDeleteIncome}
        onToggled={refreshSummary}
        t={t}
      />


      <SuccessToast message={toastMessage} onClose={closeToast} />

      <EditIncomeModal
        isEditing={isEditing}
        closeEditModal={closeEditModal}
        handleSubmit={handleSubmit}
        form={form}
        handleFormChange={handleFormChange}
        updateStatus={updateStatus}
        availableAccounts={availableAccounts}
      />
    </div>
  );
}

export default IncomePage;
