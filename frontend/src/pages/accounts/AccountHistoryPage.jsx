import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAccountTransactions } from "../../api/accountsApi";
import { extractError } from "../../utils/errorHandler";
import { formatDateTime } from "../../utils/formatAmount";
import TransactionFilters from "./components/TransactionFilters";
import TransactionList from "./components/TransactionList";
import PageHeader from "../../components/common/PageHeader";

function AccountHistoryPage() {
  const { t } = useTranslation();
  const { accountId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [accountName, setAccountName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const loadTransactions = async (filters = { start, end }) => {
    setStatus("loading");
    setError(null);
    try {
      const response = await getAccountTransactions(accountId, {
        start: filters.start || undefined,
        end: filters.end ? `${filters.end}T23:59:59.999` : undefined,
      });
      const data = response.data.data || [];
      setTransactions([...data].sort((a, b) => new Date(b.date) - new Date(a.date)));
      if (data[0]?.account?.name) setAccountName(data[0].account.name);
      setStatus("succeeded");
    } catch (requestError) {
      setError(extractError(requestError, t("accounts.transactions.error")));
      setStatus("failed");
    }
  };

  useEffect(() => {
    const loadInitialTransactions = async () => {
      await loadTransactions({ start: "", end: "" });
    };

    loadInitialTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        backTo="/accounts"
        backLabel={t("accounts.transactions.back")}
        title={t("accounts.historyTitle", { name: accountName || "..." })}
      />

      <TransactionFilters start={start} end={end} onStartChange={setStart} onEndChange={setEnd} onSubmit={(event) => { event.preventDefault(); loadTransactions(); }} t={t} />
      <TransactionList transactions={transactions} status={status} error={error} formatDate={formatDateTime} t={t} />
    </div>
  );
}

export default AccountHistoryPage;
