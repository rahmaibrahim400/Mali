const crypto    = require("crypto");
const bcrypt    = require("bcryptjs");
const mongoose  = require("mongoose");
const { signAdminToken, ADMIN_TOKEN_TTL } = require("../utils/adminToken");
const Admin    = require("../models/Admin");
const User      = require("../models/User");
const AdminLog  = require("../models/AdminLog");
const Income    = require("../models/Income");
const Expense   = require("../models/Expense");
const Account   = require("../models/Account");
const SavingsGoal = require("../models/SavingsGoal");
const Debt      = require("../models/Debt");
const { sendPasswordResetLink } = require("../services/passwordResetService");
const { getPlanPrices, SUBSCRIPTION_CURRENCY } = require("../config/subscriptionPlans");
const { calcEnd, planLabel, userStatus } = require("../utils/subscription");

/* ── helpers ─────────────────────────────────────── */
function activeUserExpression(now) {
  return {
    $and: [
      { $ne: ["$isSuspended", true] },
      {
        $or: [
          { $eq: [{ $ifNull: ["$subscriptionEnd", null] }, null] },
          { $gt: ["$subscriptionEnd", now] },
        ],
      },
    ],
  };
}

function userStatusExpression(now) {
  return {
    $switch: {
      branches: [
        { case: { $eq: ["$isSuspended", true] }, then: "suspended" },
        { case: { $eq: [{ $ifNull: ["$subscriptionEnd", null] }, null] }, then: "active" },
        { case: { $lt: ["$subscriptionEnd", now] }, then: "expired" },
        {
          case: {
            $lt: [{ $subtract: ["$subscriptionEnd", now] }, 7 * 86400000],
          },
          then: "expiring",
        },
      ],
      default: "active",
    },
  };
}

async function countActiveFeatureUsers(Model, now, extraMatch = {}, userField = "user") {
  const result = await Model.aggregate([
    { $match: extraMatch },
    { $group: { _id: `$${userField}` } },
    {
      $lookup: {
        from: User.collection.name,
        let: { userId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
          { $match: { $expr: activeUserExpression(now) } },
          { $project: { _id: 1 } },
        ],
        as: "activeUser",
      },
    },
    { $match: { "activeUser.0": { $exists: true } } },
    { $count: "count" },
  ]);

  return result[0]?.count ?? 0;
}

async function aggregateActivityHeatmap(Model, from, timezone) {
  return Model.aggregate([
    { $match: { createdAt: { $gte: from } } },
    {
      $group: {
        _id: {
          day: { $subtract: [{ $dayOfWeek: { date: "$createdAt", timezone } }, 1] },
          hour: { $hour: { date: "$createdAt", timezone } },
        },
        count: { $sum: 1 },
      },
    },
  ]);
}

async function log(adminId, userId, action, details, reason) {
  await AdminLog.create({ admin: adminId || null, user: userId, action, details, reason });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_PLANS = ["trial", "3months", "6months", "yearly", "custom"];
const USER_STATUSES = ["active", "expiring", "expired", "suspended"];
const ADMIN_LOG_ACTIONS = [
  "create_user",
  "extend_subscription",
  "change_plan",
  "add_free_days",
  "suspend",
  "activate",
  "manual_date",
];
const MAX_USER_PAGE_SIZE = 100;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInteger(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= max ? parsed : null;
}

function parseDateFilter(value, endOfDay = false) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

/* Compared against when the email is unknown, so response time doesn't reveal whether it exists */
let dummyHashPromise;
const getDummyHash = () => (dummyHashPromise ??= bcrypt.hash("dummy-password-for-timing", 12));

function adminView(admin) {
  return { id: admin._id, name: admin.name, email: admin.email, avatar: admin.avatar || "" };
}

/* ── POST /api/admin/auth/login ──────────────────── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const admin = await Admin.findOne({ email: normalizedEmail }).select("+password -avatar");
    const passwordOk = admin
      ? await admin.comparePassword(password)
      : await bcrypt.compare(password, await getDummyHash());
    if (!admin || !passwordOk) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = signAdminToken(admin._id);
    res.json({ success: true, data: { token, expiresIn: ADMIN_TOKEN_TTL, admin: { id: admin._id, name: admin.name, email: admin.email } } });
  } catch (err) { next(err); }
};

/* ── GET /api/admin/auth/me ──────────────────────── */
exports.me = async (req, res, next) => {
  try {
    // Without the photo, so the panel opens right away; it comes from /admin/auth/avatar.
    const admin = mongoose.isValidObjectId(req.adminId) ? await Admin.findById(req.adminId).select("name email").lean() : null;
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });
    res.json({ success: true, data: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) { next(err); }
};

/* ── GET /api/admin/auth/avatar ──────────────────── */
exports.avatar = async (req, res, next) => {
  try {
    const admin = mongoose.isValidObjectId(req.adminId) ? await Admin.findById(req.adminId).select("avatar").lean() : null;
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });
    res.json({ success: true, data: { avatar: admin.avatar || "" } });
  } catch (err) { next(err); }
};

