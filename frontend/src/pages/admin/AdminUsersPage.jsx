import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  ClipboardCheck,
  Inbox,
  Megaphone,
  MessageCircle,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  activateAdminUser,
  createAdminUser,
  fetchAdminUsers,
  suspendAdminUser,
  updateAdminUserSubscription,
} from "../../api/adminUsersApi";
import PageHeader from "../../components/common/PageHeader";
import FormModal from "../../components/common/FormModal";
import Select from "../../components/common/Select";
import UserActionsMenu from "./users/UserActionsMenu";
import { fetchRenewals } from "../../api/adminExtrasApi";
import { fetchChatContacts } from "../../api/chatApi";

const PAGE_SIZE = 20;
const STATUSES = ["all", "active", "expiring", "expired", "suspended"];
const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700",
  expiring: "bg-amber-50 text-amber-700",
  expired: "bg-slate-100 text-slate-700",
  suspended: "bg-red-50 text-red-700",
};
const STATUS_DOTS = {
  active: "bg-emerald-500",
  expiring: "bg-amber-500",
  expired: "bg-slate-400",
  suspended: "bg-red-500",
};
// Avatar colours, picked from the name so each user keeps the same one.
const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];
const DAY_MS = 24 * 60 * 60 * 1000;
const PLANS = ["all", "trial", "3months", "6months", "yearly", "custom"];
const EMPTY_CREATE_FORM = {
  name: "",
  email: "",
  password: "",
  subscriptionType: "trial",
  customDays: "30",
};
const PREVIEW_COUNT = 4;
const EMPTY_PLAN_FORM = { subscriptionType: "trial", customDays: "30" };

