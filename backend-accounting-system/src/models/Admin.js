const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, default: "superadmin" },
  avatar:   { type: String, default: "" }, // base64 data URL
  notificationsSeenAt: { type: Date, default: null }, // "read all" mark
  notificationsReadIds: { type: [String], default: [] }, // read one by one since then
}, { timestamps: true });

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
