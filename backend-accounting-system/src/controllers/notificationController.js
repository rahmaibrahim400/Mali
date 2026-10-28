const mongoose = require("mongoose");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Debt = require("../models/Debt");
const Account = require("../models/Account");
const SavingsGoal = require("../models/SavingsGoal");
const SupportConversation = require("../models/SupportConversation");
const Announcement = require("../models/Announcement");
const RenewalRequest = require("../models/RenewalRequest");

/*
 * Notifications are worked out from the live data each time (nothing to keep in sync):
 * each item has a stable `id`, a `type` (the app words it), some `params`, a `link`,
 * and `at` — when it became relevant. An item is read when it is older than the account's
 * "read all" mark (`notificationsSeenAt`) or its id was marked read on its own
 * (`notificationsReadIds`).
 */

const DAY = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 20;
const MAX_READ_IDS = 200;

const daysUntil = (date, now) => Math.max(0, Math.ceil((date.getTime() - now.getTime()) / DAY));

function respond(res, items, { seenAt, readIds = [] }) {
  const seen = seenAt ? new Date(seenAt).getTime() : 0;
  const readSet = new Set(readIds);
  const sorted = items
    .filter((item) => item.at && !Number.isNaN(new Date(item.at).getTime()))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, MAX_ITEMS)
    .map((item) => ({ ...item, read: new Date(item.at).getTime() <= seen || readSet.has(item.id) }));
  const unread = sorted.filter((item) => !item.read).length;
  res.json({ success: true, data: { items: sorted, unread } });
}

function readId(req, res) {
  const id = req.body?.id;
  if (typeof id !== "string" || !id || id.length > 200) {
    res.status(400).json({ success: false, message: "Invalid notification id" });
    return null;
  }
  return id;
}

// Adds one id to the account's read list (kept to the latest MAX_READ_IDS).
function markOneRead(Model, accountId, id) {
  return Model.updateOne(
    { _id: accountId, notificationsReadIds: { $ne: id } },
    { $push: { notificationsReadIds: { $each: [id], $slice: -MAX_READ_IDS } } },
  );
}

// "Read all": everything up to now is read, so the one-by-one list can start over.
function markAllRead(Model, accountId) {
  return Model.updateOne({ _id: accountId }, { $set: { notificationsSeenAt: new Date(), notificationsReadIds: [] } });
}

