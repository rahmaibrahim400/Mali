/*
 * Creates an admin directly in the database (the only supported way in production).
 *
 * Usage:
 *   node scripts/createAdmin.js <email> <password> [name]
 * or via env vars:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... node scripts/createAdmin.js
 *
 * The password is hashed (bcrypt) by the Admin model's pre-save hook.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Admin    = require("../src/models/Admin");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message) {
  console.error("❌", message);
  process.exit(1);
}

async function main() {
  const [argEmail, argPassword, ...nameParts] = process.argv.slice(2);
  const email    = (argEmail ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = argPassword ?? process.env.ADMIN_PASSWORD ?? "";
  const name     = (nameParts.join(" ") || process.env.ADMIN_NAME || "Admin").trim();

  if (!email || !password) fail("Usage: node scripts/createAdmin.js <email> <password> [name]");
  if (!EMAIL_RE.test(email)) fail("Invalid email format");
  if (password.length < 8 || !/\d/.test(password) || !/[A-Z]/.test(password)) {
    fail("Password must be at least 8 characters and contain a digit and an uppercase letter");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await Admin.findOne({ email });
  if (exists) {
    await mongoose.disconnect();
    fail(`Admin with email ${email} already exists`);
  }

  await Admin.create({ name, email, password });
  console.log(`✅ Admin created successfully: ${email}`);
  await mongoose.disconnect();
}

main().catch(err => fail(err.message));
