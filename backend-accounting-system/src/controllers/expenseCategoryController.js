const ExpenseCategory = require("../models/ExpenseCategory");

const VALID_TYPES = ["daily", "fixed", "emergency"];

const DEFAULT_TYPE_COLORS = {
  daily:     "#ef4444",
  fixed:     "#facc15",
  emergency: "#9ca3af",
};

const DEFAULT_CATEGORIES = [
  { name: "أكل",       type: "daily",     color: "#f97316" },
  { name: "مواصلات",   type: "daily",     color: "#3b82f6" },
  { name: "إيجار",     type: "fixed",     color: "#f59e0b" },
  { name: "فواتير",    type: "fixed",     color: "#8b5cf6" },
  { name: "صحة",       type: "emergency", color: "#10b981" },
  { name: "تعليم",     type: "fixed",     color: "#0ea5e9" },
  { name: "تسلية",     type: "daily",     color: "#ec4899" },
  { name: "غيره",      type: "daily",     color: "#6b7280" },
];

const DEFAULT_CATEGORY_NAMES = DEFAULT_CATEGORIES.map((c) => c.name);

// GET /api/expense-categories
exports.list = async (req, res, next) => {
  try {
    let cats = await ExpenseCategory.find({ user: req.userId }).sort({ type: 1, createdAt: 1 });

    // التأكد من وجود كل التصنيفات الإلزامية الافتراضية للمستخدم في قاعدة البيانات
    const existingNames = new Set(cats.map((c) => c.name));
    const missing = DEFAULT_CATEGORIES.filter((d) => !existingNames.has(d.name));

    if (missing.length > 0) {
      await ExpenseCategory.insertMany(
        missing.map((d) => ({
          ...d,
          user: req.userId,
          isDefault: true,
        }))
      );
      cats = await ExpenseCategory.find({ user: req.userId }).sort({ type: 1, createdAt: 1 });
    }

    res.json({ success: true, data: cats });
  } catch (err) { next(err); }
};

// POST /api/expense-categories
exports.create = async (req, res, next) => {
  try {
    const { name, type, color } = req.body;
    const normalizedName = name?.trim();

    // Fix #5 — type is truly required, reject empty string/null
    if (!normalizedName) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type is required and must be daily, fixed, or emergency",
      });
    }

    const cat = await ExpenseCategory.create({
      user:  req.userId,
      name:  normalizedName,
      type,
      color: color || DEFAULT_TYPE_COLORS[type],
      isDefault: false,
    });

    res.status(201).json({ success: true, data: cat });
  } catch (err) { next(err); }
};

// PUT /api/expense-categories/:id
exports.update = async (req, res, next) => {
  try {
    const existing = await ExpenseCategory.findOne({ _id: req.params.id, user: req.userId });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Fix #3 — default categories cannot have their name changed or type changed
    if (existing.isDefault) {
      const { name, type } = req.body;
      if (name !== undefined && name.trim() !== existing.name) {
        return res.status(403).json({
          success: false,
          message: "Cannot rename a default category",
        });
      }
      if (type !== undefined && type !== existing.type) {
        return res.status(403).json({
          success: false,
          message: "Cannot change the type of a default category",
        });
      }
    }

    // Fix #6 — whitelist only allowed fields (no spreading full req.body)
    const { name, type, color } = req.body;
    const payload = {};

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) return res.status(400).json({ success: false, message: "Name cannot be empty" });
      payload.name = trimmed;
    }
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ success: false, message: "Type is invalid" });
      }
      payload.type = type;
      // Auto-update color when type changes and no explicit color is provided
      if (!color) payload.color = DEFAULT_TYPE_COLORS[type];
    }
    if (color !== undefined) {
      payload.color = color;
    }

    const cat = await ExpenseCategory.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      payload,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
};

// DELETE /api/expense-categories/:id
exports.remove = async (req, res, next) => {
  try {
    const cat = await ExpenseCategory.findOne({ _id: req.params.id, user: req.userId });
    if (!cat) return res.status(404).json({ success: false, message: "Category not found" });

    // حماية التصنيفات الإلزامية الافتراضية من الحذف
    if (cat.isDefault || DEFAULT_CATEGORY_NAMES.includes(cat.name)) {
      return res.status(403).json({
        success: false,
        message: "التصنيفات الافتراضية إلزامية ولا يمكن حذفها نهائياً",
      });
    }

    await cat.deleteOne();
    res.json({ success: true, message: "Category deleted" });
  } catch (err) { next(err); }
};
