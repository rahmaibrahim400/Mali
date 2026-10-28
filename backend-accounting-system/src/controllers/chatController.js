const mongoose = require("mongoose");
const User = require("../models/User");
const SupportConversation = require("../models/SupportConversation");
const SupportMessage = require("../models/SupportMessage");
const SupportAudio = require("../models/SupportAudio");

const MAX_TEXT = 2000;
const MESSAGE_PAGE = 100;
const CONTACTS_PAGE = 30;
const MAX_AUDIO_BYTES = 3 * 1024 * 1024; // ~3 MB, a few minutes of compressed speech
const MAX_AUDIO_SECONDS = 300;
const AUDIO_TYPES = /^audio\/(webm|ogg|mp4|mpeg|aac|x-m4a|wav)(;\s*codecs=[\w.,-]+)?$/i;

/* ── helpers ─────────────────────────────────────── */
function readText(body) {
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return { error: "Message text is required" };
  if (text.length > MAX_TEXT) return { error: `Message cannot exceed ${MAX_TEXT} characters` };
  return { text };
}

// A message is either text or a voice recording sent as base64 (`{ audio, mimeType, duration }`).
function readPayload(body) {
  if (body?.audio === undefined) return readText(body);
  if (typeof body.audio !== "string" || typeof body.mimeType !== "string" || !AUDIO_TYPES.test(body.mimeType)) {
    return { error: "Invalid voice message" };
  }
  const data = Buffer.from(body.audio, "base64");
  if (!data.length) return { error: "Invalid voice message" };
  if (data.length > MAX_AUDIO_BYTES) return { error: "Voice message is too long" };
  const duration = Number(body.duration);
  if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_AUDIO_SECONDS) {
    return { error: "Invalid voice message duration" };
  }
  return { audio: { data, mimeType: body.mimeType, duration: Math.round(duration * 10) / 10 } };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toMessage(m) {
  const deleted = Boolean(m.deletedAt);
  return {
    _id: m._id,
    sender: m.sender,
    text: deleted ? "" : m.text,
    audio: !deleted && m.audio?.file ? { duration: m.audio.duration, mimeType: m.audio.mimeType } : null,
    deleted,
    editedAt: deleted ? null : m.editedAt,
    deliveredAt: m.deliveredAt,
    readAt: m.readAt,
    createdAt: m.createdAt,
  };
}

const unreadCounterFor = (recipient) => (recipient === "user" ? "unreadForUser" : "unreadForAdmin");
const otherSide = (side) => (side === "user" ? "admin" : "user");

// Latest messages, oldest first.
async function listMessages(conversationId) {
  const messages = await SupportMessage.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .limit(MESSAGE_PAGE)
    .lean();
  return messages.reverse().map(toMessage);
}

// The reader opened the thread: everything the other side sent is now delivered and read.
async function markRead(conversation, reader) {
  const counter = unreadCounterFor(reader);
  if (!conversation[counter]) return;
  const now = new Date();
  const filter = { conversation: conversation._id, sender: otherSide(reader), readAt: null };
  await SupportMessage.updateMany({ ...filter, deliveredAt: null }, { $set: { deliveredAt: now } });
  await SupportMessage.updateMany(filter, { $set: { readAt: now } });
  await SupportConversation.updateOne({ _id: conversation._id }, { $set: { [counter]: 0 } });
}

// The recipient has the app open (it is polling for unread messages): second grey tick.
function markDelivered(filter) {
  return SupportMessage.updateMany({ ...filter, deliveredAt: null }, { $set: { deliveredAt: new Date() } });
}

