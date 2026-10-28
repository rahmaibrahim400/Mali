import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";

function SidebarUserSection({ collapsed, user, onLogoutClick, t, profileTo = "/profile" }) {
  const displayName = user?.name || user?.email;
  const initial = displayName?.trim()?.[0]?.toUpperCase() || "?";
  // Without a profile page (admin) the user block is shown but not clickable.
  const UserBlock = profileTo ? Link : "div";

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 emerald:border-white/10">
      {!collapsed ? (
        <UserBlock to={profileTo || undefined} className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-slate-100 emerald:hover:bg-white/5">
          {user?.avatar ? (
            <img src={user.avatar} alt={displayName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 emerald:text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-500 emerald:text-slate-400">{user?.email}</p>
          </div>
        </UserBlock>
      ) : (
        <UserBlock to={profileTo || undefined} className="mx-auto flex h-9 w-9 items-center justify-center rounded-full">
          {user?.avatar ? (
            <img src={user.avatar} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {initial}
            </span>
          )}
        </UserBlock>
      )}

      <button
        type="button"
        onClick={onLogoutClick}
        title={collapsed ? t("layout.logout") : undefined}
        className={`mt-3 flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-expense transition hover:bg-expense-soft emerald:text-red-400 emerald:hover:bg-red-500/10 ${
          collapsed ? "w-full justify-center" : "w-full"
        }`}
      >
        <LogOut size={18} />
        {!collapsed && t("layout.logout")}
      </button>
    </div>
  );
}

export default SidebarUserSection;
