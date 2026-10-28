import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Ban,
  CalendarClock,
  CalendarPlus,
  CircleCheck,
  Clock,
  Gift,
  History,
  Inbox,
  Repeat,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import { fetchAdminLogs } from "../../api/adminUsersApi";
import DatePicker from "../../components/common/DatePicker";

const PAGE_SIZE = 20;
const PREVIEW_COUNT = 4;
const ACTIONS = [
  "create_user",
  "extend_subscription",
  "change_plan",
  "add_free_days",
  "suspend",
  "activate",
  "manual_date",
];
const EMPTY_FILTERS = { action: "all", user: "", from: "", to: "" };

// Icon + colors per action, so each kind of operation is recognisable at a glance.
const ACTION_STYLES = {
  create_user: { icon: UserPlus, tone: "bg-emerald-50 text-emerald-600", pill: "bg-emerald-50 text-emerald-700" },
  extend_subscription: { icon: CalendarPlus, tone: "bg-sky-50 text-sky-600", pill: "bg-sky-50 text-sky-700" },
  change_plan: { icon: Repeat, tone: "bg-violet-50 text-violet-600", pill: "bg-violet-50 text-violet-700" },
  add_free_days: { icon: Gift, tone: "bg-amber-50 text-amber-600", pill: "bg-amber-50 text-amber-700" },
  suspend: { icon: Ban, tone: "bg-red-50 text-red-600", pill: "bg-red-50 text-red-700" },
  activate: { icon: CircleCheck, tone: "bg-emerald-50 text-emerald-600", pill: "bg-emerald-50 text-emerald-700" },
  manual_date: { icon: CalendarClock, tone: "bg-indigo-50 text-indigo-600", pill: "bg-indigo-50 text-indigo-700" },
};
const DEFAULT_ACTION_STYLE = { icon: History, tone: "bg-slate-100 text-slate-600", pill: "bg-slate-100 text-slate-700" };

function PersonChip({ person, label, fallback }) {
  const name = person?.name || person?.email || fallback;
  const initial = name.trim()[0]?.toUpperCase() || "?";
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
        {initial}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] text-slate-400">{label}</span>
        <span className="block truncate text-sm font-semibold text-slate-800">{name}</span>
      </span>
    </span>
  );
}

