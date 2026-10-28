import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { useChatUnread } from "./ChatUnreadContext";

// Round chat shortcut fixed at the bottom corner, with the unread count from the other side.
// `raised` lifts it one slot so another floating button (the user's quick add "+") sits below it.
// Hidden on the chat page itself, where it would sit on top of the message box.
function FloatingChatButton({ to, raised = false }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { count } = useChatUnread();

  if (pathname.startsWith(to)) return null;

  return (
    <Link
      to={to}
      aria-label={count ? t("chat.openWithCount", { count }) : t("chat.open")}
      title={t("chat.open")}
      className={`fixed z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-1 ring-white transition hover:bg-brand-700 inset-e-5 ${
        raised ? "bottom-[calc(9rem+env(safe-area-inset-bottom,0px))] lg:bottom-22" : "bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6"
      }`}
    >
      <MessageCircle size={21} />
      {count > 0 && (
        <span className="absolute -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-expense px-1 text-[11px] font-bold text-white ring-2 ring-white -inset-e-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export default FloatingChatButton;
