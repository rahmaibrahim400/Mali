const mongoose = require("mongoose");
const { Schema } = mongoose;

// One support thread per user, shared by every admin (like a team inbox).
const supportConversationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  lastMessage: {
    text:      { type: String, default: "" },
    sender:    { type: String, enum: ["user", "admin"] },
    createdAt: { type: Date },
    deleted:   { type: Boolean, default: false },
    audio:     { type: Boolean, default: false },
  },
  unreadForUser:  { type: Number, default: 0, min: 0 },
  unreadForAdmin: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

supportConversationSchema.index({ "lastMessage.createdAt": -1 });

module.exports = mongoose.model("SupportConversation", supportConversationSchema);
