const mongoose = require("mongoose");
const { Schema } = mongoose;

// A user renewing (or changing) their plan. They pay first and attach proof; the subscription
// only starts once an admin confirms the payment ("approved").
const renewalRequestSchema = new Schema({
  user:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  plan:      { type: String, enum: ["3months", "6months", "yearly"], required: true },
  note:      { type: String, trim: true, maxlength: 500, default: "" },
  // pending = paid, waiting for an admin to check the payment
  status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  payment: {
    method:    { type: String, enum: ["vodafone_cash", "instapay", "card"] },
    amount:    { type: Number },              // the plan price when the request was made
    currency:  { type: String, default: "EGP" },
    reference: { type: String, trim: true, maxlength: 100 },  // transaction / reference number
    sender:    { type: String, trim: true, maxlength: 100 },  // wallet number or InstaPay address paid from
    proof:     { type: Schema.Types.ObjectId, ref: "PaymentProof" }, // screenshot of the transfer
    verifiedAt: { type: Date },
  },
  handledBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  handledAt: { type: Date },
  response:  { type: String, trim: true, maxlength: 500, default: "" },
}, { timestamps: true });

renewalRequestSchema.index({ status: 1, createdAt: -1 });
renewalRequestSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("RenewalRequest", renewalRequestSchema);
