import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Megaphone } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { fetchMyAnnouncements } from "../../api/userExtrasApi";
import { toIntlLocale } from "../../i18n/locale";

// Messages the admin team sent to this user (they're also in the notification bell).
function AnnouncementsPage() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const dateFormat = new Intl.DateTimeFormat(toIntlLocale(i18n.language), { dateStyle: "medium", timeStyle: "short" });

  const load = useCallback(async () => {
    try {
      const { data } = await fetchMyAnnouncements();
      setItems(data.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <PageHeader icon={Megaphone} title={t("announcements.title")} subtitle={t("announcements.subtitle")} />

      {status === "loading" ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((item) => <span key={item} className="skeleton block h-28 rounded-3xl" />)}
        </div>
      ) : status === "error" ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{t("announcements.loadError")}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200/80 bg-white py-14 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Megaphone size={24} />
          </span>
          <p className="text-sm text-slate-500">{t("announcements.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item._id} className="card-hover rounded-3xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Megaphone size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-slate-900">{item.title}</h2>
                  <time dateTime={item.createdAt} className="text-xs text-slate-400">{dateFormat.format(new Date(item.createdAt))}</time>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{item.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AnnouncementsPage;