function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const initialStatus = STATUSES.includes(searchParams.get("status")) ? searchParams.get("status") : "all";
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const [status, setStatus] = useState(initialStatus);
  const [plan, setPlan] = useState("all");
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [request, setRequest] = useState({ key: "", status: "loading", error: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createStatus, setCreateStatus] = useState("idle");
  const [createError, setCreateError] = useState("");
  const [creationNotice, setCreationNotice] = useState({ type: "", message: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [planStatus, setPlanStatus] = useState("idle");
  const [planError, setPlanError] = useState("");
  const [extendingUser, setExtendingUser] = useState(null);
  const [extensionDays, setExtensionDays] = useState("30");
  const [extensionStatus, setExtensionStatus] = useState("idle");
  const [extensionError, setExtensionError] = useState("");
  const [freeDaysUser, setFreeDaysUser] = useState(null);
  const [freeDays, setFreeDays] = useState("7");
  const [freeDaysReason, setFreeDaysReason] = useState("");
  const [freeDaysStatus, setFreeDaysStatus] = useState("idle");
  const [freeDaysError, setFreeDaysError] = useState("");
  const [manualDateUser, setManualDateUser] = useState(null);
  const [manualEndDate, setManualEndDate] = useState("");
  const [manualDateReason, setManualDateReason] = useState("");
  const [manualDateStatus, setManualDateStatus] = useState("idle");
  const [manualDateError, setManualDateError] = useState("");
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendStatus, setSuspendStatus] = useState("idle");
  const [suspendError, setSuspendError] = useState("");
  const [activatingUserId, setActivatingUserId] = useState("");
  // Extra signals per user from the newer admin tools: a waiting renewal request, unread chat.
  const [renewalsByUser, setRenewalsByUser] = useState({});
  const [pendingRenewals, setPendingRenewals] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState({});
  const navigate = useNavigate();
  const requestKey = JSON.stringify({ page, search, plan, status, reloadKey });
  const isLoading = request.key !== requestKey || request.status === "loading";

  useEffect(() => {
    const controller = new AbortController();

    fetchAdminUsers({ page, limit: PAGE_SIZE, search, plan, status }, { signal: controller.signal })
      .then(({ data }) => {
        setUsers(data.data);
        setPagination(data.pagination);
        setLoadedAt(Date.now());
        setRequest({ key: requestKey, status: "succeeded", error: "" });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setRequest({
          key: requestKey,
          status: "failed",
          error: error.response?.data?.message ?? t("admin.users.loadError"),
        });
      });

    return () => controller.abort();
  }, [page, plan, reloadKey, requestKey, search, status, t]);

  const loadSignals = useCallback(async () => {
    try {
      const [{ data: renewals }, { data: contacts }] = await Promise.all([
        fetchRenewals({ status: "pending" }),
        fetchChatContacts({ page: 1 }),
      ]);
      setPendingRenewals(renewals.pendingCount || 0);
      setRenewalsByUser(Object.fromEntries(renewals.data.filter((item) => item.user).map((item) => [item.user._id, item])));
      setUnreadByUser(Object.fromEntries(contacts.data.filter((item) => item.unread > 0).map((item) => [item._id, item.unread])));
    } catch {
      // The list still works without these hints.
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadSignals, 0);
    return () => clearTimeout(timer);
  }, [loadSignals, reloadKey]);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setShowAll(false);
    setSearch(searchInput.trim());
  };

  const handleCreateChange = ({ target }) => {
    setCreateForm((previous) => ({ ...previous, [target.name]: target.value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreateStatus("loading");
    setCreateError("");
    setCreationNotice({ type: "", message: "" });

    try {
      const { data } = await createAdminUser({
        ...createForm,
        customDays: Number(createForm.customDays),
      });
      setCreationNotice({
        type: data.setupEmailSent ? "success" : "warning",
        message: data.setupEmailSent
          ? t("admin.users.createSuccess")
          : t("admin.users.createEmailFailed"),
      });
      setCreateForm(EMPTY_CREATE_FORM);
      setCreateStatus("idle");
      setShowCreateForm(false);
      setPage(1);
      setSearch("");
      setSearchInput("");
      setStatus("all");
      setPlan("all");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setCreateError(error.response?.data?.message ?? t("admin.users.createError"));
      setCreateStatus("failed");
    }
  };

  const openPlanEditor = (user) => {
    setEditingUser(user);
    setPlanForm({ ...EMPTY_PLAN_FORM, subscriptionType: user.subscriptionType ?? "trial" });
    setPlanError("");
    setPlanStatus("idle");
    setCreationNotice({ type: "", message: "" });
  };

  const handlePlanChange = ({ target }) => {
    setPlanForm((previous) => ({ ...previous, [target.name]: target.value }));
  };

  const handleUpdatePlan = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    setPlanStatus("loading");
    setPlanError("");

    try {
      const { data } = await updateAdminUserSubscription(editingUser._id, {
        subscriptionType: planForm.subscriptionType,
        customDays: Number(planForm.customDays),
      });
      const updatedUser = data.data;
      setUsers((current) => current.map((user) => (
        user._id === updatedUser._id ? updatedUser : user
      )));
      setCreationNotice({
        type: "success",
        message: t("admin.users.planUpdated", {
          name: updatedUser.name,
          oldDate: formatDate(editingUser.subscriptionEnd),
          newDate: formatDate(updatedUser.subscriptionEnd),
        }),
      });
      setEditingUser(null);
      setPlanStatus("idle");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setPlanError(error.response?.data?.message ?? t("admin.users.planUpdateError"));
      setPlanStatus("failed");
    }
  };

  const openExtensionForm = (user) => {
    setExtendingUser(user);
    setExtensionDays("30");
    setExtensionError("");
    setExtensionStatus("idle");
    setCreationNotice({ type: "", message: "" });
  };

  const handleExtendSubscription = async (event) => {
    event.preventDefault();
    if (!extendingUser) return;
    setExtensionStatus("loading");
    setExtensionError("");

    try {
      const { data } = await updateAdminUserSubscription(extendingUser._id, {
        extensionDays: Number(extensionDays),
      });
      const updatedUser = data.data;
      setUsers((current) => current.map((user) => (
        user._id === updatedUser._id ? updatedUser : user
      )));
      setCreationNotice({
        type: "success",
        message: t("admin.users.subscriptionExtended", {
          name: updatedUser.name,
          days: Number(extensionDays),
          oldDate: formatDate(extendingUser.subscriptionEnd),
          newDate: formatDate(updatedUser.subscriptionEnd),
        }),
      });
      setExtendingUser(null);
      setExtensionStatus("idle");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setExtensionError(error.response?.data?.message ?? t("admin.users.extendError"));
      setExtensionStatus("failed");
    }
  };

  const openFreeDaysForm = (user) => {
    setFreeDaysUser(user);
    setFreeDays("7");
    setFreeDaysReason("");
    setFreeDaysError("");
    setFreeDaysStatus("idle");
    setCreationNotice({ type: "", message: "" });
  };

  const handleAddFreeDays = async (event) => {
    event.preventDefault();
    if (!freeDaysUser) return;
    setFreeDaysStatus("loading");
    setFreeDaysError("");

    try {
      const days = Number(freeDays);
      const { data } = await updateAdminUserSubscription(freeDaysUser._id, {
        freeDays: days,
        reason: freeDaysReason.trim() || undefined,
      });
      const updatedUser = data.data;
      setUsers((current) => current.map((user) => (
        user._id === updatedUser._id ? updatedUser : user
      )));
      setCreationNotice({
        type: "success",
        message: t("admin.users.freeDaysAdded", {
          name: updatedUser.name,
          days,
          oldDate: formatDate(freeDaysUser.subscriptionEnd),
          newDate: formatDate(updatedUser.subscriptionEnd),
        }),
      });
      setFreeDaysUser(null);
      setFreeDaysStatus("idle");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setFreeDaysError(error.response?.data?.message ?? t("admin.users.freeDaysError"));
      setFreeDaysStatus("failed");
    }
  };

  const openManualDateForm = (user) => {
    setManualDateUser(user);
    setManualEndDate(user.subscriptionEnd ? new Date(user.subscriptionEnd).toISOString().slice(0, 10) : "");
    setManualDateReason("");
    setManualDateError("");
    setManualDateStatus("idle");
    setCreationNotice({ type: "", message: "" });
  };

  const handleSetManualEndDate = async (event) => {
    event.preventDefault();
    if (!manualDateUser) return;
    if (!manualEndDate || !manualDateReason.trim()) {
      setManualDateError(t("admin.users.manualDateRequired"));
      setManualDateStatus("failed");
      return;
    }
    setManualDateStatus("loading");
    setManualDateError("");

    try {
      const { data } = await updateAdminUserSubscription(manualDateUser._id, {
        subscriptionEnd: manualEndDate,
        reason: manualDateReason.trim(),
      });
      const updatedUser = data.data;
      setUsers((current) => current.map((user) => (
        user._id === updatedUser._id ? updatedUser : user
      )));
      setCreationNotice({
        type: "success",
        message: t("admin.users.manualDateUpdated", {
          name: updatedUser.name,
          oldDate: formatDate(manualDateUser.subscriptionEnd),
          newDate: formatDate(updatedUser.subscriptionEnd),
        }),
      });
      setManualDateUser(null);
      setManualDateStatus("idle");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setManualDateError(error.response?.data?.message ?? t("admin.users.manualDateError"));
      setManualDateStatus("failed");
    }
  };

  const openSuspendForm = (user) => {
    setSuspendingUser(user);
    setSuspendReason("");
    setSuspendError("");
    setSuspendStatus("idle");
    setCreationNotice({ type: "", message: "" });
  };

  const handleSuspendUser = async (event) => {
    event.preventDefault();
    if (!suspendingUser) return;
    const reason = suspendReason.trim();
    if (!reason) {
      setSuspendError(t("admin.users.suspendReasonRequired"));
      setSuspendStatus("failed");
      return;
    }

    setSuspendStatus("loading");
    setSuspendError("");
    try {
      const { data } = await suspendAdminUser(suspendingUser._id, reason);
      const updatedUser = data.data;
      setUsers((current) => current.map((user) => (
        user._id === updatedUser._id ? updatedUser : user
      )));
      setCreationNotice({
        type: "success",
        message: t("admin.users.suspendSuccess", { name: updatedUser.name }),
      });
      setSuspendingUser(null);
      setSuspendStatus("idle");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSuspendError(error.response?.data?.message ?? t("admin.users.suspendError"));
      setSuspendStatus("failed");
    }
  };

  const handleActivateUser = async (user) => {
    setActivatingUserId(user._id);
    setCreationNotice({ type: "", message: "" });
    try {
      const { data } = await activateAdminUser(user._id);
      const updatedUser = data.data;
      setUsers((current) => current.map((currentUser) => (
        currentUser._id === updatedUser._id ? updatedUser : currentUser
      )));
      setCreationNotice({
        type: "success",
        message: t("admin.users.activateSuccess", {
          name: updatedUser.name,
          status: t(`admin.users.status.${updatedUser._status}`),
        }),
      });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setCreationNotice({
        type: "warning",
        message: error.response?.data?.message ?? t("admin.users.activateError"),
      });
    } finally {
      setActivatingUserId("");
    }
  };

  const formatDate = (value) => {
    if (!value) return t("admin.users.noEndDate");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("admin.users.noEndDate");
    return new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(date);
  };

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
    setShowAll(false);
  };

  // One user: who they are, their plan and end date, then the main action and a "⋯" menu.
  const renderUserCard = (user) => {
    const name = user.name || user.email || "?";
    const tone = AVATAR_TONES[name.charCodeAt(0) % AVATAR_TONES.length];
    const end = user.subscriptionEnd ? new Date(user.subscriptionEnd).getTime() : NaN;
    const daysLeft = Number.isNaN(end) || !loadedAt ? null : Math.ceil((end - loadedAt) / DAY_MS);
    const statusKey = STATUS_STYLES[user._status] ? user._status : "active";
    const renewal = renewalsByUser[user._id];
    const unread = unreadByUser[user._id] || 0;

    return (
      <li key={user._id} className="card-hover flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone}`}>
            {name.trim()[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <Link to={`/admin/users/${user._id}`} className="block truncate text-sm font-semibold text-slate-900 hover:underline">
              {user.name}
            </Link>
            <p dir="ltr" className="truncate text-xs text-slate-500 rtl:text-right">{user.email}</p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[statusKey]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[statusKey]}`} />
            {t(`admin.users.status.${user._status}`, { defaultValue: user._status })}
          </span>
        </div>

        {(renewal || unread > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {renewal && (
              <Link
                to="/admin/renewals"
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100"
              >
                <ClipboardCheck size={12} />
                {t("admin.users.renewalBadge", { plan: t(`admin.home.plans.${renewal.plan}`) })}
              </Link>
            )}
            {unread > 0 && (
              <Link
                to={`/admin/chat?user=${user._id}`}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
              >
                <MessageCircle size={12} />
                {t("admin.users.unreadBadge", { count: unread })}
              </Link>
            )}
          </div>
        )}

        <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
          <div>
            <dt className="text-slate-500">{t("admin.users.subscription")}</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-800">
              {t(`admin.users.plan.${user.subscriptionType}`, { defaultValue: user.subscriptionType })}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-slate-500">
              <CalendarDays size={12} aria-hidden="true" />
              {t("admin.users.subscriptionEnd")}
            </dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-800">{formatDate(user.subscriptionEnd)}</dd>
            {daysLeft !== null && daysLeft > 0 && (
              <dd className={`mt-0.5 font-semibold ${daysLeft <= 7 ? "text-amber-600" : "text-income"}`}>
                {t("admin.home.daysRemaining", { days: daysLeft })}
              </dd>
            )}
          </div>
        </dl>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => openPlanEditor(user)}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Repeat size={15} aria-hidden="true" />
            {t("admin.users.changePlan")}
          </button>
          <Link
            to={`/admin/chat?user=${user._id}`}
            aria-label={t("admin.users.sendMessage")}
            title={t("admin.users.sendMessage")}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <MessageCircle size={17} />
            {unread > 0 && <span className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white inset-e-[-0.25rem]" />}
          </Link>
          <UserActionsMenu
            user={user}
            t={t}
            busy={activatingUserId === user._id}
            onProfile={() => navigate(`/admin/users/${user._id}`)}
            onChat={() => navigate(`/admin/chat?user=${user._id}`)}
            onExtend={() => openExtensionForm(user)}
            onFreeDays={() => openFreeDaysForm(user)}
            onManualDate={() => openManualDateForm(user)}
            onSuspend={() => openSuspendForm(user)}
            onActivate={() => handleActivateUser(user)}
          />
        </div>
      </li>
    );
  };

  // Only the first few users until "show all" is pressed.
  const visibleUsers = showAll ? users : users.slice(0, PREVIEW_COUNT);
  const hasMore = users.length > PREVIEW_COUNT || pagination.pages > 1;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        icon={Users}
        title={t("admin.users.title")}
        subtitle={t("admin.users.subtitle")}
        actions={
          <>
          <Link
            to="/admin/announcements"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
          >
            <Megaphone size={17} />
            {t("admin.users.sendAnnouncement")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              setCreateError("");
              setCreationNotice({ type: "", message: "" });
            }}
            aria-expanded={showCreateForm}
            aria-controls="admin-create-user"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Plus size={17} />
            {t("admin.users.createAction")}
          </button>
          </>
        }
      />

      {/* Waiting renewal requests: a gentle nudge with a way straight there. */}
      {pendingRenewals > 0 && (
        <Link
          to="/admin/renewals"
          className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 transition hover:bg-amber-100/70"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
            <ClipboardCheck size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-amber-900">{t("admin.users.renewalsBanner", { count: pendingRenewals })}</span>
            <span className="block text-xs text-amber-800/80">{t("admin.users.renewalsBannerHint")}</span>
          </span>
          <ArrowLeft size={17} className="shrink-0 text-amber-700 ltr:rotate-180" />
        </Link>
      )}

      {creationNotice.message && (
        <div
          role="status"
          className={`mb-4 rounded-xl p-4 text-sm font-medium ${creationNotice.type === "warning" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}
        >
          {creationNotice.message}
        </div>
      )}

      {showCreateForm && (
        <FormModal
          title={t("admin.users.createTitle")}
          onClose={() => { setShowCreateForm(false); setCreateError(""); }}
          closeDisabled={createStatus === "loading"}
        >
          <form id="admin-create-user" onSubmit={handleCreateUser} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              {t("admin.users.name")}
              <input
                name="name"
                required
                maxLength={120}
                autoComplete="name"
                value={createForm.name}
                onChange={handleCreateChange}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              {t("admin.users.email")}
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                value={createForm.email}
                onChange={handleCreateChange}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-start font-normal outline-none focus:border-brand-500"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              {t("admin.users.password")}
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={createForm.password}
                onChange={handleCreateChange}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              {t("admin.users.planFilter")}
              <Select
                name="subscriptionType"
                value={createForm.subscriptionType}
                onChange={handleCreateChange}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-brand-500"
              >
                {PLANS.filter((value) => value !== "all").map((value) => (
                  <option key={value} value={value}>{t(`admin.users.plan.${value}`)}</option>
                ))}
              </Select>
            </label>
            {createForm.subscriptionType === "custom" && (
              <label className="text-sm font-semibold text-slate-700">
                {t("admin.users.customDays")}
                <input
                  name="customDays"
                  type="number"
                  min={1}
                  max={3650}
                  required
                  value={createForm.customDays}
                  onChange={handleCreateChange}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
                />
              </label>
            )}
            {createError && (
              <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 sm:col-span-2">
                {createError}
              </div>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={createStatus === "loading"}
                className="min-h-11 w-full rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
              >
                {createStatus === "loading" ? t("admin.users.creating") : t("admin.users.createSubmit")}
              </button>
            </div>
          </form>
        </FormModal>
      )}

      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && planStatus !== "loading") setEditingUser(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-change-plan-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="admin-change-plan-title" className="text-lg font-extrabold text-slate-900">
                  {t("admin.users.changePlanTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{editingUser.name}</p>
              </div>
              <button
                type="button"
                aria-label={t("common.close")}
                disabled={planStatus === "loading"}
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                {t("admin.users.newPlan")}
                <Select
                  name="subscriptionType"
                  value={planForm.subscriptionType}
                  onChange={handlePlanChange}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-brand-500"
                >
                  {PLANS.filter((value) => value !== "all").map((value) => (
                    <option key={value} value={value}>{t(`admin.users.plan.${value}`)}</option>
                  ))}
                </Select>
              </label>
              {planForm.subscriptionType === "custom" && (
                <label className="block text-sm font-semibold text-slate-700">
                  {t("admin.users.customDays")}
                  <input
                    name="customDays"
                    type="number"
                    min={1}
                    max={3650}
                    required
                    value={planForm.customDays}
                    onChange={handlePlanChange}
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
                  />
                </label>
              )}
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <p>{t("admin.users.currentPlan", { plan: t(`admin.users.plan.${editingUser.subscriptionType}`) })}</p>
                <p className="mt-1">{t("admin.users.currentEndDate", { date: formatDate(editingUser.subscriptionEnd) })}</p>
              </div>
              {planError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {planError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={planStatus === "loading"}
                  onClick={() => setEditingUser(null)}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={planStatus === "loading"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <Check size={16} />
                  {planStatus === "loading" ? t("admin.users.savingPlan") : t("admin.users.savePlan")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {extendingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && extensionStatus !== "loading") setExtendingUser(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-extend-subscription-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="admin-extend-subscription-title" className="text-lg font-extrabold text-slate-900">
                  {t("admin.users.extendTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{extendingUser.name}</p>
              </div>
              <button
                type="button"
                aria-label={t("common.close")}
                disabled={extensionStatus === "loading"}
                onClick={() => setExtendingUser(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleExtendSubscription} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                {t("admin.users.extensionDays")}
                <input
                  name="extensionDays"
                  type="number"
                  min={1}
                  max={3650}
                  required
                  value={extensionDays}
                  onChange={(event) => setExtensionDays(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
                />
              </label>
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <p>{t("admin.users.currentEndDate", { date: formatDate(extendingUser.subscriptionEnd) })}</p>
                <p className="mt-1">{t("admin.users.extensionRule")}</p>
              </div>
              {extensionError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {extensionError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={extensionStatus === "loading"}
                  onClick={() => setExtendingUser(null)}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={extensionStatus === "loading"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw size={16} />
                  {extensionStatus === "loading" ? t("admin.users.extending") : t("admin.users.extendSubmit")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {freeDaysUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && freeDaysStatus !== "loading") setFreeDaysUser(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-free-days-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="admin-free-days-title" className="text-lg font-extrabold text-slate-900">
                  {t("admin.users.freeDaysTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{freeDaysUser.name}</p>
              </div>
              <button
                type="button"
                aria-label={t("common.close")}
                disabled={freeDaysStatus === "loading"}
                onClick={() => setFreeDaysUser(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddFreeDays} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                {t("admin.users.freeDaysCount")}
                <input
                  name="freeDays"
                  type="number"
                  min={1}
                  required
                  value={freeDays}
                  onChange={(event) => setFreeDays(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {t("admin.users.reason")}
                <textarea
                  name="reason"
                  maxLength={500}
                  rows={3}
                  value={freeDaysReason}
                  onChange={(event) => setFreeDaysReason(event.target.value)}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-brand-500"
                />
              </label>
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <p>{t("admin.users.currentEndDate", { date: formatDate(freeDaysUser.subscriptionEnd) })}</p>
                <p className="mt-1">{t("admin.users.freeDaysRule")}</p>
              </div>
              {freeDaysError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {freeDaysError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={freeDaysStatus === "loading"}
                  onClick={() => setFreeDaysUser(null)}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={freeDaysStatus === "loading"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <Plus size={16} />
                  {freeDaysStatus === "loading" ? t("admin.users.addingFreeDays") : t("admin.users.addFreeDays")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {manualDateUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && manualDateStatus !== "loading") setManualDateUser(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-manual-date-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="admin-manual-date-title" className="text-lg font-extrabold text-slate-900">
                  {t("admin.users.manualDateTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{manualDateUser.name}</p>
              </div>
              <button
                type="button"
                aria-label={t("common.close")}
                disabled={manualDateStatus === "loading"}
                onClick={() => setManualDateUser(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSetManualEndDate} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                {t("admin.users.manualEndDate")}
                <input
                  name="subscriptionEnd"
                  type="date"
                  required
                  value={manualEndDate}
                  onChange={(event) => setManualEndDate(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {t("admin.users.manualDateReason")}
                <textarea
                  name="reason"
                  required
                  maxLength={500}
                  rows={3}
                  value={manualDateReason}
                  onChange={(event) => setManualDateReason(event.target.value)}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-brand-500"
                />
              </label>
              {manualDateError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {manualDateError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={manualDateStatus === "loading"}
                  onClick={() => setManualDateUser(null)}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={manualDateStatus === "loading"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <Check size={16} />
                  {manualDateStatus === "loading" ? t("admin.users.savingManualDate") : t("admin.users.saveManualDate")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {suspendingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && suspendStatus !== "loading") setSuspendingUser(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-suspend-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="admin-suspend-title" className="text-lg font-extrabold text-slate-900">
                  {t("admin.users.suspendTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{suspendingUser.name}</p>
              </div>
              <button
                type="button"
                aria-label={t("common.close")}
                disabled={suspendStatus === "loading"}
                onClick={() => setSuspendingUser(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSuspendUser} className="space-y-4">
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {t("admin.users.suspendWarning")}
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                {t("admin.users.suspendReason")}
                <textarea
                  name="reason"
                  required
                  maxLength={500}
                  rows={3}
                  value={suspendReason}
                  onChange={(event) => setSuspendReason(event.target.value)}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-red-500"
                />
              </label>
              {suspendError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {suspendError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={suspendStatus === "loading"}
                  onClick={() => setSuspendingUser(null)}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={suspendStatus === "loading"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <Ban size={16} />
                  {suspendStatus === "loading" ? t("admin.users.suspending") : t("admin.users.confirmSuspend")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Phones: no outer frame, so the user cards get the full width (no box inside a box). */}
      <section className="sm:card-shadow sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:border-b sm:border-slate-100 sm:px-6 sm:py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Users size={16} className="text-slate-400" aria-hidden="true" />
              {t("admin.users.listTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500" aria-live="polite">
              {t("admin.users.total", { count: pagination.total })}
            </p>
          </div>
          {!isLoading && request.status === "succeeded" && hasMore && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-accent-600 hover:decoration-current emerald:hover:text-brand-600"
            >
              {showAll ? t("admin.auditLogs.showLess") : t("admin.auditLogs.showAll")}
            </button>
          )}
        </header>

        <div className="sm:p-6">
          {/* Filters: status as tabs, then search and plan. */}
          <div className="mb-5 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div role="tablist" aria-label={t("admin.users.statusFilter")} className="no-scrollbar flex max-w-full gap-1 self-start overflow-x-auto rounded-xl bg-slate-100 p-1">
              {STATUSES.map((value) => {
                const selected = status === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => changeStatus(value)}
                    className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold transition ${
                      selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {value !== "all" && <span className={`h-2 w-2 rounded-full ${STATUS_DOTS[value]}`} />}
                    {t(`admin.users.status.${value}`)}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] 2xl:w-[34rem]">
              <form onSubmit={applySearch} role="search" className="relative min-w-0">
                <label className="block min-w-0">
                  <span className="sr-only">{t("admin.users.search")}</span>
                  <input
                    id="admin-user-search"
                    type="search"
                    maxLength={100}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={t("admin.users.search")}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white ps-3.5 pe-14 text-sm outline-none transition focus:border-brand-500 sm:pe-24"
                  />
                </label>
                <button
                  type="submit"
                  aria-label={t("admin.users.searchAction")}
                  className="absolute top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 text-xs font-semibold text-white transition hover:bg-brand-700 inset-e-1.5 sm:px-3"
                >
                  <Search size={14} aria-hidden="true" />
                  {/* Phones: icon only, to leave the field room. */}
                  <span className="hidden sm:inline">{t("admin.users.searchAction")}</span>
                </button>
              </form>
              <label className="sr-only" htmlFor="admin-user-plan">{t("admin.users.planFilter")}</label>
              <Select
                id="admin-user-plan"
                name="plan"
                value={plan}
                onChange={(event) => { setPlan(event.target.value); setPage(1); setShowAll(false); }}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500"
              >
                {PLANS.map((value) => (
                  <option key={value} value={value}>{t(`admin.users.plan.${value}`)}</option>
                ))}
              </Select>
            </div>
          </div>

          {isLoading ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={t("common.loading")}>
              {[0, 1, 2].map((item) => (
                <li key={item} className="space-y-3 rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <span className="skeleton h-11 w-11 rounded-2xl" />
                    <span className="skeleton block h-4 w-1/2 rounded-full" />
                  </div>
                  <span className="skeleton block h-14 rounded-xl" />
                  <span className="skeleton block h-10 rounded-xl" />
                </li>
              ))}
            </ul>
          ) : request.status === "failed" ? (
            <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{request.error}</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox size={26} />
              </span>
              <p className="text-sm text-slate-500">{t("admin.users.empty")}</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleUsers.map(renderUserCard)}
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
              {t("admin.users.previous")}
            </button>
            <span className="text-sm text-slate-500">
              {t("admin.users.page", { page: pagination.page, pages: pagination.pages })}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => current + 1)}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("admin.users.next")}
            </button>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}

export default AdminUsersPage;
