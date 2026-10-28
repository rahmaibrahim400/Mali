import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlarmClock,
  BadgeCheck,
  Bell,
  BellOff,
  CheckCheck,
  CalendarClock,
  CalendarX,
  ClipboardCheck,
  ClipboardX,
  HandCoins,
  Megaphone,
  CircleAlert,
  MessageCircle,
  PartyPopper,
  ReceiptText,
  UserPlus,
  WalletMinimal,
} from "lucide-react";
import usePolling from "../chat/usePolling";
import { formatMoney } from "../../utils/formatAmount";

const POLL_MS = 30000;

// Each kind of notification: its icon and the icon's colour. They all sit on the same neutral
// circle so the list stays calm; the colour only says how urgent it is.
const URGENT = "text-red-500";
const WARNING = "text-amber-500";
const GOOD = "text-emerald-600";
const NEUTRAL = "text-slate-500";
const TYPES = {
  chatMessage: { icon: MessageCircle, tone: NEUTRAL },
  userMessage: { icon: MessageCircle, tone: NEUTRAL },
  subscriptionExpiring: { icon: CalendarClock, tone: WARNING },
  subscriptionExpired: { icon: CalendarX, tone: URGENT },
  subscriptionsExpiring: { icon: CalendarClock, tone: WARNING },
  subscriptionsExpired: { icon: CalendarX, tone: URGENT },
  debtDueSoon: { icon: AlarmClock, tone: WARNING },
  debtOverdue: { icon: CircleAlert, tone: URGENT },
  negativeBalance: { icon: WalletMinimal, tone: URGENT },
  goalCompleted: { icon: PartyPopper, tone: GOOD },
  newUser: { icon: UserPlus, tone: NEUTRAL },
  announcement: { icon: Megaphone, tone: NEUTRAL },
  renewalRequest: { icon: ClipboardCheck, tone: WARNING },
  renewalApproved: { icon: BadgeCheck, tone: GOOD },
  renewalRejected: { icon: ClipboardX, tone: URGENT },
  insufficientBalance: { icon: WalletMinimal, tone: WARNING },
  debtPaid: { icon: BadgeCheck, tone: GOOD },
  debtAdded: { icon: ReceiptText, tone: NEUTRAL },
  renewalApprovedByAdmin: { icon: BadgeCheck, tone: GOOD },
  renewalRejectedByAdmin: { icon: ClipboardX, tone: URGENT },
  debtPaymentAdded: { icon: HandCoins, tone: GOOD },
};
const FALLBACK = { icon: Bell, tone: NEUTRAL };

// Start of the local day, to group the list into today / yesterday / earlier.
const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