/* ── user (/api/notifications) ───────────────────── */
async function userNotifications(userId) {
  const now = new Date();
  const objectId = new mongoose.Types.ObjectId(userId);
  const [user, conversation, debts, accounts, goals, announcements, decisions] = await Promise.all([
    User.findById(userId).select("subscriptionEnd notificationsSeenAt notificationsReadIds").lean(),
    SupportConversation.findOne({ user: objectId }).select("unreadForUser lastMessage").lean(),
    Debt.find({ userId: objectId, status: { $ne: "paid" }, dueDate: { $ne: null, $lte: new Date(now.getTime() + 3 * DAY) } })
      .select("creditor dueDate totalAmount paidAmount currency")
      .sort({ dueDate: 1 })
      .limit(10)
      .lean(),
    Account.find({ user: objectId, isArchived: { $ne: true }, isActive: { $ne: false }, balance: { $lt: 0 } })
      .select("name balance currency updatedAt")
      .lean(),
    SavingsGoal.find({ user: objectId, status: "completed", completedAt: { $gte: new Date(now.getTime() - 30 * DAY) } })
      .select("name completedAt")
      .lean(),
    Announcement.find({ recipients: objectId, createdAt: { $gte: new Date(now.getTime() - 30 * DAY) } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt")
      .lean(),
    RenewalRequest.find({ user: objectId, status: { $ne: "pending" }, handledAt: { $gte: new Date(now.getTime() - 14 * DAY) } })
      .select("plan status handledAt")
      .lean(),
  ]);
  const items = [];

  if (conversation?.unreadForUser > 0) {
    items.push({
      id: `chat-${new Date(conversation.lastMessage?.createdAt).getTime()}`,
      type: "chatMessage",
      params: { count: conversation.unreadForUser },
      link: "/chat",
      at: conversation.lastMessage?.createdAt,
    });
  }

  const end = user?.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
  if (end && end <= now) {
    items.push({ id: `sub-expired-${end.getTime()}`, type: "subscriptionExpired", params: {}, link: "/profile?tab=subscription", at: end });
  } else if (end && end.getTime() - now.getTime() <= 7 * DAY) {
    items.push({
      id: `sub-expiring-${end.getTime()}`,
      type: "subscriptionExpiring",
      params: { days: daysUntil(end, now) },
      link: "/profile?tab=subscription",
      at: new Date(end.getTime() - 7 * DAY),
    });
  }

  for (const debt of debts) {
    const due = new Date(debt.dueDate);
    const remaining = Math.max(0, (debt.totalAmount || 0) - (debt.paidAmount || 0));
    if (remaining <= 0) continue;
    const overdue = due < now;
    items.push({
      id: `debt-${overdue ? "overdue" : "due"}-${debt._id}`,
      type: overdue ? "debtOverdue" : "debtDueSoon",
      params: { creditor: debt.creditor, days: daysUntil(due, now), amount: remaining, currency: debt.currency },
      link: "/debts",
      at: overdue ? due : new Date(due.getTime() - 3 * DAY),
    });
  }

  for (const account of accounts) {
    items.push({
      id: `negative-${account._id}`,
      type: "negativeBalance",
      params: { name: account.name, amount: account.balance, currency: account.currency },
      link: "/accounts",
      at: account.updatedAt,
    });
  }

  for (const announcement of announcements) {
    items.push({
      id: `announcement-${announcement._id}`,
      type: "announcement",
      params: { title: announcement.title },
      link: "/announcements",
      at: announcement.createdAt,
    });
  }

  for (const decision of decisions) {
    items.push({
      id: `renewal-${decision._id}-${decision.status}`,
      type: decision.status === "approved" ? "renewalApproved" : "renewalRejected",
      params: { plan: decision.plan },
      link: "/profile?tab=subscription",
      at: decision.handledAt,
    });
  }

  for (const goal of goals) {
    items.push({ id: `goal-${goal._id}`, type: "goalCompleted", params: { name: goal.name }, link: "/savings", at: goal.completedAt });
  }

  return { items, seenAt: user?.notificationsSeenAt ?? null, readIds: user?.notificationsReadIds ?? [] };
}

exports.getUserNotifications = async (req, res, next) => {
  try {
    const { items, ...readState } = await userNotifications(req.userId);
    respond(res, items, readState);
  } catch (err) { next(err); }
};

exports.markUserNotificationRead = async (req, res, next) => {
  try {
    const id = readId(req, res);
    if (!id) return;
    await markOneRead(User, req.userId, id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.markAllUserNotificationsRead = async (req, res, next) => {
  try {
    await markAllRead(User, req.userId);
    res.json({ success: true });
  } catch (err) { next(err); }
};

/* ── admin (/api/admin/notifications) ────────────── */
async function adminNotifications(adminId) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const weekAhead = new Date(now.getTime() + 7 * DAY);
  const [admin, unreadChats, newUsers, expiring, expired, pendingRenewals] = await Promise.all([
    mongoose.isValidObjectId(adminId) ? Admin.findById(adminId).select("notificationsSeenAt notificationsReadIds").lean() : null,
    SupportConversation.find({ unreadForAdmin: { $gt: 0 } })
      .select("user unreadForAdmin lastMessage")
      .populate("user", "name email")
      .sort({ "lastMessage.createdAt": -1 })
      .limit(5)
      .lean(),
    User.find({ createdAt: { $gte: weekAgo } }).select("name email createdAt").sort({ createdAt: -1 }).limit(5).lean(),
    User.find({ isSuspended: { $ne: true }, subscriptionEnd: { $gt: now, $lte: weekAhead } }).select("subscriptionEnd").lean(),
    User.find({ isSuspended: { $ne: true }, subscriptionEnd: { $gt: weekAgo, $lte: now } }).select("subscriptionEnd").lean(),
    RenewalRequest.find({ status: "pending" }).sort({ createdAt: -1 }).limit(5).populate("user", "name email").lean(),
  ]);
  const items = [];

  for (const chat of unreadChats) {
    items.push({
      id: `chat-${chat._id}-${new Date(chat.lastMessage?.createdAt).getTime()}`,
      type: "userMessage",
      params: { name: chat.user?.name || chat.user?.email || "", count: chat.unreadForAdmin },
      link: chat.user?._id ? `/admin/chat?user=${chat.user._id}` : "/admin/chat",
      at: chat.lastMessage?.createdAt,
    });
  }

  for (const request of pendingRenewals) {
    items.push({
      id: `renewal-request-${request._id}`,
      type: "renewalRequest",
      params: { name: request.user?.name || request.user?.email || "", plan: request.plan },
      link: "/admin/renewals",
      at: request.createdAt,
    });
  }

  for (const user of newUsers) {
    items.push({
      id: `new-user-${user._id}`,
      type: "newUser",
      params: { name: user.name || user.email },
      link: `/admin/users?search=${encodeURIComponent(user.email)}`,
      at: user.createdAt,
    });
  }

  if (expiring.length) {
    // Became relevant when the first of them entered its last week.
    const first = Math.min(...expiring.map((u) => new Date(u.subscriptionEnd).getTime()));
    items.push({
      id: `expiring-${expiring.length}-${first}`,
      type: "subscriptionsExpiring",
      params: { count: expiring.length },
      link: "/admin/users?status=expiring",
      at: new Date(first - 7 * DAY),
    });
  }

  if (expired.length) {
    const latest = Math.max(...expired.map((u) => new Date(u.subscriptionEnd).getTime()));
    items.push({
      id: `expired-${expired.length}-${latest}`,
      type: "subscriptionsExpired",
      params: { count: expired.length },
      link: "/admin/users?status=expired",
      at: new Date(latest),
    });
  }

  return { items, seenAt: admin?.notificationsSeenAt ?? null, readIds: admin?.notificationsReadIds ?? [] };
}

exports.getAdminNotifications = async (req, res, next) => {
  try {
    const { items, ...readState } = await adminNotifications(req.adminId);
    respond(res, items, readState);
  } catch (err) { next(err); }
};

exports.markAdminNotificationRead = async (req, res, next) => {
  try {
    const id = readId(req, res);
    if (!id) return;
    if (mongoose.isValidObjectId(req.adminId)) await markOneRead(Admin, req.adminId, id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.markAllAdminNotificationsRead = async (req, res, next) => {
  try {
    if (mongoose.isValidObjectId(req.adminId)) await markAllRead(Admin, req.adminId);
    res.json({ success: true });
  } catch (err) { next(err); }
};
