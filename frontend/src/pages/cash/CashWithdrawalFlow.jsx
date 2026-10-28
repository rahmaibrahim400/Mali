import { useState, useMemo, useEffect } from "react";
import {
  Banknote,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Plus,
  X,
  AlertCircle,
  Undo2,
  CheckCircle2,
} from "lucide-react";


const initialAccounts = [
  { id: "acc_nbe", name: "البنك الأهلي", last4: "4821", balance: 24500 },
  { id: "acc_cib", name: "CIB", last4: "1190", balance: 8300 },
  { id: "acc_qnb", name: "QNB", last4: "0075", balance: 1200 },
];

const currency = (n) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(n);

export default function CashWithdrawalFlow() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [cashBalance, setCashBalance] = useState(3150);
  const [history, setHistory] = useState([]);

  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  function handleWithdraw(accountId, amount) {
    const txId = `tx_${Date.now()}`;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - amount } : a
      )
    );
    setCashBalance((prev) => prev + amount);
    setHistory((prev) => [
      {
        id: txId,
        type: "تحويل داخلي",
        accountId,
        accountName: accounts.find((a) => a.id === accountId)?.name,
        amount,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  }

  function handleUndo(tx) {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a
      )
    );
    setCashBalance((prev) => prev - tx.amount);
    setHistory((prev) => prev.filter((h) => h.id !== tx.id));
  }

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif",
        background: "#EFF2EF",
        color: "#1B2430",
        minHeight: "100%",
        position: "relative",
      }}
    >
      <AccountsScreen
        accounts={accounts}
        cashBalance={cashBalance}
        history={history}
        onUndo={handleUndo}
      />

      <FAB onClick={() => setQuickActionsOpen(true)} />

      <QuickActionsSheet
        open={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onPickWithdraw={() => {
          setQuickActionsOpen(false);
          setWithdrawOpen(true);
        }}
      />

      <CashWithdrawalSheet
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        accounts={accounts}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
}


function AccountsScreen({ accounts, cashBalance, history, onUndo }) {
  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "28px 20px 120px" }}>
      <div style={{ fontSize: 13, color: "#8A938C", marginBottom: 4 }}>
        الحسابات
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>
        محفظتي
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <BalanceCard
          icon={<Banknote size={18} />}
          label="رصيد البنوك"
          value={accounts.reduce((s, a) => s + a.balance, 0)}
          tint="#0F6653"
        />
        <BalanceCard
          icon={<Wallet size={18} />}
          label="رصيد الكاش"
          value={cashBalance}
          tint="#C98A2C"
        />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#5B6570", marginBottom: 10 }}>
       
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {accounts.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#FFFFFF",
              border: "1px solid #E3E7E3",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {a.name} <span style={{ color: "#8A938C", fontWeight: 400 }}>•••• {a.last4}</span>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{currency(a.balance)} ج.م</div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#5B6570", marginBottom: 10 }}>
           
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
                  border: "1px solid #E3E7E3",
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {tx.accountName} ← رصيد الكاش
                  </div>
                  <div style={{ fontSize: 12, color: "#8A938C" }}>
                    {tx.type} ·{" "}
                    {tx.timestamp.toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: "#C98A2C" }}>
                    +{currency(tx.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUndo(tx)}
                    title="تراجع"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8A938C",
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
        </>
      )}
    </div>
  );
}

function BalanceCard({ icon, label, value, tint }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#FFFFFF",
        border: "1px solid #E3E7E3",
        borderRadius: 12,
        padding: "14px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: tint, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 12.5, color: "#5B6570" }}>{label}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700 }}>
        {currency(value)} <span style={{ fontSize: 12, fontWeight: 500, color: "#8A938C" }}>ج.م</span>
      </div>
    </div>
  );
}

