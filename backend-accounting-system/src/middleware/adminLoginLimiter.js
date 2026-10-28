const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

/*
 * Brute-force protection for POST /api/admin/auth/login.
 * Counts only failed attempts (status >= 400) per IP + email;
 * the 6th failed attempt inside the window is blocked with 429 for 5 minutes.
 */
const adminLoginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    return `${ipKeyGenerator(req.ip)}|${email}`;
  },
  message: { success: false, message: "Too many login attempts. Please try again after 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = adminLoginLimiter;
