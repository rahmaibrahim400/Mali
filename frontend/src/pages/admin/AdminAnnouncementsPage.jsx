import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Megaphone, Send, Trash2, Users } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import ConfirmModal from "../../components/common/ConfirmModal";
import SuccessToast from "../../components/common/SuccessToast";
import { createAnnouncement, deleteAnnouncement, fetchAnnouncements, fetchAudienceCounts } from "../../api/adminExtrasApi";
import { toIntlLocale } from "../../i18n/locale";

const AUDIENCES = ["all", "active", "expiring", "expired", "trial", "paid"];
const EMPTY_FORM = { title: "", body: "", audience: "all" };
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:bg-white";

// Send one message to many users at once; it lands in their notifications.
function AdminAnnouncementsPage() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [counts, setCounts] = useState({});
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const numberFormat = new Intl.NumberFormat(toIntlLocale(i18n.language));
  const dateFormat = new Intl.DateTimeFormat(toIntlLocale(i18n.language), { dateStyle: "medium", timeStyle: "short" });

  const load = useCallback(async () => {
    try {
      const [{ data: list }, { data: audience }] = await Promise.all([fetchAnnouncements(), fetchAudienceCounts()]);
      setItems(list.data);
      setCounts(audience.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const closeToast = useCallback(() => setToast(""), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      const { data } = await createAnnouncement({ ...form, title: form.title.trim(), body: form.body.trim() });
      setItems((current) => [data.data, ...current]);
      setForm(EMPTY_FORM);
      setToast(t("admin.announcements.sent", { count: data.data.recipientCount }));
    } catch (sendError) {
      setError(sendError.response?.data?.message || t("admin.announcements.sendError"));
    }
    setSending(false);
  };

  const handleDelete = async () => {
    const target = confirmDelete;
    setConfirmDelete(null);
    setItems((current) => current.filter((item) => item._id !== target._id));
    try {
      await deleteAnnouncement(target._id);
    } catch {
      load();
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-8">
      <PageHeader icon={Megaphone} title={t("admin.announcements.title")} subtitle={t("admin.announcements.subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Compose */}
        <form onSubmit={handleSubmit} className="card-shadow h-fit rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900">{t("admin.announcements.newTitle")}</h2>

          <p className="mt-4 text-sm font-semibold text-slate-700">{t("admin.announcements.audience")}</p>
          <div role="radiogroup" aria-label={t("admin.announcements.audience")} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AUDIENCES.map((audience) => {
              const selected = form.audience === audience;
              return (
                <button
                  key={audience}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setForm((current) => ({ ...current, audience }))}
                  className={`rounded-2xl border px-3 py-2.5 text-start transition ${
                    selected ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/15" : "border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span className={`block text-sm font-bold ${selected ? "text-brand-700" : "text-slate-800"}`}>
                    {t(`admin.announcements.audiences.${audience}`)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Users size={12} aria-hidden="true" />
                    {counts[audience] === undefined ? "…" : t("admin.announcements.usersCount", { count: counts[audience] })}
                  </span>
                </button>
              );
            })}
          </div>

          <label htmlFor="announcement-title" className="mt-5 block text-sm font-semibold text-slate-700">
            {t("admin.announcements.titleLabel")}
          </label>
          <input
            id="announcement-title"
            value={form.title}
            maxLength={120}
            required
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder={t("admin.announcements.titlePlaceholder")}
            className={`mt-1.5 min-h-11 ${inputClass}`}
          />

          <label htmlFor="announcement-body" className="mt-4 block text-sm font-semibold text-slate-700">
            {t("admin.announcements.bodyLabel")}
          </label>
          <textarea
            id="announcement-body"
            value={form.body}
            maxLength={2000}
            required
            rows={5}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            placeholder={t("admin.announcements.bodyPlaceholder")}
            className={`mt-1.5 resize-none ${inputClass}`}
          />
          <p className="mt-1 text-end text-xs text-slate-400">{numberFormat.format(form.body.length)} / {numberFormat.format(2000)}</p>

          {error && <p role="alert" className="mt-3 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">{error}</p>}

          <button
            type="submit"
            disabled={sending || !counts[form.audience]}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={16} className="rtl:-scale-x-100" />
            {sending
              ? t("admin.announcements.sending")
              : t("admin.announcements.send", { count: counts[form.audience] ?? 0 })}
          </button>
        </form>

        {/* Sent */}
        <section className="card-shadow rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900">{t("admin.announcements.sentTitle")}</h2>
          {status === "loading" ? (
            <div className="mt-4 space-y-3" aria-hidden="true">
              {[0, 1, 2].map((item) => <span key={item} className="skeleton block h-20 rounded-2xl" />)}
            </div>
          ) : status === "error" ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{t("admin.announcements.loadError")}</p>
          ) : items.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Megaphone size={24} />
              </span>
              <p className="text-sm text-slate-500">{t("admin.announcements.empty")}</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item._id} className="card-hover rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(item)}
                      aria-label={t("admin.announcements.delete")}
                      title={t("admin.announcements.delete")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-expense-soft hover:text-expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-brand-700 ring-1 ring-slate-200">
                      {t(`admin.announcements.audiences.${item.audience}`)}
                    </span>
                    <span>{t("admin.announcements.usersCount", { count: item.recipientCount })}</span>
                    <span aria-hidden="true">·</span>
                    <span>{dateFormat.format(new Date(item.createdAt))}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        icon={Trash2}
        confirmVariant="destructive"
        title={t("admin.announcements.deleteTitle")}
        description={t("admin.announcements.deleteText")}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("admin.announcements.delete")}
      />
      <SuccessToast message={toast} onClose={closeToast} title={t("admin.announcements.sentTitleToast")} />
    </div>
  );
}

export default AdminAnnouncementsPage;
