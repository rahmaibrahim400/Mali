import { useTranslation } from "react-i18next";
import { Headset } from "lucide-react";
import { deleteMyMessage, editMyMessage, fetchMyAudio, fetchMyMessages, sendMyMessage } from "../../api/chatApi";
import ChatThread from "../../components/chat/ChatThread";
import useChatMessages from "../../components/chat/useChatMessages";
import { useChatUnread } from "../../components/chat/ChatUnreadContext";

// The user's single thread with the support (admin) team.
function ChatPage() {
  const { t } = useTranslation();
  const { refresh: refreshUnread } = useChatUnread();
  const { messages, status, error, sendMessage, editMessage, deleteMessage } = useChatMessages({
    load: fetchMyMessages,
    send: sendMyMessage,
    edit: editMyMessage,
    remove: deleteMyMessage,
    ownSide: "user",
    onLoaded: refreshUnread,
    loadErrorText: t("chat.loadError"),
    sendErrorText: t("chat.sendError"),
    editErrorText: t("chat.editError"),
    deleteErrorText: t("chat.deleteError"),
  });

  return (
    <div className="mx-auto -mb-9 h-[calc(100dvh-10.25rem)] max-w-4xl overflow-hidden lg:mb-0 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 lg:h-[calc(100dvh-8.5rem)]">
      <ChatThread
        title={t("chat.supportName")}
        subtitle={t("chat.supportSubtitle")}
        avatar={
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <Headset size={19} />
          </span>
        }
        messages={messages}
        ownSide="user"
        onSend={sendMessage}
        onEdit={editMessage}
        onDelete={deleteMessage}
        loadAudio={fetchMyAudio}
        status={status}
        error={error}
        emptyText={t("chat.empty")}
      />
    </div>
  );
}

export default ChatPage;
