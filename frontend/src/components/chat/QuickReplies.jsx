import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, X, Zap } from "lucide-react";
import { createQuickReply, deleteQuickReply, fetchQuickReplies } from "../../api/adminExtrasApi";

// Admin chat: saved answers to drop into the message box, plus adding / removing them.
function QuickReplies({ onPick }) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", text: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data } = await fetchQuickReplies();
      setItems(data.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

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

  const toggle = () => {
    if (!open && status !== "ready") load();
    setOpen((value) => !value);
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await createQuickReply({ title: form.title.trim(), text: form.text.trim() });
      setItems((current) => [...current, data.data]);
      setForm({ title: "", text: "" });
      setAdding(false);
    } catch (saveError) {
      setError(saveError.response?.data?.message || t("admin.quickReplies.saveError"));
    }
  };

  const remove = async (id) => {
    setItems((current) => current.filter((item) => item._id !== id));
    try {
      await deleteQuickReply(id);
    } catch {
      load();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={t("admin.quickReplies.title")}
        title={t("admin.quickReplies.title")}
        aria-expanded={open}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
          open ? "bg-amber-50 text-amber-600" : "text-slate-500 hover:bg-slate-100 hover:text-amber-600"
        }`}
      >
        <Zap size={20} />
      </button>

      {open && (
        <div className="toast-enter absolute bottom-full z-20 mb-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 inset-e-0">
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <Zap size={15} className="text-amber-500" />
              {t("admin.quickReplies.title")}
            </h3>
            <button
              type="button"
              onClick={() => {
                setAdding((value) => !value);
                setError("");
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-50"
            >
              {adding ? <X size={14} /> : <Plus size={14} />}
              {adding ? t("common.cancel") : t("admin.quickReplies.add")}
            </button>
          </header>

          {adding && (
            <form onSubmit={save} className="space-y-2 border-b border-slate-100 bg-slate-50/70 p-3">
              <input
                value={form.title}
                maxLength={60}
                required
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={t("admin.quickReplies.namePlaceholder")}
                aria-label={t("admin.quickReplies.namePlaceholder")}
                className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
              />
              <textarea
                value={form.text}
                maxLength={2000}
                required
                rows={3}
                onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                placeholder={t("admin.quickReplies.textPlaceholder")}
                aria-label={t("admin.quickReplies.textPlaceholder")}
                className="min-h-0 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              {error && <p className="text-xs font-medium text-expense">{error}</p>}
              <button type="submit" className="min-h-9 w-full rounded-lg bg-brand-600 text-sm font-bold text-white transition hover:bg-brand-700">
                {t("admin.quickReplies.save")}
              </button>
            </form>
          )}

          <ul className="max-h-72 overflow-y-auto p-1.5">
            {status === "loading" && <li className="p-4 text-center text-sm text-slate-500">{t("common.loading")}</li>}
            {status === "error" && <li className="p-4 text-center text-sm text-expense">{t("admin.quickReplies.loadError")}</li>}
            {status === "ready" && items.length === 0 && (
              <li className="p-4 text-center text-sm text-slate-500">{t("admin.quickReplies.empty")}</li>
            )}
            {items.map((item) => (
              <li key={item._id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    onPick(item.text);
                    setOpen(false);
                  }}
                  className="w-full rounded-xl px-3 py-2.5 pe-10 text-start transition hover:bg-slate-100"
                >
                  <span className="block text-sm font-bold text-slate-800">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{item.text}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(item._id)}
                  aria-label={t("admin.quickReplies.delete")}
                  title={t("admin.quickReplies.delete")}
                  className="absolute top-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-expense-soft hover:text-expense inset-e-2"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default QuickReplies;
