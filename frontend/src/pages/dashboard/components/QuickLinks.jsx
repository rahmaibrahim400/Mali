import { Link } from "react-router-dom";
import { Wallet, ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";

const QUICK_LINKS = [
  { to: "/income", key: "nav.income", icon: TrendingUp, tone: "bg-income-soft text-income" },
  { to: "/expenses", key: "nav.expenses", icon: TrendingDown, tone: "bg-expense-soft text-expense" },
  { to: "/accounts", key: "dashboard.accountsLink", icon: Wallet, tone: "bg-brand-50 text-brand-600" },
  { to: "/accounts/transfer", key: "dashboard.transferLink", icon: ArrowLeftRight, tone: "bg-brand-50 text-brand-600" },
];

function QuickLinks({ t }) {
  return (
    <div data-reveal-stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {QUICK_LINKS.map(({ to, key, icon: Icon, tone }) => (
        <Link
          key={to}
          to={to}
          className="group flex min-h-24 flex-col justify-between gap-3 rounded-2xl lg:min-h-0 lg:flex-row lg:items-center lg:justify-start bg-white p-4 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300"
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
            <Icon size={19} strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold leading-snug text-slate-800">{t(key)}</span>
        </Link>
      ))}
    </div>
  );
}

export default QuickLinks;
