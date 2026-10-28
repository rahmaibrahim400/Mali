import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessagesSquare,
  Settings,
  Users,
} from "lucide-react";
import { adminLogout, fetchAdminAvatar } from "../../store/slices/adminAuthSlice";
import Sidebar from "./Sidebar";
import { ChatUnreadProvider, useChatUnread } from "../chat/ChatUnreadContext";
import { fetchAdminUnread } from "../../api/chatApi";
import { fetchRenewals } from "../../api/adminExtrasApi";
import usePolling from "../chat/usePolling";
import NotificationBell from "../notifications/NotificationBell";
import useLocalAlerts from "../notifications/useLocalAlerts";
import FloatingChatButton from "../chat/FloatingChatButton";
import MobileNav from "./MobileNav";
import usePageTitle from "./usePageTitle";
import useRevealCards from "./appLayout/useRevealCards";
import {
  fetchAdminNotifications,
  markAllAdminNotificationsRead,
  markAdminNotificationRead,
} from "../../api/notificationsApi";

const ADMIN_NAV_ITEMS = [
  { to: "/admin", key: "admin.layout.home", short: "admin.layout.short.home", icon: LayoutDashboard, primary: true },
  { to: "/admin/users", key: "admin.layout.users", short: "admin.layout.short.users", icon: Users, primary: true },
  { to: "/admin/renewals", key: "admin.layout.renewals", short: "admin.layout.short.renewals", icon: ClipboardCheck, renewals: true, primary: true },
  { to: "/admin/chat", key: "admin.layout.chat", short: "admin.layout.short.chat", icon: MessagesSquare, chat: true, primary: true },
  { to: "/admin/announcements", key: "admin.layout.announcements", short: "admin.layout.short.announcements", icon: Megaphone },
  { to: "/admin/revenue", key: "admin.layout.revenue", short: "admin.layout.short.revenue", icon: BarChart3 },
  { to: "/admin/logs", key: "admin.layout.auditLogs", short: "admin.layout.short.logs", icon: ClipboardList },
  { to: "/admin/settings", key: "admin.layout.settings", short: "admin.layout.short.settings", icon: Settings },
];
const RENEWALS_POLL_MS = 60000;

function isAdminItemActive(to, pathname) {
  return to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);
}

function AdminShell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { admin } = useSelector((state) => state.adminAuth);
  // Things the admin just did (e.g. a renewal approved), kept in this browser for the bell.
  const localAlerts = useLocalAlerts(admin);

  // The photo isn't part of login / me (it would slow them down): fetch it once the panel is open.
  const avatarMissing = Boolean(admin) && admin.avatar === undefined;
  useEffect(() => {
    if (avatarMissing) dispatch(fetchAdminAvatar());
  }, [avatarMissing, dispatch]);
  const { count: unread } = useChatUnread();
  const [pendingRenewals, setPendingRenewals] = useState(0);
  const currentItem = ADMIN_NAV_ITEMS.find(({ to }) => isAdminItemActive(to, pathname));
  usePageTitle(currentItem ? t(currentItem.key) : t("admin.layout.title"));
  const pageRef = useRef(null);
  // Each page opens at the top and plays the same entrance as the user app.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  useRevealCards(pageRef, pathname);

  // Pending renewal requests, for the badge on that section.
  const loadRenewals = useCallback(async () => {
    try {
      const { data } = await fetchRenewals({ status: "pending" });
      setPendingRenewals(data.pendingCount || 0);
    } catch {
      // keep the last count
    }
  }, []);
  usePolling(loadRenewals, RENEWALS_POLL_MS, true, pathname === "/admin/renewals" ? pathname : "");

  const navItems = ADMIN_NAV_ITEMS.map((item) => (item.renewals ? { ...item, badge: pendingRenewals } : item));
  const badgeFor = (item) => (item.chat ? unread : item.badge || 0);

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Keyboard users can jump past the sidebar and top bar straight to the page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg focus:inset-s-3"
      >
        {t("common.skipToContent")}
      </a>
      <div className="flex">
        <Sidebar
          navItems={navItems}
          isItemActive={isAdminItemActive}
          account={admin}
          profileTo={null}
          tagline={t("admin.layout.title")}
          onLogout={() => dispatch(adminLogout())}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-[35] flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <h1 className="min-w-0 truncate text-base font-bold text-slate-900">
              {currentItem ? t(currentItem.key) : t("admin.layout.title")}
            </h1>
            <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell
                fetchNotifications={fetchAdminNotifications}
                markRead={markAdminNotificationRead}
                markAllRead={markAllAdminNotificationsRead}
                localItems={localAlerts.items}
                markLocalRead={localAlerts.markRead}
              />
              <Link
                to="/admin/settings"
                title={admin?.name || admin?.email}
                aria-label={t("admin.layout.settings")}
                className="block rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                {admin?.avatar ? (
                  <img src={admin.avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {(admin?.name || admin?.email || "?").trim()[0]?.toUpperCase()}
                  </span>
                )}
              </Link>
              {/* Language lives in Settings. The sidebar (with its logout) is hidden below lg. */}
              <button
                type="button"
                onClick={() => {
                  dispatch(adminLogout());
                  navigate("/login", { replace: true });
                }}
                aria-label={t("admin.layout.logout")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-expense transition hover:bg-expense-soft lg:hidden"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="px-4 pt-5 pb-28 outline-none sm:px-6 sm:pt-6 lg:px-8 lg:pb-8">
            {/* Re-keyed per route so each page plays the enter animation (cards then reveal in sequence). */}
            <div key={pathname} ref={pageRef} className="page-enter">
              <Outlet />
            </div>
          </main>
          <FloatingChatButton to="/admin/chat" />

          {/* Phones and tablets: the same bottom bar and "More" drawer as the user app. */}
          <MobileNav
            primaryItems={navItems.filter((item) => item.primary)}
            moreItems={navItems.filter((item) => !item.primary)}
            isActive={isAdminItemActive}
            shortLabel={(item) => t(item.short)}
            badgeFor={badgeFor}
            moreLabelKey="admin.layout.more"
            navLabelKey="admin.layout.navigation"
          />
        </div>
      </div>
    </div>
  );
}

function AdminLayout() {
  return (
    <ChatUnreadProvider fetchUnread={fetchAdminUnread} chatPath="/admin/chat">
      <AdminShell />
    </ChatUnreadProvider>
  );
}

export default AdminLayout;
