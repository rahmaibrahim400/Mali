const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function adminView(admin) {
  return { id: admin._id, name: admin.name, email: admin.email, avatar: admin.avatar || "" };
}

async function loadAdmin(req, res, withPassword = false) {
  const query = mongoose.isValidObjectId(req.adminId) ? Admin.findById(req.adminId) : null;
  const admin = query ? await (withPassword ? query.select("+password") : query) : null;
  if (!admin) res.status(401).json({ success: false, message: "Unauthorized" });
  return admin;
}

// A wrong current password is a 400, not a 401: the admin client treats 401 as "session expired".
async function checkCurrentPassword(admin, currentPassword, res) {
  if (typeof currentPassword !== "string" || !currentPassword || !(await admin.comparePassword(currentPassword))) {
    res.status(400).json({ success: false, message: "كلمة السر الحالية غير صحيحة" });
    return false;
  }
  return true;
}

/* ── PUT /api/admin/settings/profile ─────────────── */
exports.updateProfile = async (req, res, next) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 100) {
      return res.status(400).json({ success: false, message: "الاسم مطلوب ولا يزيد عن 100 حرف" });
    }
    const admin = await loadAdmin(req, res);
    if (!admin) return;
    admin.name = name;
    await admin.save();
    res.json({ success: true, data: adminView(admin) });
  } catch (err) { next(err); }
};

/* ── PUT /api/admin/settings/photo ───────────────── */
exports.uploadPhoto = async (req, res, next) => {
  try {
    const { avatar } = req.body ?? {};
    if (typeof avatar !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(avatar)) {
      return res.status(400).json({ success: false, message: "صيغة الصورة غير مدعومة (JPG / PNG / WEBP فقط)" });
    }
    const bytes = Math.ceil((avatar.split(",")[1] ?? "").length * 0.75);
    if (bytes > MAX_AVATAR_BYTES) {
      return res.status(400).json({ success: false, message: "حجم الصورة كبير، الحد الأقصى 5MB" });
    }
    const admin = await loadAdmin(req, res);
    if (!admin) return;
    admin.avatar = avatar;
    await admin.save();
    res.json({ success: true, data: adminView(admin) });
  } catch (err) { next(err); }
};

/* ── DELETE /api/admin/settings/photo ────────────── */
exports.deletePhoto = async (req, res, next) => {
  try {
    const admin = await loadAdmin(req, res);
    if (!admin) return;
    admin.avatar = "";
    await admin.save();
    res.json({ success: true, data: adminView(admin) });
  } catch (err) { next(err); }
};

/* ── PUT /api/admin/settings/email ───────────────── */
exports.changeEmail = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "الإيميل غير صحيح" });
    }
    const admin = await loadAdmin(req, res, true);
    if (!admin) return;
    if (!(await checkCurrentPassword(admin, req.body?.currentPassword, res))) return;
    if (email !== admin.email && (await Admin.exists({ email }))) {
      return res.status(409).json({ success: false, message: "الإيميل ده مستخدم بالفعل" });
    }
    admin.email = email;
    await admin.save();
    res.json({ success: true, data: adminView(admin) });
  } catch (err) { next(err); }
};

/* ── PUT /api/admin/settings/password ────────────── */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "كل الحقول مطلوبة" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "كلمة السر الجديدة مش متطابقة" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "كلمة السر لازم تكون 8 حروف على الأقل وفيها حرف كبير ورقم",
      });
    }
    const admin = await loadAdmin(req, res, true);
    if (!admin) return;
    if (!(await checkCurrentPassword(admin, currentPassword, res))) return;
    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: "تم تغيير كلمة السر بنجاح" });
  } catch (err) { next(err); }
};