/* ── GET /api/admin/stats ────────────────────────── */
exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const expiringLimit = new Date(now.getTime() + 7 * 86400000);
    const [aggregated, expiringUsers] = await Promise.all([
      User.aggregate([
        { $set: { dashboardStatus: userStatusExpression(now) } },
        {
          $facet: {
            summary: [{
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "active"] }, 1, 0] } },
                expiring: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "expiring"] }, 1, 0] } },
                expired: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "expired"] }, 1, 0] } },
                suspended: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "suspended"] }, 1, 0] } },
                trial: {
                  $sum: {
                    $cond: [
                      { $and: [{ $eq: ["$subscriptionType", "trial"] }, { $ne: ["$isSuspended", true] }] },
                      1,
                      0,
                    ],
                  },
                },
              },
            }],
            planDist: [
              { $group: { _id: "$subscriptionType", count: { $sum: 1 } } },
              { $project: { _id: 0, type: "$_id", count: 1 } },
            ],
            monthly: [
              { $match: { createdAt: { $gte: monthStart } } },
              {
                $group: {
                  _id: {
                    year: { $year: { date: "$createdAt", timezone } },
                    month: { $month: { date: "$createdAt", timezone } },
                  },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      User.find({
        isSuspended: { $ne: true },
        subscriptionEnd: { $gte: now, $lt: expiringLimit },
      })
        .select("name email subscriptionType subscriptionEnd")
        .sort({ subscriptionEnd: 1 })
        .limit(10)
        .lean(),
    ]);

    const result = aggregated[0] ?? {};
    const summary = result.summary?.[0] ?? {};
    const plansByType = new Map((result.planDist ?? []).map(({ type, count }) => [type, count]));
    const monthlyByKey = new Map((result.monthly ?? []).map(({ _id, count }) => [`${_id.year}-${_id.month}`, count]));
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.push({
        month: date.toLocaleString("ar-EG", { month: "short" }),
        count: monthlyByKey.get(`${date.getFullYear()}-${date.getMonth() + 1}`) ?? 0,
      });
    }
    const planDist = ["trial", "3months", "6months", "yearly", "custom"].map((type) => ({
      plan: planLabel(type),
      count: plansByType.get(type) ?? 0,
    }));

    res.json({
      success: true,
      data: {
        total: summary.total ?? 0,
        active: summary.active ?? 0,
        expiring: summary.expiring ?? 0,
        expired: summary.expired ?? 0,
        suspended: summary.suspended ?? 0,
        trial: summary.trial ?? 0,
        monthly,
        planDist,
        expiringUsers,
      },
    });
  } catch (err) { next(err); }
};

