import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Goal,
  History,
  MessagesSquare,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { fetchUserProfile } from "../../api/adminExtrasApi";
import { toIntlLocale } from "../../i18n/locale";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700",
  expiring: "bg-amber-50 text-amber-700",
  expired: "bg-slate-100 text-slate-700",
  suspended: "bg-red-50 text-red-700",
};
const RENEWAL_PILL = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};
const card = "card-shadow rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const emptyBox = "mt-4 rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500";

// Everything about one user in one place: account, subscription, usage, chat, renewals, admin history.
function AdminUserProfilePage() {
  const { userId } = useParams();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  const locale = toIntlLocale(i18n.language);
  const numberFormat = new Intl.NumberFormat(locale);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const dateTimeFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : "—");

  const load = useCallback(async () => {
    try {
      const { data } = await fetchUserProfile(userId);
      setProfile(data.data);
      setStatus("ready");
    } catch (error) {
      setStatus(error.response?.status === 404 ? "missing" : "error");
    }
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const back = (
    <Link to="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-700">
      {/* "Back" points to where the reader came from: left in English, right in Arabic. */}
      <ArrowLeft size={16} className="rtl:rotate-180" />
      {t("admin.profile.back")}
    </Link>
  );

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl space-y-4" aria-hidden="true">
        {back}
        <span className="skeleton block h-44 rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <span key={item} className="skeleton block h-32 rounded-3xl" />)}
        </div>
      </div>
    );
  }
  if (status !== "ready") {
    return (
      <div className="mx-auto max-w-6xl">
        {back}
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
          {t(status === "missing" ? "admin.profile.notFound" : "admin.profile.loadError")}
        </p>
      </div>
    );
  }

  const { user, counts, logs, conversation, renewals } = profile;
  const statusKey = STATUS_STYLES[user._status] ? user._status : "active";
  const usage = [
    { key: "accounts", icon: Wallet },
    { key: "incomes", icon: TrendingUp },
    { key: "expenses", icon: TrendingDown },
    { key: "debts", icon: ReceiptText },
    { key: "goals", icon: Goal },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div>
        {back}
        {/* Who they are + subscription */}
        <section className="card-shadow overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
          <div className="h-24 bg-linear-to-br from-hero-start to-hero-end" />
          <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Only the avatar is pulled up over the strip; the text starts below it. */}
            <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-start">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="-mt-12 h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-white" />
              ) : (
                <span className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-brand-600 text-3xl font-bold text-white ring-4 ring-white">
                  {(user.name || user.email || "?").trim()[0]?.toUpperCase()}
                </span>
              )}
              <div className="min-w-0 sm:pt-3">
                <h1 className="truncate text-xl font-bold text-slate-900">{user.name}</h1>
                <p dir="ltr" className="truncate text-sm text-slate-500 rtl:text-right">{user.email}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[statusKey]}`}>
                    {t(`admin.users.status.${user._status}`)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {t("admin.profile.memberSince", { date: formatDate(user.createdAt) })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 lg:pt-4">
              <Link
                to={`/admin/chat?user=${user._id}`}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 lg:flex-none"
              >
                <MessagesSquare size={16} />
                {t("admin.profile.openChat")}
              </Link>
              <Link
                to={`/admin/users?search=${encodeURIComponent(user.email)}`}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 lg:flex-none"
              >
                {t("admin.profile.manage")}
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subscription */}
        <section className={card}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <CalendarDays size={16} className="text-slate-400" aria-hidden="true" />
            {t("admin.profile.subscription")}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["admin.users.subscription", t(`admin.home.plans.${user.subscriptionType}`, { defaultValue: user.subscriptionType })],
              ["admin.profile.startedOn", formatDate(user.subscriptionStart)],
              ["admin.users.subscriptionEnd", formatDate(user.subscriptionEnd)],
              ["admin.profile.phone", user.phone || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <dt className="text-slate-500">{t(label)}</dt>
                <dd className="font-semibold text-slate-900" dir={label === "admin.profile.phone" ? "ltr" : undefined}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Usage */}
        <section className={`${card} lg:col-span-2`}>
          <h2 className="text-base font-bold text-slate-900">{t("admin.profile.usage")}</h2>
          {/* Hairline-separated cells (the 1px gaps show the slate background through). */}
          <ul className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-5">
            {usage.map(({ key, icon: Icon }) => (
              <li key={key} className="bg-white p-3.5 last:col-span-2 sm:last:col-span-1">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Icon size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                  {t(`admin.profile.counts.${key}`)}
                </p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{numberFormat.format(counts[key] ?? 0)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <MessagesSquare size={16} />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm text-slate-600">
              {conversation?.lastMessage?.createdAt
                ? t("admin.profile.lastMessage", { date: dateTimeFormat.format(new Date(conversation.lastMessage.createdAt)) })
                : t("admin.profile.noChat")}
            </p>
            {conversation?.unread > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">{conversation.unread}</span>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Renewal requests */}
        <section className={card}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ClipboardCheck size={16} className="text-slate-400" aria-hidden="true" />
            {t("admin.profile.renewals")}
          </h2>
          {renewals.length === 0 ? (
            <p className={emptyBox}>{t("admin.profile.noRenewals")}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {renewals.map((request) => (
                <li key={request._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm">
                  <span className="font-semibold text-slate-800">{t(`admin.home.plans.${request.plan}`)}</span>
                  <span className="text-xs text-slate-500">{formatDate(request.createdAt)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${RENEWAL_PILL[request.status]}`}>
                    {t(`admin.renewals.tabs.${request.status}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Admin history */}
        <section className={card}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <History size={16} className="text-slate-400" aria-hidden="true" />
            {t("admin.profile.history")}
          </h2>
          {logs.length === 0 ? (
            <p className={emptyBox}>{t("admin.auditLogs.empty")}</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {logs.map((log) => (
                <li key={log._id} className="flex gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {t(`admin.auditLogs.actions.${log.action}`, { defaultValue: log.action })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {log.adminName || "—"} · {dateTimeFormat.format(new Date(log.createdAt))}
                    </p>
                    {log.reason && <p className="mt-1 text-xs text-slate-600">“{log.reason}”</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminUserProfilePage;
