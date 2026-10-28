const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone:    { type: String, default: "" },
    avatar:   { type: String, default: "" }, // base64 data URL
    locale:   { type: String, enum: ["ar", "en", "tr"], default: "ar" },

    /* ── subscription (managed by admin) ── */
    subscriptionType:  { type: String, enum: ["trial","3months","6months","yearly","custom"], default: "trial" },
    subscriptionStart: { type: Date, default: Date.now },
    subscriptionEnd:   { type: Date },
    isSuspended:       { type: Boolean, default: false },

    /* notifications: "read all" mark + ids read one by one since then */
    notificationsSeenAt: { type: Date, default: null },
    notificationsReadIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: 1 });
userSchema.index({ subscriptionEnd: 1, isSuspended: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
