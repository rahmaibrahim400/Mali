const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      required: true,
      enum: ["daily", "fixed", "emergency"],
      default: "fixed",
    },
    color: {
      type: String,
      default: function defaultColor() {
        const palette = {
          daily: "#ef4444",
          fixed: "#facc15",
          emergency: "#9ca3af",
        };
        return palette[this.type] || "#6b7280";
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExpenseCategory", expenseCategorySchema);
