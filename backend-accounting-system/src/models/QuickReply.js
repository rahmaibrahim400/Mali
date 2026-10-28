const mongoose = require("mongoose");
const { Schema } = mongoose;

// Saved answers the admin team can drop into a chat in one click.
const quickReplySchema = new Schema({
  title:     { type: String, required: true, trim: true, maxlength: 60 },
  text:      { type: String, required: true, trim: true, maxlength: 2000 },
  createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

module.exports = mongoose.model("QuickReply", quickReplySchema);
