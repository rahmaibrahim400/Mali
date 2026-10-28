const { verifyAdminToken, isValidUserToken } = require("../utils/adminToken");

/*
 * 401 → no token / expired / invalid  (frontend redirects to /login)
 * 403 → a valid token that is not an admin token (e.g. a regular user token)
 */
module.exports = function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired" });
    }
    if (isValidUserToken(token)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  if (payload.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  req.adminId = payload.id;
  next();
};
