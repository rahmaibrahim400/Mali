import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  UserRound,
  Banknote,
  CreditCard,
  PiggyBank,
  BarChart3,
  MessageCircle,
  Megaphone,
} from "lucide-react";
import usePageTitle from "../usePageTitle";

const BREADCRUMB_ITEMS = [
  { match: "/dashboard", key: "dashboard.title", icon: LayoutDashboard },
  { match: "/accounts/transfer", key: "transfer.title", icon: ArrowLeftRight },
  { match: "/accounts", key: "accounts.title", icon: Wallet },
  { match: "/income", key: "nav.income", icon: TrendingUp },
  { match: "/expenses", key: "nav.expenses", icon: TrendingDown },
  { match: "/cash", key: "nav.cash", icon: Banknote },
  { match: "/debts", key: "nav.debts", icon: CreditCard },
  { match: "/savings", key: "nav.savings", icon: PiggyBank },
  { match: "/reports", key: "nav.reports", icon: BarChart3 },
  { match: "/profile", key: "profile.title", icon: UserRound },
  { match: "/chat", key: "nav.chat", icon: MessageCircle },
  { match: "/announcements", key: "announcements.title", icon: Megaphone },
];

function getBreadcrumb(pathname) {
  return BREADCRUMB_ITEMS.find((item) => pathname.startsWith(item.match)) || BREADCRUMB_ITEMS[0];
}

function Breadcrumb({ pathname, t }) {
  const breadcrumb = getBreadcrumb(pathname);
  const Icon = breadcrumb.icon;
  usePageTitle(t(breadcrumb.key));

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900">
      <Icon size={16} className="shrink-0 text-slate-400" />
      <span className="truncate">{t(breadcrumb.key)}</span>
    </div>
  );
}

export default Breadcrumb;