function FAB({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="إجراء سريع"
      style={{
        position: "absolute",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        width: 56,
        height: 56,
        borderRadius: 999,
        background: "#0F6653",
        color: "#fff",
        border: "none",
        boxShadow: "0 8px 20px rgba(15,102,83,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Plus size={26} />
    </button>
  );
}



function BottomSheet({ open, onClose, children }) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => setMounted(true), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      onClick={onClose}
      onTransitionEnd={() => {
        if (!open) setMounted(false);
      }}
      style={{
        position: "absolute",
        inset: 0,
        background: open ? "rgba(27,36,48,0.42)" : "rgba(27,36,48,0)",
        transition: "background .22s ease",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 30,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          margin: "0 auto",
          background: "#EFF2EF",
          borderRadius: "18px 18px 0 0",
          padding: "10px 20px 26px",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform .26s cubic-bezier(.32,.72,0,1)",
          boxShadow: "0 -8px 30px rgba(27,36,48,0.18)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 999,
            background: "#D8DED9",
            margin: "6px auto 14px",
          }}
        />
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick actions sheet                                                  */
/* ------------------------------------------------------------------ */

function QuickActionsSheet({ open, onClose, onPickWithdraw }) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>إجراء سريع</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ActionRow icon={<Receipt size={18} />} tint="#B23A32" label="تسجيل مصروف" onClick={onClose} />
        <ActionRow icon={<ArrowUpRight size={18} />} tint="#0F6653" label="تسجيل دخل" onClick={onClose} />
        <ActionRow icon={<ArrowDownLeft size={18} />} tint="#C98A2C" label="سحب كاش" onClick={onPickWithdraw} />
      </div>
    </BottomSheet>
  );
}

function ActionRow({ icon, tint, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "13px 14px",
        borderRadius: 10,
        border: "1px solid #E3E7E3",
        background: "#FFFFFF",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${tint}14`,
          color: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{label}</span>
    </button>
  );
}



function CashWithdrawalSheet({ open, onClose, accounts, onWithdraw }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id);
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        setAmount("");
        setConfirmed(null);
        setAccountId(accounts[0]?.id);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [open, accounts]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId]
  );

  const numericAmount = Number(amount);
  const isValidNumber = amount !== "" && !Number.isNaN(numericAmount);

  const liveError = useMemo(() => {
    if (amount === "") return null;
    if (!isValidNumber || numericAmount <= 0) return "اكتب مبلغ أكبر من صفر";
    if (selectedAccount && numericAmount > selectedAccount.balance) {
      return `رصيد ${selectedAccount.name} أقل من المبلغ ده`;
    }
    return null;
  }, [amount, isValidNumber, numericAmount, selectedAccount]);

  function handleSubmit(e) {
    e.preventDefault();
    if (liveError || !isValidNumber) return;
    onWithdraw(accountId, numericAmount);
    setConfirmed({ amount: numericAmount, accountName: selectedAccount.name });
    setAmount("");
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#0F665314",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0F6653",
            }}
          >
            <ArrowDownLeft size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>سحب كاش</div>
            <div style={{ fontSize: 12.5, color: "#5B6570" }}>تحويل من حساب بنكي لرصيد الكاش</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            border: "none",
            background: "#E3E7E3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#5B6570",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {confirmed ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px",
            borderRadius: 10,
            background: "#0F66530F",
            color: "#0F6653",
            fontSize: 14,
            marginBottom: 6,
          }}
        >
          <CheckCircle2 size={17} />
          اتسحب {currency(confirmed.amount)} ج.م من {confirmed.accountName} لرصيد الكاش
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 13, color: "#5B6570", marginBottom: 6 }}>
            اسحب من
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 10,
              border: "1px solid #D8DED9",
              background: "#FBFCFB",
              fontSize: 15,
              marginBottom: 16,
              color: "#1B2430",
              fontFamily: "inherit",
            }}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} •••• {a.last4} — {currency(a.balance)} ج.م
              </option>
            ))}
          </select>

          <label style={{ display: "block", fontSize: 13, color: "#5B6570", marginBottom: 6 }}>
            المبلغ
          </label>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "13px 46px 13px 12px",
                borderRadius: 10,
                border: `1px solid ${liveError ? "#C1544B" : "#D8DED9"}`,
                fontSize: 22,
                fontWeight: 600,
                fontFamily: "inherit",
                boxSizing: "border-box",
                color: "#1B2430",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: "#8A938C",
              }}
            >
              ج.م
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[200, 500, 1000].map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setAmount(String(v))}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid #D8DED9",
                  background: "#F3F5F3",
                  fontSize: 13,
                  color: "#3A4249",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {currency(v)}
              </button>
            ))}
          </div>

          {liveError && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#B23A32", fontSize: 13.5, marginBottom: 14 }}>
              <AlertCircle size={15} />
              {liveError}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValidNumber || !!liveError}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 10,
              border: "none",
              background: !isValidNumber || !!liveError ? "#B7C2BA" : "#0F6653",
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
      )}
    </BottomSheet>
  );
}
 