async function addMessage(userId, sender, { text = "", audio }, adminId) {
  const now = new Date();
  const conversation = await SupportConversation.findOneAndUpdate(
    { user: userId },
    {
      $set: { lastMessage: { text, sender, createdAt: now, deleted: false, audio: Boolean(audio) } },
      $inc: { [unreadCounterFor(otherSide(sender))]: 1 },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const file = audio ? await SupportAudio.create({ data: audio.data, mimeType: audio.mimeType }) : null;
  const message = await SupportMessage.create({
    conversation: conversation._id,
    sender,
    admin: adminId || undefined,
    text,
    audio: file ? { file: file._id, mimeType: audio.mimeType, duration: audio.duration } : undefined,
  });
  return toMessage(message);
}

// Keeps the chat-list preview in sync when the latest message is edited or deleted.
async function refreshLastMessage(conversationId) {
  const latest = await SupportMessage.findOne({ conversation: conversationId }).sort({ createdAt: -1 }).lean();
  await SupportConversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessage: latest
          ? {
              text: latest.deletedAt ? "" : latest.text,
              sender: latest.sender,
              createdAt: latest.createdAt,
              deleted: Boolean(latest.deletedAt),
              audio: !latest.deletedAt && Boolean(latest.audio?.file),
            }
          : { text: "" },
      },
    },
  );
}

function sendError(res, status, message) {
  res.status(status).json({ success: false, message });
  return null;
}

// Finds a message the caller may see, optionally limited to `conversationFilter` (a user's own thread).
async function findMessage(req, res, conversationFilter) {
  const { messageId } = req.params;
  if (!mongoose.isValidObjectId(messageId)) return sendError(res, 400, "Invalid message id");
  const message = await SupportMessage.findById(messageId);
  if (!message) return sendError(res, 404, "Message not found");
  if (conversationFilter) {
    const owns = await SupportConversation.exists({ _id: message.conversation, ...conversationFilter });
    if (!owns) return sendError(res, 404, "Message not found");
  }
  return message;
}

// A message the caller may change: sent by their side and not deleted.
async function findOwnMessage(req, res, side, conversationFilter) {
  const message = await findMessage(req, res, conversationFilter);
  if (!message) return null;
  if (message.sender !== side) return sendError(res, 404, "Message not found");
  if (message.deletedAt) return sendError(res, 400, "Message was deleted");
  return message;
}

