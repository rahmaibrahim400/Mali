const mongoose = require("mongoose");
const User = require("../models/User");
const Announcement = require("../models/Announcement");
const RenewalRequest = require("../models/RenewalRequest");
const PaymentProof = require("../models/PaymentProof");
const PaymentSettings = require("../models/PaymentSettings");
const { pricesFrom, SUBSCRIPTION_CURRENCY } = require("../config/subscriptionPlans");
const { userStatus } = require("../utils/subscription");

const PAID_PLANS = ["3months", "6months", "yearly"];
const MAX_PROOF_BYTES = 4 * 1024 * 1024;

// Which ways to pay are open right now, with where to send the money.
// Card payments need a payment gateway, which isn't connected yet.
function paymentMethods(settings) {
  return [
    {
      method: "vodafone_cash",
      available: Boolean(settings.vodafoneCashNumber),
      account: settings.vodafoneCashNumber || "",
      accountName: settings.vodafoneCashName || "",
    },
    {
      method: "instapay",
      available: Boolean(settings.instapayAddress),
      account: settings.instapayAddress || "",
      accountName: settings.instapayName || "",
    },
    { method: "card", available: false, account: "", accountName: "" },
  ];
}

// "data:image/png;base64,...." → { data, mimeType } (or an error message).
function readProof(value) {
  const match = typeof value === "string" ? value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) : null;
  if (!match) return { error: "ارفع صورة إثبات الدفع (JPG / PNG / WEBP)" };
  const data = Buffer.from(match[2], "base64");
  if (!data.length) return { error: "صورة إثبات الدفع غير صالحة" };
  if (data.length > MAX_PROOF_BYTES) return { error: "حجم صورة الإثبات كبير، الحد الأقصى 4MB" };
  return { data, mimeType: match[1] };
}

/* ── GET /api/announcements ──────────────────────── */
exports.listMyAnnouncements = async (req, res, next) => {
  try {
    const items = await Announcement.find({ recipients: new mongoose.Types.ObjectId(req.userId) })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("title body createdAt")
      .lean();
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

/* ── GET /api/renewal — my plan, prices and my latest request ── */
exports.getMyRenewal = async (req, res, next) => {
  try {
    const [user, latest, settings] = await Promise.all([
      User.findById(req.userId).select("subscriptionType subscriptionStart subscriptionEnd isSuspended").lean(),
      RenewalRequest.findOne({ user: req.userId }).sort({ createdAt: -1 }).select("-payment.proof").lean(),
      PaymentSettings.get(),
    ]);
    res.json({
      success: true,
      data: {
        subscription: user ? { ...user, _status: userStatus(user) } : null,
        plans: PAID_PLANS.map((plan) => ({ plan, price: pricesFrom(settings)[plan] ?? 0 })),
        currency: SUBSCRIPTION_CURRENCY,
        paymentMethods: paymentMethods(settings),
        paymentInstructions: settings.instructions || "",
        latest,
      },
    });
  } catch (err) { next(err); }
};

/* ── POST /api/renewal { plan, method, reference, sender, proof, note } ──
   The user pays first (Vodafone Cash / InstaPay) and sends the proof; an admin then
   checks the payment before the plan starts. */
exports.requestRenewal = async (req, res, next) => {
  try {
    const bad = (message, status = 400) => res.status(status).json({ success: false, message });
    const body = req.body ?? {};
    const plan = PAID_PLANS.includes(body.plan) ? body.plan : null;
    if (!plan) return bad("اختار الباقة");

    const settings = await PaymentSettings.get();
    const method = paymentMethods(settings).find((option) => option.method === body.method);
    if (!method) return bad("اختار طريقة الدفع");
    if (!method.available) return bad("طريقة الدفع دي مش متاحة دلوقتي");

    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    const sender = typeof body.sender === "string" ? body.sender.trim() : "";
    if (!reference || reference.length > 100) return bad("اكتب رقم العملية (الرقم المرجعي)");
    if (!sender || sender.length > 100) {
      return bad(method.method === "vodafone_cash" ? "اكتب رقم المحفظة اللي حوّلت منها" : "اكتب عنوان InstaPay اللي حوّلت منه");
    }
    const proof = readProof(body.proof);
    if (proof.error) return bad(proof.error);
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

    if (await RenewalRequest.exists({ user: req.userId, status: "pending" })) {
      return bad("عندك طلب تجديد لسه تحت المراجعة", 409);
    }

    const file = await PaymentProof.create({ data: proof.data, mimeType: proof.mimeType });
    const request = await RenewalRequest.create({
      user: req.userId,
      plan,
      note,
      payment: {
        method: method.method,
        amount: pricesFrom(settings)[plan] ?? 0,
        currency: SUBSCRIPTION_CURRENCY,
        reference,
        sender,
        proof: file._id,
      },
    });
    const { payment, ...rest } = request.toObject();
    res.status(201).json({ success: true, data: { ...rest, payment: { ...payment, proof: undefined } } });
  } catch (err) { next(err); }
};

/* ── DELETE /api/renewal — cancel my pending request ── */
exports.cancelMyRenewal = async (req, res, next) => {
  try {
    const request = await RenewalRequest.findOneAndDelete({ user: req.userId, status: "pending" });
    if (request?.payment?.proof) await PaymentProof.deleteOne({ _id: request.payment.proof });
    res.json({ success: true });
  } catch (err) { next(err); }
};
