import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessagesSquare, Mic, Search } from "lucide-react";
import {
  deleteAdminMessage,
  editAdminMessage,
  fetchAdminAudio,
  fetchChatContacts,
  fetchUserMessages,
  sendMessageToUser,
} from "../../api/chatApi";
import ChatThread from "../../components/chat/ChatThread";
import QuickReplies from "../../components/chat/QuickReplies";
import useChatMessages from "../../components/chat/useChatMessages";
import usePolling from "../../components/chat/usePolling";
import { useChatUnread } from "../../components/chat/ChatUnreadContext";

const CONTACTS_POLL_MS = 10000;

// Avatar colours, picked from the name so each user keeps the same one.
const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];
const FILTERS = ["all", "unread", "chats"];

function Avatar({ user, size = "h-11 w-11" }) {
  const name = (user?.name || user?.email || "?").trim();
  const tone = AVATAR_TONES[name.charCodeAt(0) % AVATAR_TONES.length];
  return user?.avatar ? (
    <img src={user.avatar} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone}`}>
      {name[0]?.toUpperCase()}
    </span>
  );
}

// Selected user's thread; remounted per user so each gets its own state.
function AdminThread({ contact, userId, onBack, onRead, onSent }) {
  const { t } = useTranslation();
  const load = useCallback(() => fetchUserMessages(userId), [userId]);
  const send = useCallback((payload) => sendMessageToUser(userId, payload), [userId]);
  const { messages, status, error, meta, sendMessage, editMessage, deleteMessage } = useChatMessages({
    load,
    send,
    edit: editAdminMessage,
    remove: deleteAdminMessage,
    ownSide: "admin",
    onLoaded: onRead,
    loadErrorText: t("chat.loadError"),
    sendErrorText: t("chat.sendError"),
    editErrorText: t("chat.editError"),
    deleteErrorText: t("chat.deleteError"),
  });
  const user = meta || contact;

  return (
    <ChatThread
      title={
        <Link to={`/admin/users/${userId}`} className="hover:text-brand-700 hover:underline">
          {user?.name || "…"}
        </Link>
      }
      tools={QuickReplies}
      subtitle={user?.email}
      avatar={<Avatar user={user} />}
      messages={messages}
      ownSide="admin"
      loadAudio={fetchAdminAudio}
      onSend={async (payload) => {
        await sendMessage(payload);
        onSent();
      }}
      onEdit={async (id, text) => {
        await editMessage(id, text);
        onSent();
      }}
      onDelete={async (id) => {
        await deleteMessage(id);
        onSent();
      }}
      status={status}
      error={error}
      emptyText={t("admin.chat.noMessagesYet")}
      onBack={onBack}
    />
  );
}

function AdminChatPage() {
  const { t, i18n } = useTranslation();
  const { refresh: refreshUnread } = useChatUnread();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("user");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState(1);
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [contactsStatus, setContactsStatus] = useState("loading");
  const [filter, setFilter] = useState("all");

  // Debounce the search box.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPages(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Loads every page shown so far, so the list keeps its length while it refreshes.
  const loadContacts = useCallback(async () => {
    try {
      const responses = await Promise.all(
        Array.from({ length: pages }, (_, index) => fetchChatContacts({ search: search || undefined, page: index + 1 }))
      );
      setContacts(responses.flatMap(({ data }) => data.data));
      setPagination(responses[responses.length - 1].data.pagination);
      setContactsStatus("ready");
    } catch {
      setContactsStatus("error");
    }
  }, [search, pages]);

  usePolling(loadContacts, CONTACTS_POLL_MS, true, `${search}|${pages}`);


  const selectUser = (id) => setSearchParams(id ? { user: id } : {});
  const selectedContact = contacts.find((contact) => contact._id === selectedId);
  const unreadChats = contacts.filter((contact) => contact.unread > 0).length;
  const shownContacts = contacts.filter((contact) =>
    filter === "unread" ? contact.unread > 0 : filter === "chats" ? Boolean(contact.lastMessage?.createdAt) : true
  );

  const timeLabel = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const sameDay = date.toDateString() === new Date().toDateString();
    return new Intl.DateTimeFormat(i18n.language, sameDay ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short" }).format(date);
  };

  return (
    <div className="mx-auto flex -mb-9 h-[calc(100dvh-10.25rem)] max-w-6xl lg:mb-0 card-shadow overflow-hidden rounded-2xl border border-slate-200 bg-white lg:h-[calc(100dvh-7.5rem)]">
      {/* Contacts: every registered user, recent chats first. Hidden on phones while a chat is open. */}
      <aside
        className={`flex min-h-0 w-full flex-col border-e border-slate-100 bg-white lg:w-88 lg:shrink-0 ${
          selectedId ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">{t("admin.chat.title")}</h2>
            {unreadChats > 0 && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                {t("admin.chat.unreadChats", { count: unreadChats })}
              </span>
            )}
          </div>
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-slate-400" />
            <input
              type="search"
              value={searchInput}
              maxLength={100}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("admin.chat.search")}
              aria-label={t("admin.chat.search")}
              className="min-h-11 w-full rounded-full border border-transparent bg-slate-100 ps-9 pe-4 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
            />
          </label>
          <div role="tablist" aria-label={t("admin.chat.filterLabel")} className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={`min-h-8 shrink-0 rounded-full px-3.5 text-xs font-bold transition ${
                  filter === key ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t(`admin.chat.filters.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
          {contactsStatus === "loading" && contacts.length === 0 && (
            <li className="p-6 text-center text-sm text-slate-500">{t("common.loading")}</li>
          )}
          {contactsStatus === "error" && contacts.length === 0 && (
            <li className="p-6 text-center text-sm text-expense">{t("admin.chat.loadError")}</li>
          )}
          {contactsStatus === "ready" && shownContacts.length === 0 && (
            <li className="p-6 text-center text-sm text-slate-500">{t("admin.chat.noContacts")}</li>
          )}
          {shownContacts.map((contact) => {
            const active = contact._id === selectedId;
            const last = contact.lastMessage;
            return (
              <li key={contact._id}>
                <button
                  type="button"
                  onClick={() => selectUser(contact._id)}
                  className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start transition ${
                    active ? "bg-brand-50 ring-1 ring-brand-100" : "hover:bg-slate-100"
                  }`}
                >
                  <Avatar user={contact} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-bold text-slate-900">{contact.name}</span>
                      <span className={`shrink-0 text-[11px] ${contact.unread ? "font-bold text-brand-600" : "text-slate-400"}`}>
                        {timeLabel(last?.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={`truncate text-xs ${contact.unread ? "font-semibold text-slate-700" : "text-slate-500"}`}>
                        {last?.deleted ? (
                          <span className="italic">{t("chat.deleted")}</span>
                        ) : last?.audio ? (
                          <span className="inline-flex items-center gap-1">
                            {last.sender === "admin" && t("admin.chat.you")}
                            <Mic size={12} className="shrink-0 text-brand-600" aria-hidden="true" />
                            {t("chat.voiceMessage")}
                          </span>
                        ) : last?.text ? (
                          `${last.sender === "admin" ? t("admin.chat.you") : ""}${last.text}`
                        ) : (
                          <span dir="ltr">{contact.email}</span>
                        )}
                      </span>
                      {contact.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                          {contact.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {pagination.pages > pages && (
            <li className="p-3 text-center">
              <button
                type="button"
                onClick={() => setPages((current) => current + 1)}
                className="text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
              >
                {t("admin.chat.loadMore")}
              </button>
            </li>
          )}
        </ul>
      </aside>

      <section className={`min-h-0 min-w-0 flex-1 ${selectedId ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
        {selectedId ? (
          <AdminThread
            key={selectedId}
            userId={selectedId}
            contact={selectedContact}
            onBack={() => selectUser(null)}
            onRead={refreshUnread}
            onSent={loadContacts}
          />
        ) : (
          <div className="chat-wallpaper flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <MessagesSquare size={28} />
            </span>
            <div>
              <p className="text-lg font-bold text-slate-900">{t("admin.chat.emptyTitle")}</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">{t("admin.chat.selectPrompt")}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminChatPage;