/* ── GET /api/admin/users ────────────────────────── */
exports.getUsers = async (req, res, next) => {
  try {
    const {
      search,
      plan = "all",
      status: statusFilter = "all",
      sort = "expiring_first",
    } = req.query;
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, MAX_USER_PAGE_SIZE);

    if (page === null || limit === null || (page - 1) * limit > 2147483647) {
      return res.status(400).json({ success: false, message: "page and limit must be positive integers; limit cannot exceed 100" });
    }
    if (typeof search !== "undefined" && (typeof search !== "string" || search.length > 100)) {
      return res.status(400).json({ success: false, message: "search must be a string of at most 100 characters" });
    }
    if (typeof plan !== "string" || (plan !== "all" && !USER_PLANS.includes(plan))) {
      return res.status(400).json({ success: false, message: "Invalid plan filter" });
    }
    if (typeof statusFilter !== "string" || (statusFilter !== "all" && !USER_STATUSES.includes(statusFilter))) {
      return res.status(400).json({ success: false, message: "Invalid status filter" });
    }
    if (typeof sort !== "string" || !["expiring_first", "newest"].includes(sort)) {
      return res.status(400).json({ success: false, message: "sort must be expiring_first or newest" });
    }

    const query = {};
    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      const safeSearch = escapeRegex(normalizedSearch);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }
    if (plan !== "all") query.subscriptionType = plan;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const statusOrder = { expiring: 0, expired: 1, active: 2, suspended: 3 };
    const [result] = await User.aggregate([
      { $match: query },
      {
        $addFields: {
          _status: {
            $switch: {
              branches: [
                { case: { $eq: ["$isSuspended", true] }, then: "suspended" },
                { case: { $eq: [{ $ifNull: ["$subscriptionEnd", null] }, null] }, then: "active" },
                { case: { $lt: ["$subscriptionEnd", now] }, then: "expired" },
                { case: { $lt: ["$subscriptionEnd", sevenDaysFromNow] }, then: "expiring" },
              ],
              default: "active",
            },
          },
        },
      },
      ...(statusFilter === "all" ? [] : [{ $match: { _status: statusFilter } }]),
      {
        $addFields: {
          _statusOrder: {
            $switch: {
              branches: Object.entries(statusOrder).map(([value, order]) => ({
                case: { $eq: ["$_status", value] },
                then: order,
              })),
              default: 4,
            },
          },
        },
      },
      {
        $facet: {
          data: [
            { $sort: sort === "expiring_first" ? { _statusOrder: 1, createdAt: -1, _id: -1 } : { createdAt: -1, _id: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $unset: ["password", "avatar", "_statusOrder"] },
          ],
          pagination: [{ $count: "total" }],
        },
      },
    ]);
    const total = result.pagination[0]?.total ?? 0;

    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/* ── POST /api/admin/users ───────────────────────── */
exports.createUser = async (req, res, next) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      password,
      subscriptionType = "trial",
      customDays = 30,
    } = req.body ?? {};
    const normalizedName = typeof name === "string"
      ? name.trim()
      : `${typeof firstName === "string" ? firstName.trim() : ""} ${typeof lastName === "string" ? lastName.trim() : ""}`.trim();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedName || normalizedName.length > 120) {
      return res.status(400).json({ success: false, message: "A name of 1 to 120 characters is required" });
    }
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "A valid email is required" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (!USER_PLANS.includes(subscriptionType)) {
      return res.status(400).json({ success: false, message: "Invalid subscription type" });
    }
    const parsedCustomDays = Number(customDays);
    if (
      subscriptionType === "custom" &&
      (!Number.isInteger(parsedCustomDays) || parsedCustomDays < 1 || parsedCustomDays > 3650)
    ) {
      return res.status(400).json({ success: false, message: "customDays must be an integer from 1 to 3650" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ success: false, message: "الإيميل مستخدم بالفعل" });

    const start = new Date();
    const end = calcEnd(subscriptionType, start, parsedCustomDays);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      phone: typeof phone === "string" ? phone.trim() : "",
      subscriptionType,
      subscriptionStart: start,
      subscriptionEnd: end,
    });

    await log(
      req.adminId,
      user._id,
      "create_user",
      { subscriptionType, subscriptionEnd: end },
      "إنشاء حساب جديد",
    );

    let setupEmailSent = true;
    try {
      await sendPasswordResetLink(user.email);
    } catch (mailError) {
      setupEmailSent = false;
      console.error("Admin-created user password setup email failed:", mailError.message);
    }

    const userData = user.toObject();
    delete userData.password;
    res.status(201).json({
      success: true,
      data: { ...userData, _status: userStatus(user) },
      setupEmailSent,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "الإيميل مستخدم بالفعل" });
    }
    next(err);
  }
};

/* ── GET /api/admin/users/:id ────────────────────── */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    res.json({ success: true, data: { ...user.toObject(), _status: userStatus(user) } });
  } catch (err) { next(err); }
};

