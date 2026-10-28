import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle, X } from "lucide-react";
import usePolling from "./usePolling";

// Also how often "delivered" (second tick) is recorded while the app is open.
const UNREAD_POLL_MS = 10000;
const TOAST_MS = 6000;

const ChatUnreadContext = createContext({ count: 0, refresh: () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export const useChatUnread = () => useContext(ChatUnreadContext);

// Keeps the unread-message count fresh for the nav badges, and pops a notification
// (plus "(n)" in the tab title) when a new message arrives outside the chat page.
export function ChatUnreadProvider({ fetchUnread, chatPath, children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [count, setCount] = useState(0);
  const [toastCount, setToastCount] = useState(0);
  const previous = useRef(null);
  const onChatPage = pathname.startsWith(chatPath);
  const onChatPageRef = useRef(onChatPage);

  useEffect(() => {
    onChatPageRef.current = onChatPage;
  }, [onChatPage]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await fetchUnread();
      const next = Number(data?.data?.count) || 0;
      if (previous.current !== null && next > previous.current && !onChatPageRef.current) {
        setToastCount(next);
      }
      previous.current = next;
      setCount(next);
    } catch {
      // Network hiccups just wait for the next poll.
    }
  }, [fetchUnread]);

  usePolling(refresh, UNREAD_POLL_MS);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
  }, [count]);

  useEffect(() => {
    if (!toastCount) return undefined;
    const timer = setTimeout(() => setToastCount(0), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toastCount]);

  return (
    <ChatUnreadContext.Provider value={{ count, refresh }}>
      {children}

      {toastCount > 0 && !onChatPage && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-60 flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            className="toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-100"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <MessageCircle size={20} strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold text-slate-900">{t("chat.newMessageTitle")}</p>
              <p className="mt-0.5 text-sm text-slate-500">{t("chat.newMessageBody", { count: toastCount })}</p>
              <button
                type="button"
                onClick={() => {
                  setToastCount(0);
                  navigate(chatPath);
                }}
                className="mt-2 text-sm font-bold text-brand-700 underline underline-offset-4 hover:text-brand-800"
              >
                {t("chat.open")}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setToastCount(0)}
              aria-label={t("common.close")}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </ChatUnreadContext.Provider>
  );
}
