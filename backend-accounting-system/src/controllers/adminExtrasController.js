const mongoose = require("mongoose");
const User = require("../models/User");
const AdminLog = require("../models/AdminLog");
const Announcement = require("../models/Announcement");
const QuickReply = require("../models/QuickReply");
const RenewalRequest = require("../models/RenewalRequest");
const PaymentProof = require("../models/PaymentProof");
const PaymentSettings = require("../models/PaymentSettings");
const SupportConversation = require("../models/SupportConversation");
const Account = require("../models/Account");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Debt = require("../models/Debt");
const SavingsGoal = require("../models/SavingsGoal");
const { PAID_PLAN_KEYS, pricesFrom, getPlanPrices, SUBSCRIPTION_CURRENCY } = require("../config/subscriptionPlans");
const { calcEnd, userStatus, DAY } = require("../utils/subscription");

const AUDIENCES = ["all", "active", "expiring", "expired", "trial", "paid"];
const PAID_PLANS = ["3months", "6months", "yearly"];

const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

function readString(value, max) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text.length <= max ? text : null;
}

/* ── 1. Announcements ────────────────────────────── */

// Users an audience covers right now (suspended users can't sign in, so they're left out).
function audienceQuery(audience) {
  const now = new Date();
  const base = { isSuspended: { $ne: true } };
  switch (audience) {
    case "active":
      return { ...base, $or: [{ subscriptionEnd: null }, { subscriptionEnd: { $gt: now } }] };
    case "expiring":
      return { ...base, subscriptionEnd: { $gt: now, $lte: new Date(now.getTime() + 7 * DAY) } };
    case "expired":
      return { ...base, subscriptionEnd: { $lte: now } };
    case "trial":
      return { ...base, subscriptionType: "trial" };
    case "paid":
      return { ...base, subscriptionType: { $ne: "trial" } };
    default:
      return base;
  }
}

exports.getAudienceCounts = async (req, res, next) => {
  try {
    const counts = await Promise.all(AUDIENCES.map((audience) => User.countDocuments(audienceQuery(audience))));
    res.json({ success: true, data: Object.fromEntries(AUDIENCES.map((audience, i) => [audience, counts[i]])) });
  } catch (err) { next(err); }
};

exports.listAnnouncements = async (req, res, next) => {
  try {
    const items = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("createdBy", "name")
      .lean();
    res.json({
      success: true,
      data: items.map(({ recipients, createdBy, ...rest }) => ({
        ...rest,
        recipientCount: recipients?.length ?? 0,
        createdByName: createdBy?.name ?? "",
      })),
    });
  } catch (err) { next(err); }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const title = readString(req.body?.title, 120);
    const body = readString(req.body?.body, 2000);
    const audience = AUDIENCES.includes(req.body?.audience) ? req.body.audience : null;
    if (!title) return bad(res, "العنوان مطلوب ولا يزيد عن 120 حرف");
    if (!body) return bad(res, "نص الإعلان مطلوب ولا يزيد عن 2000 حرف");
    if (!audience) return bad(res, "اختار الفئة المستهدفة");

    const recipients = await User.find(audienceQuery(audience)).distinct("_id");
    if (recipients.length === 0) return bad(res, "مفيش مستخدمين في الفئة دي");

    const announcement = await Announcement.create({ title, body, audience, recipients, createdBy: req.adminId });
    res.status(201).json({
      success: true,
      data: { _id: announcement._id, title, body, audience, recipientCount: recipients.length, createdAt: announcement.createdAt },
    });
  } catch (err) { next(err); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, "Invalid id");
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return bad(res, "الإعلان مش موجود", 404);
    res.json({ success: true });
  } catch (err) { next(err); }
};

