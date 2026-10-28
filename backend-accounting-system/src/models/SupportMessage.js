const mongoose = require("mongoose");
const { Schema } = mongoose;

const supportMessageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: "SupportConversation", required: true },
  sender:       { type: String, enum: ["user", "admin"], required: true },
  admin:        { type: Schema.Types.ObjectId, ref: "Admin" }, // which admin replied
  text:         { type: String, trim: true, maxlength: 2000, default: "" },
  // Voice message: the recording lives in SupportAudio.
  audio: {
    file:     { type: Schema.Types.ObjectId, ref: "SupportAudio" },
    mimeType: { type: String },
    duration: { type: Number }, // seconds
  },
  // Ticks: sent (no dates) → delivered (recipient had the app open) → read (recipient opened the chat).
  deliveredAt:  { type: Date, default: null },
  readAt:       { type: Date, default: null },
  editedAt:     { type: Date, default: null },
  deletedAt:    { type: Date, default: null }, // soft delete: shown as "message deleted"
}, { timestamps: true });

supportMessageSchema.index({ conversation: 1, createdAt: -1 });
supportMessageSchema.index({ sender: 1, deliveredAt: 1 });

module.exports = mongoose.model("SupportMessage", supportMessageSchema);
