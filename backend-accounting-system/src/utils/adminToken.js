const jwt = require("jsonwebtoken");

/* Admin tokens use their own secret so a user token can never verify as an admin token. */
const ADMIN_TOKEN_TTL = "30m";

function getAdminSecret() {
  const secret = process.env.JWT_ADMIN_SECRET;
  if (!secret) throw new Error("JWT_ADMIN_SECRET is not set");
  return secret;
}

function signAdminToken(adminId) {
  return jwt.sign({ id: adminId, role: "admin" }, getAdminSecret(), { expiresIn: ADMIN_TOKEN_TTL });
}

/* Throws jsonwebtoken errors (TokenExpiredError / JsonWebTokenError) like jwt.verify. */
function verifyAdminToken(token) {
  return jwt.verify(token, getAdminSecret());
}

function isValidAdminToken(token) {
  try {
    return verifyAdminToken(token).role === "admin";
  } catch {
    return false;
  }
}

function isValidUserToken(token) {
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

module.exports = { ADMIN_TOKEN_TTL, signAdminToken, verifyAdminToken, isValidAdminToken, isValidUserToken };
