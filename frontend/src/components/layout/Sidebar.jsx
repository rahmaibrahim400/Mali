import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { logout } from "../../store/slices/authSlice";
import ConfirmModal from "../common/ConfirmModal";
import SidebarHeader from "./sidebar/SidebarHeader";
import SidebarNav from "./sidebar/SidebarNav";
import SidebarUpgradeCard from "./sidebar/SidebarUpgradeCard";
import SidebarUserSection from "./sidebar/SidebarUserSection";

// Shared by the user app and the admin panel; the admin passes its own items, account and logout.
function Sidebar({ navItems, isItemActive, account, profileTo, tagline, onLogout, subscriptionInfo }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: authUser } = useSelector((state) => state.auth);
  const user = account ?? authUser;
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const handleConfirmLogout = () => {
    if (onLogout) onLogout();
    else dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto border-e border-slate-200 bg-white transition-all duration-200 lg:flex emerald:border-e-0 emerald:bg-navy-900 emerald:text-slate-300 ${
        collapsed ? "w-20 xl:w-24" : "w-56 xl:w-64"
      }`}
    >
      <SidebarHeader collapsed={collapsed} onToggleCollapsed={() => setCollapsed((prev) => !prev)} t={t} tagline={tagline} />

      <div className="border-t border-slate-100 emerald:border-white/10" />

      <SidebarNav collapsed={collapsed} pathname={pathname} t={t} items={navItems} isActive={isItemActive} />

      <div className="p-3">
        {/* User app only (the admin panel passes its own account). */}
        {!account && <SidebarUpgradeCard info={subscriptionInfo} collapsed={collapsed} />}
        <SidebarUserSection
          collapsed={collapsed}
          user={user}
          profileTo={profileTo}
          onLogoutClick={() => setConfirmingLogout(true)}
          t={t}
        />
      </div>

      <ConfirmModal
        isOpen={confirmingLogout}
        onClose={() => setConfirmingLogout(false)}
        onConfirm={handleConfirmLogout}
        confirmVariant="destructive"
        title={t("layout.logoutConfirmTitle")}
        description={t("layout.logoutConfirmMessage")}
        cancelLabel={t("layout.cancel")}
        confirmLabel={t("layout.logout")}
      />
    </aside>
  );
}

export default Sidebar;