async function editMessage(req, res, side, conversationFilter) {
  const { text, error } = readText(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  const message = await findOwnMessage(req, res, side, conversationFilter);
  if (!message) return;
  if (message.audio?.file) return res.status(400).json({ success: false, message: "Voice messages cannot be edited" });
  message.text = text;
  message.editedAt = new Date();
  await message.save();
  await refreshLastMessage(message.conversation);
  res.json({ success: true, data: toMessage(message) });
}

async function deleteMessage(req, res, side, conversationFilter) {
  const message = await findOwnMessage(req, res, side, conversationFilter);
  if (!message) return;
  const wasUnread = !message.readAt;
  const audioFile = message.audio?.file;
  message.deletedAt = new Date();
  message.text = "";
  message.audio = undefined;
  await message.save();
  if (audioFile) await SupportAudio.deleteOne({ _id: audioFile });
  if (wasUnread) {
    // The recipient never read it, so it no longer counts as unread for them.
    const counter = unreadCounterFor(otherSide(side));
    await SupportConversation.updateOne(
      { _id: message.conversation, [counter]: { $gt: 0 } },
      { $inc: { [counter]: -1 } },
    );
  }
  await refreshLastMessage(message.conversation);
  res.json({ success: true, data: toMessage(message) });
}

// Sends a voice message's recording (the app fetches it with its auth header).
async function sendAudio(req, res, conversationFilter) {
  const message = await findMessage(req, res, conversationFilter);
  if (!message) return;
  if (message.deletedAt || !message.audio?.file) return sendError(res, 404, "Voice message not found");
  const file = await SupportAudio.findById(message.audio.file);
  if (!file) return sendError(res, 404, "Voice message not found");
  res.set("Content-Type", file.mimeType);
  res.set("Cache-Control", "private, max-age=86400");
  res.send(file.data);
}

/* ── user side (/api/chat) ───────────────────────── */
exports.getMyMessages = async (req, res, next) => {
  try {
    const conversation = await SupportConversation.findOne({ user: req.userId });
    if (!conversation) return res.json({ success: true, data: [] });
    await markRead(conversation, "user");
    const data = await listMessages(conversation._id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.sendMyMessage = async (req, res, next) => {
  try {
    const { error, ...payload } = readPayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const data = await addMessage(req.userId, "user", payload);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.editMyMessage = async (req, res, next) => {
  try { await editMessage(req, res, "user", { user: req.userId }); } catch (err) { next(err); }
};

exports.deleteMyMessage = async (req, res, next) => {
  try { await deleteMessage(req, res, "user", { user: req.userId }); } catch (err) { next(err); }
};

exports.getMyAudio = async (req, res, next) => {
  try { await sendAudio(req, res, { user: req.userId }); } catch (err) { next(err); }
};

exports.getMyUnread = async (req, res, next) => {
  try {
    const conversation = await SupportConversation.findOne({ user: req.userId }).select("unreadForUser").lean();
    if (conversation) await markDelivered({ conversation: conversation._id, sender: "admin" });
    res.json({ success: true, data: { count: conversation?.unreadForUser ?? 0 } });
  } catch (err) { next(err); }
};

/* ── admin side (/api/admin/chat) ────────────────── */

// Every registered user: chats with recent messages first, then everyone else by name.
exports.getContacts = async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const match = {};
    if (search) {
      const safe = escapeRegex(search);
      match.$or = [{ name: { $regex: safe, $options: "i" } }, { email: { $regex: safe, $options: "i" } }];
    }

    const [result] = await User.aggregate([
      { $match: match },
      {
        $lookup: {
          from: SupportConversation.collection.name,
          localField: "_id",
          foreignField: "user",
          as: "conversation",
        },
      },
      { $addFields: { conversation: { $first: "$conversation" } } },
      { $addFields: { lastAt: { $ifNull: ["$conversation.lastMessage.createdAt", null] } } },
      { $sort: { lastAt: -1, name: 1, _id: 1 } },
      {
        $facet: {
          items: [
            { $skip: (page - 1) * CONTACTS_PAGE },
            { $limit: CONTACTS_PAGE },
            {
              $project: {
                name: 1,
                email: 1,
                avatar: 1,
                lastMessage: "$conversation.lastMessage",
                unread: { $ifNull: ["$conversation.unreadForAdmin", 0] },
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const total = result?.total[0]?.count ?? 0;
    res.json({
      success: true,
      data: result?.items ?? [],
      pagination: { page, limit: CONTACTS_PAGE, total, pages: Math.ceil(total / CONTACTS_PAGE) },
    });
  } catch (err) { next(err); }
};

exports.getUserMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    const user = await User.findById(userId).select("name email avatar").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const conversation = await SupportConversation.findOne({ user: userId });
    if (conversation) await markRead(conversation, "admin");
    const data = conversation ? await listMessages(conversation._id) : [];
    res.json({ success: true, data, user });
  } catch (err) { next(err); }
};

exports.sendToUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    const { error, ...payload } = readPayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    if (!(await User.exists({ _id: userId }))) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const data = await addMessage(userId, "admin", payload, req.adminId);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// Admins share one inbox, so any admin may edit or delete a message sent by the admin side.
exports.editAdminMessage = async (req, res, next) => {
  try { await editMessage(req, res, "admin"); } catch (err) { next(err); }
};

exports.deleteAdminMessage = async (req, res, next) => {
  try { await deleteMessage(req, res, "admin"); } catch (err) { next(err); }
};

exports.getAdminAudio = async (req, res, next) => {
  try { await sendAudio(req, res); } catch (err) { next(err); }
};

exports.getAdminUnread = async (req, res, next) => {
  try {
    await markDelivered({ sender: "user" });
    const [result] = await SupportConversation.aggregate([
      { $match: { unreadForAdmin: { $gt: 0 } } },
      { $group: { _id: null, count: { $sum: "$unreadForAdmin" }, chats: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: { count: result?.count ?? 0, chats: result?.chats ?? 0 } });
  } catch (err) { next(err); }
};
