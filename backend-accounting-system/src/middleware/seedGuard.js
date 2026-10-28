const crypto = require("crypto");

/*
 * Locks POST /api/admin/auth/seed:
 *  - production  → 404 (the route behaves as if it does not exist)
 *  - development → requires header `x-seed-secret` matching ADMIN_SEED_SECRET
 * The supported way to create an admin is `node scripts/createAdmin.js`.
 */
module.exports = function seedGuard(req, res, next) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Route not found" });
  }

  const expected = process.env.ADMIN_SEED_SECRET;
  const provided = req.headers["x-seed-secret"];
  if (!expected || typeof provided !== "string") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
};
