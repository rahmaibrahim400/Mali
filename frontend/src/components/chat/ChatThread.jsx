import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Ban, Check, CheckCheck, Clock, Mic, Pencil, SendHorizontal, Smile, Trash2, X } from "lucide-react";
import ConfirmModal from "../common/ConfirmModal";
import AudioMessage from "./AudioMessage";
import formatClock from "./formatClock";
import useVoiceRecorder from "./useVoiceRecorder";

const EmojiPanel = lazy(() => import("./EmojiPanel"));

const MAX_LENGTH = 2000;

function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// WhatsApp-style ticks: one = sent, two grey = delivered (app open), two blue = read.
function Ticks({ message, t }) {
  if (message.pending) return <Clock size={12} aria-label={t("chat.sending")} />;
  if (message.readAt) return <CheckCheck size={15} className="text-sky-300" aria-label={t("chat.read")} />;
  if (message.deliveredAt) return <CheckCheck size={15} aria-label={t("chat.delivered")} />;
  return <Check size={15} aria-label={t("chat.sent")} />;
}

// WhatsApp-style thread: day separators, own messages on the end side, ticks,
// edit/delete under own messages, and a composer with a full emoji picker.
function ChatThread({
  title,
  subtitle,
  avatar,
  messages,
  ownSide,
  onSend,
  onEdit,
  onDelete,
  loadAudio,
  tools: Tools, // optional composer button that inserts text, e.g. the admin's quick replies
  status,
  error,
  emptyText,
  onBack,
}) {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(null); // message being edited
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [micError, setMicError] = useState("");
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiRef = useRef(null);
  const stickToBottom = useRef(true);
  const lastCount = useRef(0);

  const timeFormat = new Intl.DateTimeFormat(i18n.language, { hour: "numeric", minute: "2-digit" });
  const dayFormat = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long" });

  const dayLabel = (value) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dayKey(value) === dayKey(today)) return t("chat.today");
    if (dayKey(value) === dayKey(yesterday)) return t("chat.yesterday");
    return dayFormat.format(new Date(value));
  };

  // Follow new messages only when the reader is already at the bottom (or just sent one).
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    if (messages.length !== lastCount.current && stickToBottom.current) {
      box.scrollTop = box.scrollHeight;
    }
    lastCount.current = messages.length;
  }, [messages]);

  // Grow the composer with its text, up to about five lines.
  useEffect(() => {
    const area = textareaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, 128)}px`;
  }, [draft]);

  // Close the emoji picker on an outside click or Escape.
  useEffect(() => {
    if (!emojiOpen) return undefined;
    const onPointer = (event) => {
      if (!emojiRef.current?.contains(event.target)) setEmojiOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setEmojiOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [emojiOpen]);

  const sendRecording = async () => {
    const result = await recorder.stop();
    if (!result || result.duration < 1 || !result.blob.size) return; // too short to be useful
    stickToBottom.current = true;
    onSend({ audioBlob: result.blob, mimeType: result.mimeType, duration: result.duration });
  };
  const recorder = useVoiceRecorder({ onAutoStop: () => sendRecording() });

  const startRecording = async () => {
    setMicError("");
    setEmojiOpen(false);
    try {
      await recorder.start();
    } catch (recordError) {
      setMicError(recordError.message === "unsupported" ? t("chat.micUnsupported") : t("chat.micDenied"));
    }
  };

  const handleScroll = () => {
    const box = scrollRef.current;
    stickToBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  };

  const startEdit = (message) => {
    setEditing(message);
    setDraft(message.text);
    requestAnimationFrame(() => {
      const area = textareaRef.current;
      area?.focus();
      area?.setSelectionRange(area.value.length, area.value.length);
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };

  const submit = (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setEmojiOpen(false);
    if (editing) {
      if (text !== editing.text) onEdit(editing._id, text);
      cancelEdit();
      return;
    }
    stickToBottom.current = true;
    setDraft("");
    onSend({ text });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && editing) cancelEdit();
    // Enter sends, Shift+Enter adds a new line (not while composing with an IME).
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  };

  // Put the emoji where the cursor is.
  const insertEmoji = (emoji) => {
    const area = textareaRef.current;
    const start = area?.selectionStart ?? draft.length;
    const end = area?.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`.slice(0, MAX_LENGTH);
    setDraft(next);
    requestAnimationFrame(() => {
      area?.focus();
      const caret = start + emoji.length;
      area?.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("chat.back")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </button>
        )}
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-wallpaper min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
      >
        {status === "loading" && messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{t("common.loading")}</p>
        ) : messages.length === 0 ? (
          <p className="mx-auto mt-10 max-w-xs rounded-xl bg-white/80 px-4 py-3 text-center text-sm text-slate-500 shadow-sm">
            {emptyText}
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {messages.map((message, index) => {
              const own = message.sender === ownSide;
              const showDay = index === 0 || dayKey(messages[index - 1].createdAt) !== dayKey(message.createdAt);
              const canChange = own && !message.deleted && !message.pending;
              return (
                <li key={message._id} className="flex flex-col">
                  {showDay && (
                    <span className="mx-auto my-2 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                      {dayLabel(message.createdAt)}
                    </span>
                  )}
                  <div className={`flex max-w-[85%] flex-col sm:max-w-[70%] ${own ? "items-end self-end" : "items-start self-start"}`}>
                    <div
                      className={`min-w-0 max-w-full rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        own ? "rounded-ee-md bg-brand-600 text-white" : "rounded-es-md bg-white text-slate-800 ring-1 ring-slate-100"
                      } ${editing?._id === message._id ? "ring-2 ring-sky-300" : ""}`}
                    >
                      {message.deleted ? (
                        <p className={`flex items-center gap-1.5 italic ${own ? "text-white/80" : "text-slate-400"}`}>
                          <Ban size={14} />
                          {own ? t("chat.youDeleted") : t("chat.deleted")}
                        </p>
                      ) : message.audio ? (
                        <AudioMessage message={message} own={own} loadAudio={loadAudio} />
                      ) : (
                        <p className="whitespace-pre-wrap break-words leading-6">{message.text}</p>
                      )}
                      <span
                        className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${
                          own ? "text-white/75" : "text-slate-400"
                        }`}
                      >
                        {message.editedAt && !message.deleted && <span>{t("chat.edited")}</span>}
                        {timeFormat.format(new Date(message.createdAt))}
                        {own && <Ticks message={message} t={t} />}
                      </span>
                    </div>

                    {/* Edit / delete, always visible under own messages. */}
                    {canChange && (
                      <div className="mt-0.5 flex">
                        {!message.audio && (
                          <button
                            type="button"
                            onClick={() => startEdit(message)}
                            aria-label={t("chat.edit")}
                            title={t("chat.edit")}
                            className="flex h-6 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(message)}
                          aria-label={t("chat.delete")}
                          title={t("chat.delete")}
                          className="flex h-6 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-expense-soft hover:text-expense"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {(error || micError) && (
        <p role="alert" className="border-t border-red-100 bg-expense-soft px-4 py-2 text-sm font-medium text-expense">
          {error || micError}
        </p>
      )}

      {editing && (
        <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2">
          <Pencil size={16} className="shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-brand-700">{t("chat.editing")}</p>
            <p className="truncate text-xs text-slate-500">{editing.text}</p>
          </div>
          <button
            type="button"
            onClick={cancelEdit}
            aria-label={t("chat.cancelEdit")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {recorder.recording ? (
        <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
          <button
            type="button"
            onClick={recorder.cancel}
            aria-label={t("chat.cancelRecording")}
            title={t("chat.cancelRecording")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-expense-soft hover:text-expense"
          >
            <Trash2 size={20} />
          </button>
          <div className="flex min-h-11 flex-1 items-center gap-2.5 rounded-2xl bg-slate-50 px-4" role="status" aria-live="polite">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-expense" />
            <span className="tabular-amount text-sm font-semibold text-slate-700">{formatClock(recorder.elapsed)}</span>
            <span className="truncate text-xs text-slate-500">{t("chat.recording")}</span>
          </div>
          <button
            type="button"
            onClick={sendRecording}
            aria-label={t("chat.sendRecording")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
          >
            <SendHorizontal size={19} className="rtl:rotate-180" />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="relative flex items-end gap-2 border-t border-slate-200 bg-white p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.placeholder")}
            aria-label={t("chat.placeholder")}
            className="min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
          />
          {Tools && <Tools onPick={insertEmoji} />}
        <div ref={emojiRef} className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((open) => !open)}
              aria-label={t("chat.emoji")}
              aria-expanded={emojiOpen}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                emojiOpen ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:bg-slate-100 hover:text-brand-600"
              }`}
            >
              <Smile size={22} />
            </button>
            {emojiOpen && (
              <div className="absolute bottom-full z-20 mb-2 inset-e-0">
                <Suspense
                  fallback={
                    <div className="flex h-24 w-56 items-center justify-center rounded-2xl bg-white text-sm text-slate-500 shadow-2xl ring-1 ring-slate-200">
                      {t("common.loading")}
                    </div>
                  }
                >
                  <EmojiPanel onPick={insertEmoji} />
                </Suspense>
              </div>
            )}
          </div>
          {/* Empty box: the button records a voice message instead (like WhatsApp). */}
          {!draft.trim() && !editing ? (
            <button
              type="button"
              onClick={startRecording}
              aria-label={t("chat.record")}
              title={t("chat.record")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
            >
              <Mic size={20} />
            </button>
          ) : (
            <button
              type="submit"
              aria-label={editing ? t("chat.saveEdit") : t("chat.send")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
            >
              {editing ? <Check size={20} /> : <SendHorizontal size={19} className="rtl:rotate-180" />}
            </button>
          )}
        </form>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          onDelete(confirmDelete._id);
          setConfirmDelete(null);
          if (editing?._id === confirmDelete._id) cancelEdit();
        }}
        icon={Trash2}
        confirmVariant="destructive"
        title={t("chat.deleteTitle")}
        description={t("chat.deleteMessage")}
        cancelLabel={t("chat.cancel")}
        confirmLabel={t("chat.delete")}
      />
    </div>
  );
}

export default ChatThread;
