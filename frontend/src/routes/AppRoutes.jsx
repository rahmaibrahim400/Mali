import { Navigate, Route, Routes } from "react-router-dom";
import RegisterPage from "../pages/auth/RegisterPage";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import TransferPage from "../pages/accounts/TransferPage";
import AccountsPage from "../pages/accounts/AccountsPage";
import AccountHistoryPage from "../pages/accounts/AccountHistoryPage";
import IncomePage from "../pages/income/IncomePage";
import ExpensesPage from "../pages/expenses/ExpensesPage";
import CashPage from "../pages/cash/CashPage";
import CashExpensesPage from "../pages/cash/CashExpensesPage";
import DebtsPage from "../pages/debts/DebtsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import SavingsPage from "../pages/savings/SavingsPage";
import ReportsPage from "../pages/reports/ReportsPage";
import AdminHomePage from "../pages/admin/AdminHomePage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAuditLogPage from "../pages/admin/AdminAuditLogPage";
import AdminChatPage from "../pages/admin/AdminChatPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import AdminAnnouncementsPage from "../pages/admin/AdminAnnouncementsPage";
import AdminRenewalsPage from "../pages/admin/AdminRenewalsPage";
import AdminUserProfilePage from "../pages/admin/AdminUserProfilePage";
import AdminRevenuePage from "../pages/admin/AdminRevenuePage";
import AnnouncementsPage from "../pages/announcements/AnnouncementsPage";
import ChatPage from "../pages/chat/ChatPage";
import AdminProtectedRoute from "./AdminProtectedRoute";
import AdminLayout from "../components/layout/AdminLayout";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Admin — separate token + guard from the regular user area */}
      <Route path="/admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:userId" element={<AdminUserProfilePage />} />
          <Route path="renewals" element={<AdminRenewalsPage />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="revenue" element={<AdminRevenuePage />} />
          <Route path="logs" element={<AdminAuditLogPage />} />
          <Route path="chat" element={<AdminChatPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/:accountId/transactions" element={<AccountHistoryPage />} />
          <Route path="/accounts/transfer" element={<TransferPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          {/* The categories page was removed; old links land on Expenses. */}
          <Route path="/categories" element={<Navigate to="/expenses" replace />} />
          <Route path="/cash" element={<CashPage />} />
          <Route path="/cash/expenses" element={<CashExpensesPage />} />
          <Route path="/debts" element={<DebtsPage />} />
          <Route path="/savings" element={<SavingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}

export default AppRoutes;