// Header bell for the user app and the admin panel. Polls the server and shows an unread badge.
// Opening it changes nothing: an item becomes read when it's opened (or its dot is pressed),
// or all at once with "mark all as read".
function NotificationBell({ fetchNotifications, markRead, markAllRead, localItems = [], markLocalRead }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [status, setStatus] = useState("loading");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const { data } = await fetchNotifications();
      setItems(data.data.items || []);
      setLoadedAt(Date.now());
      setStatus("ready");
    } catch {
      setStatus((current) => (current === "loading" ? "error" : current));
    }
  }, [fetchNotifications]);

  usePolling(load, POLL_MS);

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

  // Server notifications plus any alerts kept in this browser, newest first.
  const allItems = [...items, ...localItems].sort((a, b) => new Date(b.at) - new Date(a.at));
  const unread = allItems.filter((item) => !item.read).length;
  const shownItems = filter === "unread" ? allItems.filter((item) => !item.read) : allItems;

  // Consecutive items under one day heading (the list is already newest first).
  const groups = [];
  // loadedAt is set with the items, and the groups only render once they have loaded.
  const today = startOfDay(loadedAt);
  const dayRtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });
  for (const item of shownItems) {
    const daysAgo = Math.round((today - startOfDay(item.at)) / 86400000);
    const key = daysAgo <= 0 ? "today" : daysAgo === 1 ? "yesterday" : "earlier";
    if (groups.at(-1)?.key !== key) {
      const label = key === "earlier" ? t("notifications.groups.earlier") : dayRtf.format(key === "today" ? 0 : -1, "day");
      // Intl gives "today" / "yesterday" in lower case; headings start with a capital.
      groups.push({ key, label: label.charAt(0).toLocaleUpperCase(i18n.language) + label.slice(1), items: [] });
    }
    groups.at(-1).items.push(item);
  }

  // Optimistic: flip it locally, then tell the server (reload on failure to stay truthful).
  const readOne = async (item) => {
    if (item.read) return;
    if (item.local) {
      markLocalRead?.([item.id]);
      return;
    }
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)));
    try {
      await markRead(item.id);
    } catch {
      load();
    }
  };

  const readAll = async () => {
    const localUnread = localItems.filter((item) => !item.read).map((item) => item.id);
    if (localUnread.length) markLocalRead?.(localUnread);
    setItems((current) => current.map((entry) => ({ ...entry, read: true })));
    try {
      await markAllRead();
    } catch {
      load();
    }
  };

  const message = (item) => {
    const params = { ...item.params };
    if (params.amount !== undefined) params.amount = formatMoney(Math.abs(params.amount), params.currency || "EGP");
    if (params.plan) params.plan = t(`admin.home.plans.${params.plan}`, { defaultValue: params.plan });
    if (item.type === "insufficientBalance") {
      return t("notifications.insufficient.message", {
        action: t(`notifications.insufficient.actions.${params.source}`),
        // params.amount is already formatted above; format the raw value once.
        amount: formatMoney(item.params.amount, params.currency || "EGP"),
        account: params.accountName,
        balance: formatMoney(params.balance, params.currency || "EGP"),
      });
    }
    return t(`notifications.types.${item.type}`, { ...params, defaultValue: item.type });
  };

  const timeAgo = (value) => {
    const seconds = Math.round((new Date(value).getTime() - loadedAt) / 1000);
    const absolute = Math.abs(seconds);
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });
    if (absolute < 60) return rtf.format(0, "second");
    if (absolute < 3600) return rtf.format(Math.round(seconds / 60), "minute");
    if (absolute < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
    if (absolute < 30 * 86400) return rtf.format(Math.round(seconds / 86400), "day");
    return new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(value));
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? t("notifications.titleWithCount", { count: unread }) : t("notifications.title")}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
          open ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800"
        }`}
      >
        <Bell size={19} className={unread ? "origin-top animate-[bell-ring_1.2s_ease-in-out_2]" : ""} />
        {unread > 0 && (
          <span className="tabular-amount absolute -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white -inset-e-1 emerald:bg-expense">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("notifications.title")}
          // Phones: a full-width panel pinned under the top bar (the bell isn't at the screen edge, so an
          // anchored menu would run off-screen). From sm: a dropdown under the bell.
          className="toast-enter fixed inset-x-3 top-[4.5rem] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:absolute sm:inset-x-auto sm:top-full sm:mt-2 sm:w-[24rem] sm:inset-e-0"
        >
          <header className="px-4 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900">{t("notifications.title")}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {unread > 0 ? t("notifications.newCount", { count: unread }) : t("notifications.empty")}
                </p>
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={readAll}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <CheckCheck size={14} aria-hidden="true" />
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>

            {/* All / unread, as underlined tabs */}
            <div role="tablist" aria-label={t("notifications.title")} className="mt-3 flex gap-5 border-b border-slate-100">
              {[
                ["all", t("notifications.filters.all"), allItems.length],
                ["unread", t("notifications.unread"), unread],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 text-xs font-semibold transition ${
                    filter === key
                      ? "border-slate-900 text-slate-900 emerald:border-brand-600 emerald:text-brand-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                  <span className="tabular-amount rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">{count}</span>
                </button>
              ))}
            </div>
          </header>

          {status === "loading" ? (
            <div className="space-y-4 p-4" role="status" aria-label={t("common.loading")}>
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-start gap-3" aria-hidden="true">
                  <span className="skeleton h-9 w-9 shrink-0 rounded-full" />
                  <span className="flex-1 space-y-2 pt-1">
                    <span className="skeleton block h-3 w-4/5 rounded" />
                    <span className="skeleton block h-2.5 w-1/3 rounded" />
                  </span>
                </div>
              ))}
            </div>
          ) : status === "error" ? (
            <p className="px-4 py-10 text-center text-sm text-expense">{t("notifications.loadError")}</p>
          ) : shownItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <BellOff size={20} />
              </span>
              <p className="text-sm font-semibold text-slate-700">
                {filter === "unread" ? t("notifications.emptyUnread") : t("notifications.emptyTitle")}
              </p>
              <p className="text-xs text-slate-500">{t("notifications.emptyText")}</p>
            </div>
          ) : (
            <div className="max-h-[calc(100dvh-15rem)] overflow-y-auto overscroll-contain pb-2 sm:max-h-[min(28rem,70vh)]">
              {groups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                  {/* Day heading stays on top while its items scroll under it. */}
                  <h3 className="sticky top-0 z-10 bg-white px-4 pb-1 pt-3 text-[11px] font-semibold text-slate-400">{group.label}</h3>
                  <ul>
                    {group.items.map((item) => {
                      const { icon: Icon, tone } = TYPES[item.type] || FALLBACK;
                      const fresh = !item.read;
                      return (
                        <li key={item.id} className="relative px-2">
                          <button
                            type="button"
                            onClick={() => {
                              readOne(item);
                              setOpen(false);
                              navigate(item.link);
                            }}
                            className="flex w-full items-start gap-3 rounded-xl py-2.5 ps-2 pe-9 text-start transition hover:bg-slate-100"
                          >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 ${tone}`}>
                              <Icon size={16} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`line-clamp-2 text-[13px] leading-5 ${fresh ? "font-medium text-slate-900" : "text-slate-500"}`}>
                                {message(item)}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-400">
                                {timeAgo(item.at)}
                                {fresh && <span className="sr-only"> · {t("notifications.unread")}</span>}
                              </span>
                            </span>
                          </button>
                          {/* Unread: a dot that marks just this one as read without leaving the list. */}
                          {fresh && (
                            <button
                              type="button"
                              onClick={() => readOne(item)}
                              title={t("notifications.markRead")}
                              aria-label={t("notifications.markRead")}
                              className="group absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-slate-100 inset-e-3"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 group-hover:hidden emerald:bg-brand-500" />
                              <CheckCheck size={14} className="hidden text-slate-600 group-hover:block" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
