const mongoose = require("mongoose");
const { Schema } = mongoose;

// Screenshot of a transfer attached to a renewal request (kept apart so listing requests stays light).
const paymentProofSchema = new Schema({
  data:     { type: Buffer, required: true },
  mimeType: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("PaymentProof", paymentProofSchema);