function AdminAuditLogPage() {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loadedAt, setLoadedAt] = useState(0); // "now" for the relative times, taken when the logs arrive
  const [showAll, setShowAll] = useState(false);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [request, setRequest] = useState({ key: "", status: "loading", error: "" });
  const requestKey = JSON.stringify({ appliedFilters, page });
  const isLoading = request.key !== requestKey || request.status === "loading";

  useEffect(() => {
    const controller = new AbortController();
    const params = {
      page,
      limit: PAGE_SIZE,
      ...(appliedFilters.action !== "all" && { action: appliedFilters.action }),
      ...(appliedFilters.user.trim() && { user: appliedFilters.user.trim() }),
      ...(appliedFilters.from && { from: appliedFilters.from }),
      ...(appliedFilters.to && { to: appliedFilters.to }),
    };

    fetchAdminLogs(params, { signal: controller.signal })
      .then(({ data }) => {
        setLogs(data.data);
        setPagination(data.pagination);
        setLoadedAt(Date.now());
        setRequest({ key: requestKey, status: "succeeded", error: "" });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setRequest({
          key: requestKey,
          status: "failed",
          error: error.response?.data?.message ?? t("admin.auditLogs.loadError"),
        });
      });

    return () => controller.abort();
  }, [appliedFilters, page, requestKey, t]);

  const handleFilterChange = ({ target }) => {
    setFilters((current) => ({ ...current, [target.name]: target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setShowAll(false);
    setAppliedFilters({ ...filters, user: filters.user.trim() });
  };

  // Action chips filter straight away; the text/date fields wait for "apply".
  const pickAction = (action) => {
    setFilters((current) => ({ ...current, action }));
    setAppliedFilters((current) => ({ ...current, action }));
    setPage(1);
    setShowAll(false);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    setShowAll(false);
  };

  const formatDateTime = (value) => {
    if (!value) return t("admin.auditLogs.notAvailable");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("admin.auditLogs.notAvailable");
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const PLAN_KEYS = ["oldPlan", "newPlan", "subscriptionType"];
  const formatDetailValue = (key, value) => {
    if (value === null || value === undefined || value === "") return t("admin.auditLogs.notAvailable");
    if (typeof value === "boolean") return t(value ? "admin.auditLogs.yes" : "admin.auditLogs.no");
    if (PLAN_KEYS.includes(key)) return t(`admin.home.plans.${value}`, { defaultValue: String(value) });
    if (key === "days" || key === "customDays") return t("admin.auditLogs.daysValue", { count: value });
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Details as small label/value chips instead of raw JSON.
  const renderDetails = (details) => {
    const entries = details ? Object.entries(details) : [];
    if (entries.length === 0) return null;
    return (
      // Label at the start, value at the end — one row each, so it fits a quarter-width card.
      <dl className="mt-3 space-y-1.5 rounded-lg bg-slate-50 p-2.5 text-xs">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-slate-500">{t(`admin.auditLogs.fields.${key}`, { defaultValue: key })}</dt>
            <dd className="min-w-0 break-words text-end font-semibold text-slate-800">{formatDetailValue(key, value)}</dd>
          </div>
        ))}
      </dl>
    );
  };

  // "5 minutes ago" style for the last week, the full date after that (and always in the tooltip).
  const relativeTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("admin.auditLogs.notAvailable");
    const seconds = Math.round((date.getTime() - loadedAt) / 1000);
    const absolute = Math.abs(seconds);
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });
    if (absolute < 60) return rtf.format(seconds, "second");
    if (absolute < 3600) return rtf.format(Math.round(seconds / 60), "minute");
    if (absolute < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
    if (absolute < 604800) return rtf.format(Math.round(seconds / 86400), "day");
    return formatDateTime(value);
  };

  // Day headings for the timeline: today, yesterday, or the date.
  const affectedUsers = new Set(logs.map((entry) => entry.user?._id).filter(Boolean)).size;

  // Only the first few entries until "show all" is pressed.
  const visibleLogs = showAll ? logs : logs.slice(0, PREVIEW_COUNT);
  const hasMore = logs.length > PREVIEW_COUNT || pagination.pages > 1;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero: what this page is, with a few numbers at a glance. */}
      <section className="relative mb-5 overflow-hidden rounded-2xl bg-linear-to-br from-hero-start to-hero-end p-5 text-white shadow-(--hero-shadow) sm:p-7">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{t("admin.auditLogs.title")}</h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">{t("admin.auditLogs.subtitle")}</p>
            </div>
          </div>
          {/* Numbers split by hairlines rather than boxed. */}
          <dl className="grid grid-cols-2 gap-y-4 sm:grid-cols-3 sm:divide-x sm:divide-white/10 sm:rtl:divide-x-reverse lg:w-auto">
            {[
              { icon: History, label: t("admin.auditLogs.statTotal"), value: pagination.total },
              { icon: Users, label: t("admin.auditLogs.statUsers"), value: affectedUsers },
              { icon: Clock, label: t("admin.auditLogs.statLast"), value: logs[0] ? relativeTime(logs[0].createdAt) : "—" },
            ].map(({ icon: StatIcon, label, value }) => (
              <div key={label} className="min-w-0 last:col-span-2 sm:px-5 sm:first:ps-0 sm:last:col-span-1">
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <StatIcon size={13} aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </dt>
                <dd className="tabular-amount mt-1 truncate text-lg font-bold sm:text-xl">{isLoading ? "…" : value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Filters: action chips apply at once; user and dates apply with the button. */}
      <form onSubmit={applyFilters} className="card-shadow mb-5 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <SlidersHorizontal size={17} />
            </span>
            <h2 className="text-base font-bold text-slate-900">{t("admin.auditLogs.filtersTitle")}</h2>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="submit"
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition hover:bg-brand-700 sm:flex-none"
            >
              <Search size={15} />
              {t("admin.auditLogs.applyFilters")}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none"
            >
              {t("admin.auditLogs.clear")}
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div role="radiogroup" aria-label={t("admin.auditLogs.action")} className="no-scrollbar flex gap-2 overflow-x-auto">
            {["all", ...ACTIONS].map((action) => {
              const selected = filters.action === action;
              const style = ACTION_STYLES[action];
              const ChipIcon = style?.icon || History;
              return (
                <button
                  key={action}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => pickAction(action)}
                  className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition ${
                    selected
                      ? "border-navy-900 bg-navy-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <ChipIcon size={14} className={selected ? "text-white" : style ? style.tone.split(" ").find((c) => c.startsWith("text-")) : "text-slate-400"} />
                  {action === "all" ? t("admin.auditLogs.allActions") : t(`admin.auditLogs.actions.${action}`)}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
            <div>
              <label htmlFor="audit-user" className="text-sm font-semibold text-slate-700">{t("admin.auditLogs.user")}</label>
              <div className="relative mt-1.5">
                <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="audit-user"
                  name="user"
                  type="search"
                  maxLength={100}
                  value={filters.user}
                  onChange={handleFilterChange}
                  placeholder={t("admin.auditLogs.userPlaceholder")}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 ps-9 pe-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label htmlFor="audit-from" className="text-sm font-semibold text-slate-700">{t("admin.auditLogs.from")}</label>
              <DatePicker
                id="audit-from"
                value={filters.from}
                onChange={(value) => handleFilterChange({ target: { name: "from", value } })}
                max={filters.to || undefined}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-500"
              />
            </div>
            <div>
              <label htmlFor="audit-to" className="text-sm font-semibold text-slate-700">{t("admin.auditLogs.to")}</label>
              <DatePicker
                id="audit-to"
                value={filters.to}
                onChange={(value) => handleFilterChange({ target: { name: "to", value } })}
                min={filters.from || undefined}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      </form>

      <section className="card-shadow overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <History size={16} className="text-slate-400" aria-hidden="true" />
              {t("admin.auditLogs.listTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500" aria-live="polite">
              {t("admin.auditLogs.total", { count: pagination.total })}
            </p>
          </div>
          {!isLoading && request.status === "succeeded" && hasMore && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="text-sm font-semibold text-brand-700 underline underline-offset-4 transition hover:text-brand-800"
            >
              {showAll ? t("admin.auditLogs.showLess") : t("admin.auditLogs.showAll")}
            </button>
          )}
        </header>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <ul className="space-y-4" aria-label={t("common.loading")}>
              {[0, 1, 2].map((item) => (
                <li key={item} className="flex gap-4">
                  <span className="skeleton h-11 w-11 shrink-0 rounded-2xl" />
                  <div className="flex-1 space-y-2 rounded-2xl border border-slate-100 p-4">
                    <span className="skeleton block h-4 w-1/3 rounded-full" />
                    <span className="skeleton block h-3 w-2/3 rounded-full" />
                  </div>
                </li>
              ))}
            </ul>
          ) : request.status === "failed" ? (
            <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{request.error}</div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox size={26} />
              </span>
              <p className="text-sm text-slate-500">{t("admin.auditLogs.empty")}</p>
            </div>
          ) : (
            /* One continuous grid, four cards to a row on wide screens (each card shows its own time). */
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {visibleLogs.map((entry) => {
                        const style = ACTION_STYLES[entry.action] || DEFAULT_ACTION_STYLE;
                        const ActionIcon = style.icon;
                        return (
                          <li key={entry._id} className="min-w-0">
                            <article className="card-hover flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.pill}`}>
                                  <ActionIcon size={12} className="shrink-0" aria-hidden="true" />
                                  <span className="truncate">{t(`admin.auditLogs.actions.${entry.action}`, { defaultValue: entry.action })}</span>
                                </span>
                                <time
                                  dateTime={entry.createdAt}
                                  title={formatDateTime(entry.createdAt)}
                                  className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-400"
                                >
                                  <Clock size={12} />
                                  {relativeTime(entry.createdAt)}
                                </time>
                              </div>

                              <div className="mt-3 space-y-2">
                                <PersonChip person={entry.admin} label={t("admin.auditLogs.admin")} fallback={t("admin.auditLogs.deletedPerson")} />
                                <PersonChip person={entry.user} label={t("admin.auditLogs.targetUser")} fallback={t("admin.auditLogs.deletedPerson")} />
                              </div>

                              {renderDetails(entry.details)}

                              {entry.reason && (
                                <p className="mt-3 whitespace-pre-wrap break-words border-s-2 border-slate-200 ps-3 text-sm text-slate-600">
                                  {entry.reason}
                                </p>
                              )}
                            </article>
                          </li>
                        );
                      })}
            </ul>
          )}

        {!isLoading && request.status === "succeeded" && showAll && pagination.pages > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("admin.auditLogs.previous")}
            </button>
            <span className="text-sm text-slate-500">
              {t("admin.auditLogs.page", { page: pagination.page, pages: pagination.pages })}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => current + 1)}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("admin.auditLogs.next")}
            </button>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}

export default AdminAuditLogPage;
