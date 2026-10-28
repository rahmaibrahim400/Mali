const mongoose = require("mongoose");
const { Schema } = mongoose;

// Where users send money (a single document, edited from admin Settings → Payments).
const paymentSettingsSchema = new Schema({
  key:               { type: String, default: "main", unique: true },
  vodafoneCashNumber: { type: String, trim: true, maxlength: 30, default: "" },
  vodafoneCashName:   { type: String, trim: true, maxlength: 80, default: "" },
  instapayAddress:    { type: String, trim: true, maxlength: 80, default: "" },
  instapayName:       { type: String, trim: true, maxlength: 80, default: "" },
  instructions:       { type: String, trim: true, maxlength: 500, default: "" },
  // Plan prices set by the admin; an empty one falls back to config/subscriptionPlans.
  planPrices: {
    "3months": { type: Number, min: 0 },
    "6months": { type: Number, min: 0 },
    yearly:    { type: Number, min: 0 },
  },
}, { timestamps: true });

paymentSettingsSchema.statics.get = async function get() {
  return (await this.findOne({ key: "main" }).lean()) ?? { key: "main" };
};

module.exports = mongoose.model("PaymentSettings", paymentSettingsSchema);
