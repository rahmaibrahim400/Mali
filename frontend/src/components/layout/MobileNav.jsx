import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, MOBILE_PRIMARY_PATHS, isNavItemActive } from "./sidebar/navItems";
import { useChatUnread } from "../chat/ChatUnreadContext";

const SHORT_LABEL_KEYS = {
  "dashboard.title": "layout.mobileNav.home",
  "accounts.title": "layout.mobileNav.accounts",
};

const PRIMARY_ITEMS = NAV_ITEMS.filter((item) => MOBILE_PRIMARY_PATHS.includes(item.to));
const MORE_ITEMS = NAV_ITEMS.filter((item) => !MOBILE_PRIMARY_PATHS.includes(item.to));

const ANIMATION_MS = 220;

/*
  Phones and tablets: the main sections in a bottom bar, the rest in a "More" drawer.
  Defaults are the user app's sections; the admin panel passes its own (same look and behavior).
  - shortLabel(item): the bar's label; badgeFor(item): a count shown on that section.
  - moreFooter(close): optional content under the drawer's links (gets the close function).
*/
function MobileNav({
  primaryItems = PRIMARY_ITEMS,
  moreItems = MORE_ITEMS,
  isActive = isNavItemActive,
  shortLabel,
  badgeFor,
  moreLabelKey = "layout.mobileNav.more",
  navLabelKey = "layout.primaryNav",
  moreFooter,
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const moreActive = moreItems.some(({ to }) => isActive(to, pathname));
  const { count: unread } = useChatUnread();
  const labelFor = shortLabel || ((item) => t(SHORT_LABEL_KEYS[item.key] || item.key));
  const countFor = badgeFor || ((item) => (item.chat ? unread : item.badge || 0));
  const moreHasBadge = moreItems.some((item) => countFor(item) > 0);

  function openMore() {
    setMounted(true);
    setMoreOpen(true);
  }

  function closeMore() {
    setVisible(false);
    setMoreOpen(false);
  }

  // Flip `visible` a frame after mounting so the enter transition actually animates.
  useEffect(() => {
    if (!moreOpen) return undefined;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [moreOpen]);

  // Keep it mounted until the exit transition finishes so it slides out instead of vanishing.
  useEffect(() => {
    if (moreOpen || !mounted) return undefined;
    const timeout = setTimeout(() => setMounted(false), ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [moreOpen, mounted]);

  // The sheet closes when a link in it is chosen (see NavLink onClick) and on Escape.
  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && closeMore();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const tabClass = (active) =>
    `flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition-colors ${
      active
        ? "text-brand-700 emerald:text-brand-400"
        : "text-slate-400 hover:text-slate-600 emerald:text-slate-400 emerald:hover:text-white"
    }`;
  const iconWrap = (active) =>
    `flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-brand-100 emerald:bg-brand-500/15" : ""}`;

  return (
    <>
      {mounted && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={closeMore}>
          <div
            className={`absolute inset-0 bg-slate-900/40 transition-opacity ease-out ${
              visible ? "opacity-100 duration-200" : "opacity-0 duration-150"
            }`}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t(moreLabelKey)}
            onClick={(event) => event.stopPropagation()}
            className={`absolute inset-y-0 inset-e-0 flex w-64 max-w-[72vw] flex-col bg-white px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-2xl transition-transform ease-out ${
              visible ? "translate-x-0 duration-200" : "translate-x-full rtl:-translate-x-full duration-150"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{t(moreLabelKey)}</h2>
              <button
                type="button"
                onClick={closeMore}
                aria-label={t("common.close")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {moreItems.map((item) => {
                const { to, key, icon: Icon } = item;
                const active = isActive(to, pathname);
                const badge = countFor(item);
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={closeMore}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-2.5 text-start text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                        active
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={19} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                      <span>{t(key)}</span>
                      {badge > 0 && (
                        <span className={`tabular-amount ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none ${
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        } emerald:bg-brand-500 emerald:text-white`}>
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
            {moreFooter && <div className="pt-3">{moreFooter(closeMore)}</div>}
          </div>
        </div>
      )}

      <nav
        aria-label={t(navLabelKey)}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur emerald:border-white/10 emerald:bg-navy-900/95 lg:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {primaryItems.map((item) => {
            const { to, icon: Icon } = item;
            const active = isActive(to, pathname);
            const badge = countFor(item);
            return (
              <li key={to}>
                <NavLink to={to} className={tabClass(active)} aria-current={active ? "page" : undefined}>
                  <span className={`relative ${iconWrap(active)}`}>
                    <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                    {badge > 0 && (
                      <span className="tabular-amount absolute -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white inset-e-1 emerald:ring-navy-900">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate">{labelFor(item)}</span>
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => (moreOpen ? closeMore() : openMore())}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              className={`w-full ${tabClass(moreActive || moreOpen)}`}
            >
              <span className={`relative ${iconWrap(moreActive || moreOpen)}`}>
                <Menu size={19} strokeWidth={moreActive || moreOpen ? 2.4 : 2} />
                {moreHasBadge && (
                  <span className="absolute top-0 inset-e-2 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white emerald:ring-navy-900" />
                )}
              </span>
              <span className="max-w-full truncate">{t(moreLabelKey)}</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default MobileNav;