/* ── PUT /api/admin/users/:id/subscription ───────── */
exports.updateSubscription = async (req, res, next) => {
  try {
    const {
      subscriptionType,
      customDays = 30,
      subscriptionEnd: manualEnd,
      extensionDays,
      freeDays,
      reason,
    } = req.body ?? {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });

    let action;
    const details = {};

    if (manualEnd !== undefined) {
      const parsedManualEnd = typeof manualEnd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(manualEnd)
        ? new Date(`${manualEnd}T23:59:59.999Z`)
        : null;
      if (
        !parsedManualEnd ||
        Number.isNaN(parsedManualEnd.getTime()) ||
        parsedManualEnd.toISOString().slice(0, 10) !== manualEnd
      ) {
        return res.status(400).json({ success: false, message: "subscriptionEnd must be a valid date in YYYY-MM-DD format" });
      }
      if (typeof reason !== "string" || !reason.trim() || reason.length > 500) {
        return res.status(400).json({ success: false, message: "A reason of 1 to 500 characters is required" });
      }

      details.oldEnd = user.subscriptionEnd ?? null;
      user.subscriptionEnd = parsedManualEnd;
      action = "manual_date";
      details.newEnd = parsedManualEnd;
      details.reason = reason.trim();
    } else if (extensionDays !== undefined) {
      const parsedExtensionDays = typeof extensionDays === "number"
        ? extensionDays
        : typeof extensionDays === "string" && /^[1-9]\d*$/.test(extensionDays)
          ? Number(extensionDays)
          : NaN;
      if (!Number.isSafeInteger(parsedExtensionDays) || parsedExtensionDays < 1 || parsedExtensionDays > 3650) {
        return res.status(400).json({ success: false, message: "extensionDays must be an integer from 1 to 3650" });
      }

      const now = new Date();
      const oldEnd = user.subscriptionEnd ?? null;
      const base = user.subscriptionEnd && user.subscriptionEnd > now ? user.subscriptionEnd : now;
      user.subscriptionEnd = new Date(base.getTime() + parsedExtensionDays * 86400000);
      action = "extend_subscription";
      details.days = parsedExtensionDays;
      details.oldEnd = oldEnd;
      details.newEnd = user.subscriptionEnd;
    } else if (freeDays !== undefined) {
      const parsedFreeDays = typeof freeDays === "number"
        ? freeDays
        : typeof freeDays === "string" && /^[1-9]\d*$/.test(freeDays)
          ? Number(freeDays)
          : NaN;
      if (!Number.isSafeInteger(parsedFreeDays) || parsedFreeDays < 1) {
        return res.status(400).json({ success: false, message: "freeDays must be a positive integer" });
      }
      if (reason !== undefined && (typeof reason !== "string" || reason.length > 500)) {
        return res.status(400).json({ success: false, message: "reason must be a string of at most 500 characters" });
      }

      const oldEnd = user.subscriptionEnd ?? null;
      const base = user.subscriptionEnd ?? new Date();
      const newEnd = new Date(base.getTime() + parsedFreeDays * 86400000);
      if (Number.isNaN(newEnd.getTime())) {
        return res.status(400).json({ success: false, message: "freeDays results in an invalid subscription end date" });
      }
      user.subscriptionEnd = newEnd;
      action = "add_free_days";
      details.days = parsedFreeDays;
      details.oldEnd = oldEnd;
      details.newEnd = user.subscriptionEnd;
    } else if (subscriptionType) {
      if (!USER_PLANS.includes(subscriptionType)) {
        return res.status(400).json({ success: false, message: "Invalid subscription type" });
      }
      const parsedCustomDays = Number(customDays);
      if (
        subscriptionType === "custom" &&
        (!Number.isInteger(parsedCustomDays) || parsedCustomDays < 1 || parsedCustomDays > 3650)
      ) {
        return res.status(400).json({ success: false, message: "customDays must be an integer from 1 to 3650" });
      }

      const start = new Date();
      details.oldPlan = user.subscriptionType;
      details.oldEnd = user.subscriptionEnd ?? null;
      user.subscriptionType = subscriptionType;
      user.subscriptionStart = start;
      user.subscriptionEnd   = calcEnd(subscriptionType, start, parsedCustomDays);
      details.newPlan = subscriptionType;
      details.newEnd  = user.subscriptionEnd;
      if (subscriptionType === "custom") details.customDays = parsedCustomDays;
      action = "change_plan";
    } else {
      return res.status(400).json({ success: false, message: "A subscription update is required" });
    }

    await user.save();
    await log(req.adminId, user._id, action, details, reason?.trim());

    try {
      await sendSubscriptionUpdateEmail(user.email, user.name, planLabel(user.subscriptionType), user.subscriptionEnd);
    } catch { /* silent */ }

    res.json({ success: true, data: { ...user.toObject(), _status: userStatus(user) } });
  } catch (err) { next(err); }
};

