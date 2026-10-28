const User = require("../models/User");
const { userStatus } = require("../utils/subscription");

// Blocks mutating requests (POST/PUT/DELETE/PATCH) when subscription is expired.
// GET requests always pass through (read-only access is allowed).
module.exports = async function subscriptionCheck(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  try {
    // Only the fields userStatus() needs — never the photo, this runs on every change.
    const user = await User.findById(req.userId).select("isSuspended subscriptionEnd").lean();
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Same rule as the status shown in the app and the admin panel (utils/subscription).
    if (userStatus(user) === "expired") {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_EXPIRED",
        message: "Your subscription has expired. Please renew to make changes.",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
