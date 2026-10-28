import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { User, LogOut } from "lucide-react";
import { logout } from "../../../store/slices/authSlice";
import ConfirmModal from "../../common/ConfirmModal";

function UserMenu({ user }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const containerRef = useRef(null);

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || "?";

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleConfirmLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="block rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full z-40 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl inset-e-0"
        >
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>

          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <User size={16} />
            {t("layout.userMenu.profile")}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmingLogout(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-expense transition hover:bg-expense-soft"
          >
            <LogOut size={16} />
            {t("layout.logout")}
          </button>
        </div>
      )}

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
    </div>
  );
}

export default UserMenu;