/* ── POST /api/admin/users/:id/suspend ───────────── */
exports.suspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body ?? {};
    if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 500) {
      return res.status(400).json({ success: false, message: "A reason of 1 to 500 characters is required" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    if (user.isSuspended) {
      return res.status(409).json({ success: false, message: "المستخدم موقوف بالفعل" });
    }
    user.isSuspended = true;
    await user.save();
    await log(req.adminId, user._id, "suspend", { isSuspended: true }, reason.trim());
    res.json({ success: true, data: { ...user.toObject(), _status: "suspended" } });
  } catch (err) { next(err); }
};

/* ── POST /api/admin/users/:id/activate ─────────── */
exports.activateUser = async (req, res, next) => {
  try {
    const { reason } = req.body ?? {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    if (!user.isSuspended) {
      return res.status(409).json({ success: false, message: "المستخدم غير موقوف" });
    }
    if (reason !== undefined && (typeof reason !== "string" || reason.trim().length > 500)) {
      return res.status(400).json({ success: false, message: "reason must be a string of at most 500 characters" });
    }

    user.isSuspended = false;
    await user.save();
    const status = userStatus(user);
    await log(req.adminId, user._id, "activate", { status }, reason?.trim());
    res.json({ success: true, data: { ...user.toObject(), _status: status } });
  } catch (err) { next(err); }
};

/* ── GET /api/admin/logs ─────────────────────────── */
exports.getAdminLogs = async (req, res, next) => {
  try {
    const {
      action: rawAction,
      user: userFilter,
      from: rawFrom,
      to: rawTo,
    } = req.query;
    const action = rawAction === "" ? undefined : rawAction;
    const from = rawFrom === "" ? undefined : rawFrom;
    const to = rawTo === "" ? undefined : rawTo;
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, MAX_USER_PAGE_SIZE);
    if (page === null || limit === null || (page - 1) * limit > 2147483647) {
      return res.status(400).json({ success: false, message: "page and limit must be positive integers; limit cannot exceed 100" });
    }
    if (action !== undefined && (typeof action !== "string" || !ADMIN_LOG_ACTIONS.includes(action))) {
      return res.status(400).json({ success: false, message: "Invalid audit log action" });
    }
    if (userFilter !== undefined && (typeof userFilter !== "string" || userFilter.trim().length > 100)) {
      return res.status(400).json({ success: false, message: "user must be a string of at most 100 characters" });
    }
    const fromDate = from === undefined ? undefined : parseDateFilter(from);
    const toDate = to === undefined ? undefined : parseDateFilter(to, true);
    if ((from !== undefined && !fromDate) || (to !== undefined && !toDate)) {
      return res.status(400).json({ success: false, message: "from and to must be valid dates in YYYY-MM-DD format" });
    }
    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({ success: false, message: "from must be on or before to" });
    }

    const filter = {};
    if (userFilter?.trim()) {
      const normalizedUser = userFilter.trim();
      if (mongoose.isValidObjectId(normalizedUser)) {
        filter.user = normalizedUser;
      } else {
        const safeUserSearch = escapeRegex(normalizedUser);
        const matchedUsers = await User.find({
          $or: [
            { name: { $regex: safeUserSearch, $options: "i" } },
            { email: { $regex: safeUserSearch, $options: "i" } },
          ],
        }).select("_id").limit(50).lean();
        filter.user = { $in: matchedUsers.map((user) => user._id) };
      }
    }
    if (action) filter.action = action;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const [logs, total] = await Promise.all([
      AdminLog.find(filter)
        .populate("admin", "name email")
        .populate("user", "name email")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminLog.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: logs.map((entry) => ({
        ...entry,
        admin: entry.admin ?? null,
        user: entry.user ?? null,
        details: entry.details ?? {},
        reason: entry.reason ?? null,
        createdAt: entry.createdAt ?? null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/* ── GET /api/admin/users/:id/logs ──────────────── */
exports.getUserLogs = async (req, res, next) => {
  try {
    const logs = await AdminLog.find({ user: req.params.id })
      .populate("admin", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};

/* ── POST /api/admin/auth/seed ───────────────────── */
exports.seedAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string"
        || !name.trim() || !EMAIL_RE.test(email.trim()) || password.length < 8) {
      return res.status(400).json({ success: false, message: "name, valid email and password (min 8 chars) are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await Admin.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ success: false, message: "Admin already exists" });
    const admin = await Admin.create({ name: name.trim(), email: normalizedEmail, password });
    res.status(201).json({ success: true, data: adminView(admin) });
  } catch (err) { next(err); }
};

/* ── GET /api/admin/dashboard ────────────────────── */
exports.getDashboard = async (req, res, next) => {
  try {
    const prices = await getPlanPrices();
    const now            = new Date();
    const thirtyDaysAgo  = new Date(now.getTime() - 30  * 86400000);
    const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMo  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMo    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const ninetyDaysAgo  = new Date(now.getTime() - 90  * 86400000);
    const monthStart     = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const renewalLimit   = new Date(now.getTime() + 30 * 86400000);
    const expiringLimit  = new Date(now.getTime() + 7 * 86400000);
    const weekStart      = new Date(now);
    weekStart.setDate(now.getDate() - 11 * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekBoundaries = Array.from({ length: 13 }, (_, index) =>
      new Date(weekStart.getTime() + index * 7 * 86400000),
    );
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const PLAN_LABELS = { trial: "تجريبي", "3months": "3 أشهر", "6months": "6 أشهر", yearly: "سنة", custom: "مخصص" };
    const userIsActive = activeUserExpression(now);
    const userNotSuspended = { $ne: ["$isSuspended", true] };

    const [
      userAggregates,
      expenseUsers,
      accountUsers,
      cashUsers,
      incomeUsers,
      savingsUsers,
      debtUsers,
      incomeHeat,
      expenseHeat,
      recentLogs,
    ] = await Promise.all([
      User.aggregate([
        { $set: { dashboardStatus: userStatusExpression(now) } },
        {
          $facet: {
            summary: [{
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "active"] }, 1, 0] } },
                expiring: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "expiring"] }, 1, 0] } },
                expired: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "expired"] }, 1, 0] } },
                suspended: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "suspended"] }, 1, 0] } },
                trial: { $sum: { $cond: [{ $eq: ["$subscriptionType", "trial"] }, 1, 0] } },
                converted: { $sum: { $cond: [{ $ne: ["$subscriptionType", "trial"] }, 1, 0] } },
                thisMonthNew: { $sum: { $cond: [{ $gte: ["$createdAt", startOfMonth] }, 1, 0] } },
                lastMonthNew: {
                  $sum: {
                    $cond: [{
                      $and: [
                        { $gte: ["$createdAt", startOfLastMo] },
                        { $lte: ["$createdAt", endOfLastMo] },
                      ],
                    }, 1, 0],
                  },
                },
                expiredTrial: {
                  $sum: {
                    $cond: [{
                      $and: [
                        { $eq: ["$subscriptionType", "trial"] },
                        { $ne: [{ $ifNull: ["$subscriptionEnd", null] }, null] },
                        { $lt: ["$subscriptionEnd", now] },
                      ],
                    }, 1, 0],
                  },
                },
                churnedRecentCount: {
                  $sum: {
                    $cond: [{
                      $and: [
                        userNotSuspended,
                        { $gte: ["$subscriptionEnd", thirtyDaysAgo] },
                        { $lt: ["$subscriptionEnd", now] },
                      ],
                    }, 1, 0],
                  },
                },
                churnedOldCount: {
                  $sum: {
                    $cond: [{
                      $and: [
                        userNotSuspended,
                        { $lt: ["$subscriptionEnd", thirtyDaysAgo] },
                      ],
                    }, 1, 0],
                  },
                },
              },
            }],
            monthly: [
              { $match: { createdAt: { $gte: monthStart } } },
              {
                $group: {
                  _id: {
                    year: { $year: { date: "$createdAt", timezone } },
                    month: { $month: { date: "$createdAt", timezone } },
                  },
                  count: { $sum: 1 },
                },
              },
            ],
            weekly: [
              { $match: { createdAt: { $gte: weekStart, $lte: now } } },
              {
                $bucket: {
                  groupBy: "$createdAt",
                  boundaries: weekBoundaries,
                  output: { count: { $sum: 1 } },
                },
              },
            ],
            plans: [
              {
                $group: {
                  _id: "$subscriptionType",
                  count: { $sum: 1 },
                  activeCount: { $sum: { $cond: [userIsActive, 1, 0] } },
                },
              },
              { $project: { _id: 0, type: "$_id", count: 1, activeCount: 1 } },
            ],
            renewalCounts: [
              {
                $match: {
                  isSuspended: { $ne: true },
                  subscriptionEnd: { $gt: now, $lte: renewalLimit },
                },
              },
              { $group: { _id: "$subscriptionType", count: { $sum: 1 } } },
              { $project: { _id: 0, type: "$_id", count: 1 } },
            ],
            unconvertedList: [
              {
                $match: {
                  subscriptionType: "trial",
                  subscriptionEnd: { $lt: now },
                },
              },
              { $sort: { subscriptionEnd: -1 } },
              { $limit: 20 },
              { $project: { name: 1, email: 1, phone: 1, subscriptionEnd: 1 } },
            ],
            atRisk: [
              { $match: { dashboardStatus: "expiring" } },
              { $sort: { subscriptionEnd: 1 } },
              { $limit: 50 },
              {
                $project: {
                  name: 1,
                  email: 1,
                  phone: 1,
                  subscriptionType: 1,
                  subscriptionEnd: 1,
                  daysLeft: {
                    $ceil: { $divide: [{ $subtract: ["$subscriptionEnd", now] }, 86400000] },
                  },
                },
              },
            ],
            upcoming: [
              {
                $match: {
                  isSuspended: { $ne: true },
                  subscriptionEnd: { $gt: now, $lte: renewalLimit },
                },
              },
              { $sort: { subscriptionEnd: 1 } },
              { $limit: 20 },
              { $project: { name: 1, email: 1, subscriptionType: 1, subscriptionEnd: 1 } },
            ],
            churnedRecent: [
              {
                $match: {
                  isSuspended: { $ne: true },
                  subscriptionEnd: { $gte: thirtyDaysAgo, $lt: now },
                },
              },
              { $sort: { subscriptionEnd: -1 } },
              { $limit: 20 },
              {
                $project: {
                  name: 1,
                  email: 1,
                  phone: 1,
                  subscriptionType: 1,
                  subscriptionEnd: 1,
                  daysSince: { $floor: { $divide: [{ $subtract: [now, "$subscriptionEnd"] }, 86400000] } },
                },
              },
            ],
            churnedOld: [
              {
                $match: {
                  isSuspended: { $ne: true },
                  subscriptionEnd: { $lt: thirtyDaysAgo },
                },
              },
              { $sort: { subscriptionEnd: -1 } },
              { $limit: 20 },
              {
                $project: {
                  name: 1,
                  email: 1,
                  phone: 1,
                  subscriptionType: 1,
                  subscriptionEnd: 1,
                  daysSince: { $floor: { $divide: [{ $subtract: [now, "$subscriptionEnd"] }, 86400000] } },
                },
              },
            ],
          },
        },
      ]),
      countActiveFeatureUsers(Expense, now),
      countActiveFeatureUsers(Account, now),
      countActiveFeatureUsers(Account, now, { type: "cash" }),
      countActiveFeatureUsers(Income, now),
      countActiveFeatureUsers(SavingsGoal, now),
      countActiveFeatureUsers(Debt, now, {}, "userId"),
      aggregateActivityHeatmap(Income, ninetyDaysAgo, timezone),
      aggregateActivityHeatmap(Expense, ninetyDaysAgo, timezone),
      AdminLog.find()
        .select("action details createdAt admin user")
        .populate("admin", "name")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const aggregates = userAggregates[0] ?? {};
    const summary = aggregates.summary?.[0] ?? {};
    const total = summary.total ?? 0;
    const active = summary.active ?? 0;
    const expired = summary.expired ?? 0;
    const suspended = summary.suspended ?? 0;
    const trial = summary.trial ?? 0;
    const converted = summary.converted ?? 0;
    const expiredTrial = summary.expiredTrial ?? 0;
    const thisMonthNew = summary.thisMonthNew ?? 0;
    const lastMonthNew = summary.lastMonthNew ?? 0;
    const conversionRate = total > 0 ? parseFloat((converted / total * 100).toFixed(1)) : 0;
    const totalMoM      = lastMonthNew > 0 ? parseFloat(((thisMonthNew - lastMonthNew) / lastMonthNew * 100).toFixed(1)) : null;

    /* ── Monthly growth — 12 months ── */
    const monthly = [];
    const monthlyByKey = new Map((aggregates.monthly ?? []).map(({ _id, count }) => [`${_id.year}-${_id.month}`, count]));
    for (let i = 11; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y   = d.getFullYear(), m = d.getMonth();
      const cnt = monthlyByKey.get(`${y}-${m + 1}`) ?? 0;
      monthly.push({ label: d.toLocaleString("ar-EG", { month: "short", year: "2-digit" }), count: cnt, y, m });
    }

    /* ── Weekly growth — 12 weeks ── */
    const weekly = [];
    for (let i = 11; i >= 0; i--) {
      const ws = weekBoundaries[11 - i];
      const bucket = (aggregates.weekly ?? []).find((entry) => entry._id.getTime() === ws.getTime());
      const cnt = bucket?.count ?? 0;
      weekly.push({ label: `أسبوع ${12 - i}`, count: cnt });
    }

    /* ── Plan distribution ── */
    const plansByType = new Map((aggregates.plans ?? []).map((plan) => [plan.type, plan]));
    const planDist = ["trial","3months","6months","yearly","custom"].map(p => {
      const plan = plansByType.get(p);
      const count = plan?.count ?? 0;
      const act = plan?.activeCount ?? 0;
      const price = prices[p];
      return { type: p, plan: PLAN_LABELS[p], count, percentage: total > 0 ? Number((count / total * 100).toFixed(1)) : 0, activeCount: act, price, revenue: act * price };
    });

    /* ── Revenue ── */
    const renewalCounts = new Map((aggregates.renewalCounts ?? []).map(({ type, count }) => [type, count]));
    const byPlan = ["trial", "3months", "6months", "yearly", "custom"].map(p => {
      const count = plansByType.get(p)?.activeCount ?? 0;
      const price = prices[p];
      return { plan: PLAN_LABELS[p], type: p, price, count, revenue: count * price };
    });
    const totalRevenue = byPlan.reduce((s, r) => s + r.revenue, 0);

    const expectedRevenue = [...renewalCounts].reduce(
      (sum, [type, count]) => sum + count * (prices[type] || 0),
      0,
    );
    const upcomingList = (aggregates.upcoming ?? []).map((user) => ({
      ...user,
      daysLeft: Math.ceil((new Date(user.subscriptionEnd) - now) / 86400000),
      expectedRevenue: prices[user.subscriptionType] || 0,
    }));

    /* ── Conversion funnel ── */
    const funnel = { enteredTrial: total, completedTrial: expiredTrial, converted, notConverted: Math.max(0, expiredTrial - converted) };

    /* ── Unconverted expired trial users ── */
    const unconvertedList = aggregates.unconvertedList ?? [];

    /* ── Expiring subscriptions: nearest 50, with the full count in KPIs ── */
    const atRisk = aggregates.atRisk ?? [];

    /* ── Churned users ── */
    const churnedRecent = aggregates.churnedRecent ?? [];
    const churnedOld = aggregates.churnedOld ?? [];

    /* ── Feature usage ── */
    const act1 = active || 1;
    const featureUsage = [
      { name: "الداشبورد",         count: active,                       pct: 100 },
      { name: "تسجيل المصاريف",    count: expenseUsers,  pct: Math.round(expenseUsers / act1 * 100) },
      { name: "الحسابات والمحافظ", count: accountUsers,  pct: Math.round(accountUsers / act1 * 100) },
      { name: "تسجيل الإيرادات",   count: incomeUsers,   pct: Math.round(incomeUsers / act1 * 100) },
      { name: "تتبع الكاش",        count: cashUsers,     pct: Math.round(cashUsers / act1 * 100) },
      { name: "أهداف الادخار",     count: savingsUsers,  pct: Math.round(savingsUsers / act1 * 100) },
      { name: "إدارة الديون",      count: debtUsers,     pct: Math.round(debtUsers / act1 * 100) },
    ].sort((a, b) => b.pct - a.pct);

    /* ── Heatmap (record creation timestamps as activity proxy) ── */
    const heatGrid = {};
    [...incomeHeat, ...expenseHeat].forEach(({ _id, count }) => {
      const key = `${_id.day}-${_id.hour}`;
      heatGrid[key] = (heatGrid[key] || 0) + count;
    });
    const heatmap = [];
    for (let day = 0; day < 7; day++)
      for (let hour = 0; hour < 24; hour++)
        heatmap.push({ day, hour, count: heatGrid[`${day}-${hour}`] || 0 });

    const maxHeat = Math.max(...heatmap.map(h => h.count), 1);

    res.json({
      success: true,
      data: {
        kpis: { total, active, expired, suspended, trial, converted, conversionRate, thisMonthNew, lastMonthNew, totalMoM, churnCount: (summary.churnedRecentCount ?? 0) + (summary.churnedOldCount ?? 0) },
        monthly, weekly, planDist,
        revenue: { currency: SUBSCRIPTION_CURRENCY, basis: "current_plan_price", byPlan, total: totalRevenue, expected: expectedRevenue, upcoming: upcomingList },
        funnel, unconvertedList,
        atRisk, atRiskTotal: summary.expiring ?? 0,
        churned: {
          recent: churnedRecent,
          recentTotal: summary.churnedRecentCount ?? 0,
          old: churnedOld,
          oldTotal: summary.churnedOldCount ?? 0,
        },
        featureUsage, heatmap, maxHeat,
        recentLogs: recentLogs.map(l => ({
          _id: l._id, action: l.action, details: l.details, createdAt: l.createdAt,
          adminName: l.admin?.name || "النظام",
          userName: l.user?.name || "—", userEmail: l.user?.email || "",
        })),
      },
    });
  } catch (err) { next(err); }
};