/* ── 2. Quick replies ────────────────────────────── */
exports.listQuickReplies = async (req, res, next) => {
  try {
    const items = await QuickReply.find().sort({ createdAt: 1 }).select("title text").lean();
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.createQuickReply = async (req, res, next) => {
  try {
    const title = readString(req.body?.title, 60);
    const text = readString(req.body?.text, 2000);
    if (!title) return bad(res, "اسم الرد مطلوب ولا يزيد عن 60 حرف");
    if (!text) return bad(res, "نص الرد مطلوب");
    if ((await QuickReply.countDocuments()) >= 50) return bad(res, "وصلت للحد الأقصى (50 رد)");
    const reply = await QuickReply.create({ title, text, createdBy: req.adminId });
    res.status(201).json({ success: true, data: { _id: reply._id, title, text } });
  } catch (err) { next(err); }
};

exports.deleteQuickReply = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, "Invalid id");
    await QuickReply.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

/* ── 3. One user's full profile ──────────────────── */
exports.getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return bad(res, "Invalid user id");
    const user = await User.findById(id).select("-password -notificationsReadIds").lean();
    if (!user) return bad(res, "المستخدم غير موجود", 404);

    const objectId = new mongoose.Types.ObjectId(id);
    const [accounts, incomes, expenses, debts, goals, logs, conversation, renewals] = await Promise.all([
      Account.countDocuments({ user: objectId }),
      Income.countDocuments({ user: objectId }),
      Expense.countDocuments({ user: objectId }),
      Debt.countDocuments({ userId: objectId }),
      SavingsGoal.countDocuments({ user: objectId }),
      AdminLog.find({ user: objectId }).sort({ createdAt: -1 }).limit(10).populate("admin", "name").lean(),
      SupportConversation.findOne({ user: objectId }).select("lastMessage unreadForAdmin").lean(),
      RenewalRequest.find({ user: objectId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.json({
      success: true,
      data: {
        user: { ...user, _status: userStatus(user) },
        counts: { accounts, incomes, expenses, debts, goals },
        logs: logs.map((log) => ({
          _id: log._id,
          action: log.action,
          details: log.details,
          reason: log.reason,
          createdAt: log.createdAt,
          adminName: log.admin?.name ?? "",
        })),
        conversation: conversation
          ? { lastMessage: conversation.lastMessage, unread: conversation.unreadForAdmin }
          : null,
        renewals,
      },
    });
  } catch (err) { next(err); }
};

/* ── 4. Renewal requests ─────────────────────────── */
exports.listRenewalRequests = async (req, res, next) => {
  try {
    const prices = await getPlanPrices();
    const status = ["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : null;
    const filter = status ? { status } : {};
    const [items, pendingCount] = await Promise.all([
      RenewalRequest.find(filter)
        .sort({ status: 1, createdAt: -1 })
        .select("-payment.proof")
        .limit(100)
        .populate("user", "name email subscriptionType subscriptionEnd isSuspended")
        .populate("handledBy", "name")
        .lean(),
      RenewalRequest.countDocuments({ status: "pending" }),
    ]);
    res.json({
      success: true,
      data: items.map((item) => ({
        ...item,
        // What they actually paid (falls back to today's price for requests made before payments).
        price: item.payment?.amount ?? prices[item.plan] ?? 0,
        currency: SUBSCRIPTION_CURRENCY,
        handledByName: item.handledBy?.name ?? "",
        user: item.user ? { ...item.user, _status: userStatus(item.user) } : null,
      })),
      pendingCount,
    });
  } catch (err) { next(err); }
};

async function findPendingRequest(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return bad(res, "Invalid id") && null;
  const request = await RenewalRequest.findById(req.params.id);
  if (!request) return bad(res, "الطلب مش موجود", 404) && null;
  if (request.status !== "pending") return bad(res, "الطلب ده اتعامل معاه قبل كده") && null;
  return request;
}

// Approving starts the requested plan today (or right after the current one, if it's still running).
exports.approveRenewal = async (req, res, next) => {
  try {
    const request = await findPendingRequest(req, res);
    if (!request) return;
    const user = await User.findById(request.user);
    if (!user) return bad(res, "المستخدم غير موجود", 404);

    const now = new Date();
    const start = user.subscriptionEnd && user.subscriptionEnd > now ? user.subscriptionEnd : now;
    const details = { oldPlan: user.subscriptionType, oldEnd: user.subscriptionEnd ?? null };
    user.subscriptionType = request.plan;
    user.subscriptionStart = now;
    user.subscriptionEnd = calcEnd(request.plan, start);
    await user.save();
    details.newPlan = request.plan;
    details.newEnd = user.subscriptionEnd;

    request.status = "approved";
    request.handledBy = req.adminId;
    request.handledAt = now;
    if (request.payment?.method) request.payment.verifiedAt = now;
    request.response = readString(req.body?.response, 500) ?? "";
    await request.save();

    await AdminLog.create({
      admin: req.adminId,
      user: user._id,
      action: "change_plan",
      details,
      reason: request.payment?.method
        ? `تأكيد دفع ${request.payment.amount} ${request.payment.currency} (${request.payment.method}) — رقم العملية ${request.payment.reference}`
        : "موافقة على طلب تجديد",
    });
    res.json({ success: true, data: { status: "approved", subscriptionEnd: user.subscriptionEnd } });
  } catch (err) { next(err); }
};

exports.rejectRenewal = async (req, res, next) => {
  try {
    const request = await findPendingRequest(req, res);
    if (!request) return;
    request.status = "rejected";
    request.handledBy = req.adminId;
    request.handledAt = new Date();
    request.response = readString(req.body?.response, 500) ?? "";
    await request.save();
    res.json({ success: true, data: { status: "rejected" } });
  } catch (err) { next(err); }
};

// The transfer screenshot attached to a request.
exports.getRenewalProof = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, "Invalid id");
    const request = await RenewalRequest.findById(req.params.id).select("payment.proof").lean();
    const file = request?.payment?.proof ? await PaymentProof.findById(request.payment.proof) : null;
    if (!file) return bad(res, "مفيش إثبات دفع للطلب ده", 404);
    res.set("Content-Type", file.mimeType);
    res.set("Cache-Control", "private, max-age=3600");
    res.send(file.data);
  } catch (err) { next(err); }
};

/* ── Where users send their payments ─────────────── */
const PAYMENT_FIELDS = {
  vodafoneCashNumber: 30,
  vodafoneCashName: 80,
  instapayAddress: 80,
  instapayName: 80,
  instructions: 500,
};

// The settings as the admin form reads them: the text fields, plus the prices in force.
const paymentSettingsView = (settings) => {
  const prices = pricesFrom(settings);
  return {
    ...Object.fromEntries(Object.keys(PAYMENT_FIELDS).map((key) => [key, settings[key] ?? ""])),
    planPrices: Object.fromEntries(PAID_PLAN_KEYS.map((plan) => [plan, prices[plan]])),
  };
};
const MAX_PLAN_PRICE = 1000000;

exports.getPaymentSettings = async (req, res, next) => {
  try {
    const settings = await PaymentSettings.get();
    res.json({ success: true, data: paymentSettingsView(settings) });
  } catch (err) { next(err); }
};

exports.updatePaymentSettings = async (req, res, next) => {
  try {
    const update = {};
    for (const [key, max] of Object.entries(PAYMENT_FIELDS)) {
      const value = req.body?.[key];
      if (value === undefined) continue;
      if (typeof value !== "string" || value.trim().length > max) return bad(res, `قيمة غير صالحة: ${key}`);
      update[key] = value.trim();
    }
    if (update.vodafoneCashNumber && !/^[0-9+\s-]{8,20}$/.test(update.vodafoneCashNumber)) {
      return bad(res, "رقم فودافون كاش غير صحيح");
    }
    // Plan prices: whole pounds, 0 … 1,000,000. Requests already sent keep the price they were sent at.
    const planPrices = req.body?.planPrices;
    if (planPrices !== undefined) {
      if (typeof planPrices !== "object" || planPrices === null) return bad(res, "أسعار الباقات غير صالحة");
      for (const plan of PAID_PLAN_KEYS) {
        if (planPrices[plan] === undefined) continue;
        const price = Number(planPrices[plan]);
        if (!Number.isInteger(price) || price < 0 || price > MAX_PLAN_PRICE) return bad(res, `سعر غير صالح للباقة: ${plan}`);
        update[`planPrices.${plan}`] = price;
      }
    }
    const settings = await PaymentSettings.findOneAndUpdate(
      { key: "main" },
      { $set: update },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).lean();
    res.json({ success: true, data: paymentSettingsView(settings) });
  } catch (err) { next(err); }
};

/* ── 7. Revenue by month + what renewals may bring ── */
exports.getRevenueReport = async (req, res, next) => {
  try {
    const prices = await getPlanPrices();
    const now = new Date();
    const firstMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Each paid plan counts once, in the month it started, at its current price.
    const started = await User.aggregate([
      { $match: { subscriptionType: { $in: PAID_PLANS }, subscriptionStart: { $gte: firstMonth } } },
      {
        $group: {
          _id: { y: { $year: "$subscriptionStart" }, m: { $month: "$subscriptionStart" }, plan: "$subscriptionType" },
          count: { $sum: 1 },
        },
      },
    ]);

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
      return { y: date.getFullYear(), m: date.getMonth(), total: 0, count: 0, byPlan: {} };
    });
    for (const row of started) {
      const month = months.find((item) => item.y === row._id.y && item.m === row._id.m - 1);
      if (!month) continue;
      const amount = row.count * (prices[row._id.plan] ?? 0);
      month.total += amount;
      month.count += row.count;
      month.byPlan[row._id.plan] = (month.byPlan[row._id.plan] ?? 0) + amount;
    }

    // Paid subscriptions ending soon: what renewing them at the same price would bring.
    const ending = await User.find({
      isSuspended: { $ne: true },
      subscriptionType: { $in: PAID_PLANS },
      subscriptionEnd: { $gt: now, $lte: new Date(now.getTime() + 90 * DAY) },
    }).select("subscriptionType subscriptionEnd").lean();
    const forecast = [30, 60, 90].map((days) => {
      const until = now.getTime() + days * DAY;
      const users = ending.filter((user) => new Date(user.subscriptionEnd).getTime() <= until);
      return { days, count: users.length, total: users.reduce((sum, user) => sum + (prices[user.subscriptionType] ?? 0), 0) };
    });

    const yearTotal = months.reduce((sum, month) => sum + month.total, 0);
    const pendingRenewals = await RenewalRequest.find({ status: "pending" }).select("plan payment.amount").lean();
    res.json({
      success: true,
      data: {
        currency: SUBSCRIPTION_CURRENCY,
        prices,
        months,
        yearTotal,
        monthlyAverage: Math.round(yearTotal / 12),
        thisMonth: months[months.length - 1].total,
        lastMonth: months[months.length - 2].total,
        forecast,
        pendingRenewals: {
          count: pendingRenewals.length,
          total: pendingRenewals.reduce((sum, request) => sum + (request.payment?.amount ?? prices[request.plan] ?? 0), 0),
        },
      },
    });
  } catch (err) { next(err); }
};
