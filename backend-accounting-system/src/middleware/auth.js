const jwt = require("jsonwebtoken");
const { isValidAdminToken } = require("../utils/adminToken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    if (isValidAdminToken(token)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Admin tokens must never reach regular-user endpoints
  if (payload.role === "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    const user = await User.findById(payload.id).select("isSuspended");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: "ACCOUNT_SUSPENDED" });
    }
    req.userId = payload.id;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authMiddleware;
