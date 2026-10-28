const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Admin = require("../models/Admin");
const ExpenseCategory = require("../models/ExpenseCategory");
const { calcEnd } = require("../utils/subscription");
const { signAdminToken, ADMIN_TOKEN_TTL } = require("../utils/adminToken");
const {
  sendPasswordResetLink,
  getPasswordResetEntry,
  consumePasswordResetToken,
} = require("../services/passwordResetService");

// Default categories seeded for every new user (isDefault = true — cannot be deleted)
const DEFAULT_CATEGORIES = [
  { name: "أكل",       type: "daily",     color: "#ef4444" },
  { name: "مواصلات",   type: "daily",     color: "#ef4444" },
  { name: "إيجار",     type: "fixed",     color: "#facc15" },
  { name: "فواتير",    type: "fixed",     color: "#facc15" },
  { name: "صحة",       type: "emergency", color: "#9ca3af" },
  { name: "تعليم",     type: "fixed",     color: "#facc15" },
  { name: "تسلية",     type: "daily",     color: "#ef4444" },
  { name: "غيره",      type: "daily",     color: "#ef4444" },
];

// In-memory brute-force tracking: email → { count, blockedUntil }
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
let dummyHashPromise;

function getDummyHash() {
  dummyHashPromise ??= bcrypt.hash("dummy-password-for-timing", 12);
  return dummyHashPromise;
}

function getBruteForceError(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return null;
  if (entry.blockedUntil && Date.now() < entry.blockedUntil) {
    const remaining = Math.ceil((entry.blockedUntil - Date.now()) / 1000 / 60);
    return `Too many failed attempts. Try again in ${remaining} minute(s).`;
  }
  return null;
}

function recordFailedAttempt(email) {
  const entry = loginAttempts.get(email) ?? { count: 0, blockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    entry.count = 0;
  }
  loginAttempts.set(email, entry);
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

function signToken(id, rememberMe = false) {
  const expiresIn = rememberMe ? "30d" : "24h";
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }
    // A new account starts on the free trial (14 days, utils/subscription). Without an end date
    // the trial would never expire.
    const now = new Date();
    const created = await User.create({
      name,
      email,
      password,
      subscriptionType: "trial",
      subscriptionStart: now,
      subscriptionEnd: calcEnd("trial", now),
    });

    // Seed default expense categories for the new user
    await ExpenseCategory.insertMany(
      DEFAULT_CATEGORIES.map((cat) => ({ ...cat, user: created._id, isDefault: true }))
    );

    const token = signToken(created._id);
    const user  = await User.findById(created._id);
    res.status(201).json({
      success: true,
      data: { token, user },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { rememberMe = false } = req.body ?? {};
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = req.body?.password;
    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const blockError = getBruteForceError(email);
    if (blockError) {
      return res.status(429).json({ success: false, message: blockError });
    }

    // The photo is left out: it can be hundreds of KB and makes this read take seconds.
    // The app loads it afterwards from /auth/avatar (or /admin/auth/avatar).
    const [admin, user] = await Promise.all([
      Admin.findOne({ email }).select("+password -avatar"),
      User.findOne({ email }).select("+password -avatar"),
    ]);

    if (admin && await admin.comparePassword(password)) {
      clearAttempts(email);
      const token = signAdminToken(admin._id);
      return res.json({
        success: true,
        data: {
          accountType: "admin",
          token,
          expiresIn: ADMIN_TOKEN_TTL,
          admin: { id: admin._id, name: admin.name, email: admin.email },
        },
      });
    }

    if (!user) {
      await bcrypt.compare(password, await getDummyHash());
      recordFailedAttempt(email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!(await user.comparePassword(password))) {
      recordFailedAttempt(email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: "ACCOUNT_SUSPENDED" });
    }

    clearAttempts(email);
    const token = signToken(user._id, rememberMe);

    // Reuse the document already loaded above (minus the password) instead of reading it again.
    const { password: _password, ...safeUser } = user.toObject();
    res.json({
      success: true,
      data: {
        accountType: "user",
        token,
        user: safeUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    // Without the photo, so the app opens right away; it comes from /auth/avatar.
    const user = await User.findById(req.userId).select("-avatar");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.avatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("avatar").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { avatar: user.avatar || "" } });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to avoid email enumeration
    if (user) {
      try {
        await sendPasswordResetLink(email);
      } catch (mailErr) {
        console.error("sendPasswordResetEmail failed:", mailErr.message);
      }
    }

    res.json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const entry = getPasswordResetEntry(token);

    if (!entry) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
    }

    const user = await User.findOne({ email: entry.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = password;
    await user.save();
    consumePasswordResetToken(token);

    res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    next(err);
  }
};
