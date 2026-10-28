const mongoose = require("mongoose");
const { Schema } = mongoose;

// Voice-message recordings, kept apart from SupportMessage so listing messages stays light.
const supportAudioSchema = new Schema({
  data:     { type: Buffer, required: true },
  mimeType: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("SupportAudio", supportAudioSchema);
