import { useState, useMemo } from "react";
import { Banknote, Wallet, ArrowDownLeft, AlertCircle, Undo2, CheckCircle2 } from "lucide-react";


const initialAccounts = [
  { id: "acc_nbe", name: "البنك الأهلي", last4: "4821", balance: 24500 },
  { id: "acc_cib", name: "CIB", last4: "1190", balance: 8300 },
  { id: "acc_qnb", name: "QNB", last4: "0075", balance: 1200 },
];

const currency = (n) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n);

export default function CashWithdrawal() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [cashBalance, setCashBalance] = useState(3150);
  const [history, setHistory] = useState([]); // shared internal-transfer log
  const [accountId, setAccountId] = useState(initialAccounts[0].id);
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId]
  );

  const numericAmount = Number(amount);
  const isValidNumber = amount !== "" && !Number.isNaN(numericAmount);

  function validate() {
    if (!isValidNumber || numericAmount <= 0) {
      return "اكتب مبلغ أكبر من صفر";
    }
    if (selectedAccount && numericAmount > selectedAccount.balance) {
      return `رصيد ${selectedAccount.name} أقل من المبلغ ده`;
    }
    return null;
  }

  const liveError = amount !== "" ? validate() : null;

  function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      return;
    }

    const txId = `tx_${Date.now()}`;
    const timestamp = new Date();

    // Atomic in the sense that both sides update from one user action.
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - numericAmount } : a
      )
    );
    setCashBalance((prev) => prev + numericAmount);
    setHistory((prev) => [
      {
        id: txId,
        type: "تحويل داخلي",
        accountId,
        accountName: selectedAccount.name,
        amount: numericAmount,
        timestamp,
      },
      ...prev,
    ]);

    setConfirmed({ amount: numericAmount, accountName: selectedAccount.name });
    setAmount("");

    // In a real integration:
    // onWithdraw(accountId, numericAmount)
  }

  function handleUndo(tx) {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a
      )
    );
    setCashBalance((prev) => prev - tx.amount);
    setHistory((prev) => prev.filter((h) => h.id !== tx.id));
    if (confirmed && confirmed.amount === tx.amount) setConfirmed(null);

    // In a real integration:
    // onUndo(tx.id)
  }

  return (
    <div
      dir="rtl"
      style={{
        fontFamily:
          "'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif",
        background: "#F1F5F9",
        color: "#0F172A",
        minHeight: "100%",
        padding: "28px 20px",
      }}
    >
      <style>{`
        .cw-input:focus-visible, .cw-select:focus-visible, .cw-btn:focus-visible {
          outline: 2px solid #059669;
          outline-offset: 2px;
        }
        .cw-chip:hover { background: #E2E8F0; }
        @media (prefers-reduced-motion: no-preference) {
          .cw-toast { animation: cw-rise .28s ease-out; }
          @keyframes cw-rise {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* Balances */}
        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          <BalanceCard
            icon={<Banknote size={18} />}
            label="رصيد البنوك"
            value={accounts.reduce((s, a) => s + a.balance, 0)}
            tint="#059669"
          />
          <BalanceCard
            icon={<Wallet size={18} />}
            label="رصيد الكاش"
            value={cashBalance}
            tint="#4F46E5"
          />
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "22px 20px",
            boxShadow: "0 1px 0 rgba(27,36,48,0.06)",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "#05966914",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
                flexShrink: 0,
              }}
            >
              <ArrowDownLeft size={18} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>سحب كاش</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                تحويل من حساب بنكي لرصيد الكاش
              </div>
            </div>
          </div>

          <label
            style={{
              display: "block",
              fontSize: 13,
              color: "#64748B",
              marginBottom: 6,
            }}
          >
            اسحب من
          </label>
          <select
            className="cw-select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              fontSize: 15,
              marginBottom: 16,
              color: "#0F172A",
              fontFamily: "inherit",
            }}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} •••• {a.last4} — {currency(a.balance)} ج.م
              </option>
            ))}
          </select>

          <label
            style={{
              display: "block",
              fontSize: 13,
              color: "#64748B",
              marginBottom: 6,
            }}
          >
            المبلغ
          </label>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              className="cw-input"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setConfirmed(null);
              }}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "13px 46px 13px 12px",
                borderRadius: 10,
                border: `1px solid ${liveError ? "#DC2626" : "#E2E8F0"}`,
                fontSize: 22,
                fontWeight: 600,
                fontFamily: "inherit",
                boxSizing: "border-box",
                color: "#0F172A",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: "#94A3B8",
              }}
            >
              ج.م
            </span>
          </div>

          {/* Quick amount chips */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[200, 500, 1000].map((v) => (
              <button
                type="button"
                key={v}
                className="cw-chip"
                onClick={() => {
                  setAmount(String(v));
                  setConfirmed(null);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid #E2E8F0",
                  background: "#F1F5F9",
                  fontSize: 13,
                  color: "#1E2A38",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {currency(v)}
              </button>
            ))}
          </div>

          {liveError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#DC2626",
                fontSize: 13.5,
                marginBottom: 14,
              }}
            >
              <AlertCircle size={15} />
              {liveError}
            </div>
          )}

          <button
            type="submit"
            className="cw-btn"
            disabled={!isValidNumber || !!liveError}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 10,
              border: "none",
              background:
                !isValidNumber || !!liveError ? "#B7C2BA" : "#059669",
              color: "#FFFFFF",
              fontSize: 15.5,
              fontWeight: 700,
              cursor: !isValidNumber || !!liveError ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            تنفيذ السحب
          </button>
        </form>

        {/* Confirmation */}
        {confirmed && (
          <div
            className="cw-toast"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#0596690F",
              color: "#059669",
              fontSize: 14,
            }}
          >
            <CheckCircle2 size={17} />
            اتسحب {currency(confirmed.amount)} ج.م من {confirmed.accountName}{" "}
            لرصيد الكاش
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <div
              style={{
                fontSize: 13,
                color: "#64748B",
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              عمليات التحويل الداخلي
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {tx.accountName} ← رصيد الكاش
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>
                      {tx.type} ·{" "}
                      {tx.timestamp.toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: "#4F46E5",
                      }}
                    >
                      +{currency(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUndo(tx)}
                      title="تراجع"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94A3B8",
                        cursor: "pointer",
                        display: "flex",
                      }}
                    >
                      <Undo2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BalanceCard({ icon, label, value, tint }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "14px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: tint,
          marginBottom: 6,
        }}
      >
        {icon}
        <span style={{ fontSize: 12.5, color: "#64748B" }}>{label}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700 }}>
        {currency(value)} <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>ج.م</span>
      </div>
    </div>
  );
}
