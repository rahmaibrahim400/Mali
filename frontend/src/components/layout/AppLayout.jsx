import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight } from "lucide-react";
import Sidebar from "./Sidebar";
import Breadcrumb from "./appLayout/Breadcrumb";
import DateBadge from "./appLayout/DateBadge";
import UserMenu from "./appLayout/UserMenu";
import MobileNav from "./MobileNav";
import QuickAddButton from "./QuickAddButton";
import FloatingChatButton from "../chat/FloatingChatButton";
import useRevealCards from "./appLayout/useRevealCards";
import { ChatUnreadProvider } from "../chat/ChatUnreadContext";
import { fetchMyUnread } from "../../api/chatApi";
import NotificationBell from "../notifications/NotificationBell";
import SidebarUpgradeCard from "./sidebar/SidebarUpgradeCard";
import SubscriptionBanner from "./SubscriptionBanner";
import { fetchMyRenewal } from "../../api/userExtrasApi";
import { SUBSCRIPTION_EXPIRED_EVENT } from "../../api/axiosClient";
import useLocalAlerts from "../notifications/useLocalAlerts";
import { fetchAvatar } from "../../store/slices/authSlice";
import {
  fetchUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
} from "../../api/notificationsApi";

function AppLayout() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const localAlerts = useLocalAlerts(user);

  // The photo isn't part of login / me (it would slow them down): fetch it once the app is open.
  const avatarMissing = Boolean(user) && user.avatar === undefined;
  useEffect(() => {
    if (avatarMissing) dispatch(fetchAvatar());
  }, [avatarMissing, dispatch]);
  const { pathname } = useLocation();
  const pageRef = useRef(null);
  // A new page always opens at the top (SPA navigation would otherwise keep the old scroll position).
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  useRevealCards(pageRef, pathname);

  // The plan and the latest renewal request, for the sidebar card and the expired banner.
  // Re-read on every page change (a request sent from the profile shows up right away) and
  // whenever the server refuses a change because the plan has ended.
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionCheck, setSubscriptionCheck] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetchMyRenewal()
      .then(({ data }) => !cancelled && setSubscriptionInfo(data.data))
      .catch(() => {}); // no card or banner is better than a broken one
    return () => {
      cancelled = true;
    };
  }, [pathname, subscriptionCheck]);
  useEffect(() => {
    const recheck = () => setSubscriptionCheck((value) => value + 1);
    window.addEventListener(SUBSCRIPTION_EXPIRED_EVENT, recheck);
    return () => window.removeEventListener(SUBSCRIPTION_EXPIRED_EVENT, recheck);
  }, []);

  return (
    <ChatUnreadProvider fetchUnread={fetchMyUnread} chatPath="/chat">
    <div className="min-h-screen bg-slate-50">
      {/* Keyboard users can jump past the sidebar and top bar straight to the page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg focus:inset-s-3"
      >
        {t("common.skipToContent")}
      </a>
      <div className="flex">
        <Sidebar subscriptionInfo={subscriptionInfo} />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-[35] flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <Breadcrumb pathname={pathname} t={t} />

            <div className="ms-auto flex items-center gap-2 sm:gap-3">
              <DateBadge />

              <Link
                to="/accounts/transfer"
                className="hidden items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 md:flex"
              >
                <ArrowLeftRight size={16} />
                {t("layout.quickActionLabel")}
              </Link>

              <NotificationBell
                fetchNotifications={fetchUserNotifications}
                markRead={markUserNotificationRead}
                markAllRead={markAllUserNotificationsRead}
                localItems={localAlerts.items}
                markLocalRead={localAlerts.markRead}
              />
              <UserMenu user={user} />
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="px-4 pb-28 pt-5 outline-none sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
            <SubscriptionBanner info={subscriptionInfo} />
            {/* Re-keyed per route so each page plays the enter animation (cards then reveal in sequence). */}
            <div key={pathname} ref={pageRef} className="page-enter">
              <Outlet />
            </div>
          </main>
          <MobileNav moreFooter={(close) => <SidebarUpgradeCard info={subscriptionInfo} variant="sheet" onNavigate={close} />} />
          <QuickAddButton />
          <FloatingChatButton to="/chat" raised />
        </div>
      </div>
    </div>
    </ChatUnreadProvider>
  );
}

export default AppLayout;
