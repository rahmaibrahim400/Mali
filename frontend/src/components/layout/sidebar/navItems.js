import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  ReceiptText,
  WalletCards,
  Goal,
  BarChart3,
  Settings,
  MessageCircle,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/dashboard", key: "dashboard.title", icon: LayoutDashboard },
  { to: "/income", key: "nav.income", icon: TrendingUp },
  { to: "/expenses", key: "nav.expenses", icon: TrendingDown },
  { to: "/accounts", key: "accounts.title", icon: Wallet },
  { to: "/cash", key: "nav.cash", icon: WalletCards },
  { to: "/debts", key: "nav.debts", icon: ReceiptText },
  { to: "/savings", key: "nav.savings", icon: Goal },
  { to: "/reports", key: "nav.reports", icon: BarChart3 },
  { to: "/chat", key: "nav.chat", icon: MessageCircle, chat: true },
  { to: "/profile", key: "nav.settings", icon: Settings },
];

// Bottom bar on phones: at most 4 destinations + "More" (the rest open in a sheet).
export const MOBILE_PRIMARY_PATHS = ["/dashboard", "/income", "/expenses", "/accounts"];

export function isNavItemActive(to, pathname) {
  if (to === "/accounts") {
    return pathname === "/accounts" || (pathname.startsWith("/accounts/") && !pathname.startsWith("/accounts/transfer"));
  }
  if (to === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(to);
}
