const crypto = require("crypto");
const { sendPasswordResetEmail } = require("./mailer");

const resetTokens = new Map();
const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

async function sendPasswordResetLink(email) {
  const token = crypto.randomBytes(32).toString("hex");
  resetTokens.set(token, { email, expiresAt: Date.now() + RESET_TOKEN_TTL_MS });

  try {
    await sendPasswordResetEmail(email, token);
  } catch (error) {
    resetTokens.delete(token);
    throw error;
  }
}

function getPasswordResetEntry(token) {
  if (typeof token !== "string") return null;
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  return entry;
}

function consumePasswordResetToken(token) {
  resetTokens.delete(token);
}

module.exports = { sendPasswordResetLink, getPasswordResetEntry, consumePasswordResetToken };
