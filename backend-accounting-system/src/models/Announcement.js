const mongoose = require("mongoose");
const { Schema } = mongoose;

// A message from the admin team to many users at once; shows up in their notifications.
const announcementSchema = new Schema({
  title:      { type: String, required: true, trim: true, maxlength: 120 },
  body:       { type: String, required: true, trim: true, maxlength: 2000 },
  audience:   { type: String, enum: ["all", "active", "expiring", "expired", "trial", "paid"], default: "all" },
  // Who matched the audience when it was sent.
  recipients: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdBy:  { type: Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

announcementSchema.index({ recipients: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
