import { useEffect, useRef, useState } from "react";
import { Ban, CalendarClock, CalendarPlus, CircleCheck, Gift, MessageCircle, MoreHorizontal, UserRound } from "lucide-react";

// The less-used actions for a user, tucked behind a "⋯" button to keep the cards calm.
function UserActionsMenu({ user, t, busy, onProfile, onChat, onExtend, onFreeDays, onManualDate, onSuspend, onActivate }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { key: "profile", icon: UserRound, label: t("admin.users.viewProfile"), onClick: onProfile },
    { key: "chat", icon: MessageCircle, label: t("admin.users.sendMessage"), onClick: onChat },
    { key: "extend", icon: CalendarPlus, label: t("admin.users.extendSubscription"), onClick: onExtend },
    { key: "free", icon: Gift, label: t("admin.users.addFreeDays"), onClick: onFreeDays },
    { key: "manual", icon: CalendarClock, label: t("admin.users.setManualDate"), onClick: onManualDate },
    user.isSuspended
      ? { key: "activate", icon: CircleCheck, label: busy ? t("admin.users.activating") : t("admin.users.activate"), onClick: onActivate }
      : { key: "suspend", icon: Ban, label: t("admin.users.suspend"), onClick: onSuspend, danger: true },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("admin.users.moreActions")}
        title={t("admin.users.moreActions")}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
          open ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        }`}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div
          role="menu"
          // Opens upward, end-aligned and narrower than a card, so it stays within the card's width.
          className="toast-enter absolute bottom-full z-30 mb-1.5 w-52 overflow-hidden rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200 inset-e-0"
        >
          {items.map(({ key, icon: Icon, label, onClick, danger }) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              disabled={busy && key === "activate"}
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm font-medium transition disabled:opacity-60 ${
                danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100"
              } ${key === "suspend" || key === "activate" || key === "extend" ? "mt-1 border-t border-slate-100 pt-2.5" : ""}`}
            >
              {/* Muted icons; only the destructive action keeps its color. */}
              <Icon size={15} className={danger ? "text-red-500" : "text-slate-400"} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserActionsMenu;
