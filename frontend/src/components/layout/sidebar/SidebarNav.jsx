import { NavLink } from "react-router-dom";
import { NAV_ITEMS, isNavItemActive } from "./navItems";
import { useChatUnread } from "../../chat/ChatUnreadContext";


function SidebarNav({ collapsed, pathname, t, items = NAV_ITEMS, isActive: isItemActive = isNavItemActive }) {
  const { count: unread } = useChatUnread();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map(({ to, key, icon: Icon, chat, badge: itemBadge }) => {
        const badge = chat ? unread : itemBadge || 0;
        const isActive = isItemActive(to, pathname);
        return (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? t(key) : undefined}
            className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              collapsed ? "justify-center" : ""
            } ${
              isActive
                ? "bg-brand-600 text-white emerald:bg-brand-500/10 emerald:text-brand-400 emerald:ring-1 emerald:ring-brand-500/30"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 emerald:text-slate-300 emerald:hover:bg-white/5 emerald:hover:text-white"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {!collapsed && t(key)}
            {/* Count: a calm pill — light grey on a normal row, translucent white on the active one. */}
            {badge > 0 &&
              (collapsed ? (
                <span className="absolute top-1.5 inset-e-1.5 h-2.5 w-2.5 rounded-full bg-slate-400 ring-2 ring-white emerald:bg-brand-500 emerald:ring-navy-900" />
              ) : (
                <span className={`tabular-amount ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                } emerald:bg-brand-500 emerald:text-white`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              ))}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default SidebarNav;
