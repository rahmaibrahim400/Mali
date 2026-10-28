const Expense         = require("../models/Expense");
const Income          = require("../models/Income");
const User            = require("../models/User");
const ExpenseCategory = require("../models/ExpenseCategory");
const Account         = require("../models/Account");
const { recordTxn, reverseTxn, assertAccountsUsable } = require("./accountController");

// An expense paid from an account is in that account's currency, whatever the client sent.
async function accountCurrency(userId, accountId) {
  if (!accountId) return null;
  const acc = await Account.findOne({ _id: accountId, user: userId }).select("currency").lean();
  return acc?.currency || null;
}

// GET /api/expenses
// Supported query filters (can be combined):
// - period: "day" | "today", "week", "month", "custom"
// - startDate, endDate: ISO date strings
// - expenseType / type: "daily" | "fixed" | "emergency" | "monthly"
// - category: category name
// - account / accountId: Account ObjectId
exports.list = async (req, res, next) => {
  try {
    const {
      period,
      startDate,
      endDate,
      expenseType,
      type,
      category,
      account,
      accountId,
    } = req.query;

    const filter = { user: req.userId };

    // 1. الفلترة بالفترة الزمنية (يوم / أسبوع / شهر / مخصص)
    const now = new Date();
    if (period === "day" || period === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (period === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (period === "custom" || startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        dateFilter.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.$lte = e;
      }
      if (Object.keys(dateFilter).length > 0) {
        filter.date = dateFilter;
      }
    }

    // 2. الفلترة بالنوع (يومي / شهري / طارئ)
    const targetType = expenseType || type;
    if (targetType && targetType !== "all") {
      const normalizedType = targetType === "monthly" ? "fixed" : targetType;
      filter.expenseType = normalizedType;
    }

    // 3. الفلترة بالـ category
    if (category && category !== "all") {
      filter.category = category.trim();
    }

    // 4. الفلترة بالحساب
    const targetAccount = account || accountId;
    if (targetAccount && targetAccount !== "all") {
      filter.account = targetAccount;
    }

    const expenses = await Expense.find(filter)
      .populate("account", "name type currency")
      .sort({ date: -1 });

    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) { next(err); }
};

// POST /api/expenses
exports.create = async (req, res, next) => {
  try {
    const { amount, description, date, paymentMethod, expenseType, category, currency, notes, status, accountId } = req.body;

    // Fix #2 — validate category belongs to this user
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }
    const categoryExists = await ExpenseCategory.findOne({ user: req.userId, name: category.trim() });
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: "Invalid category: not found in your categories list" });
    }

    const user = await User.findById(req.userId).select("subscriptionType").lean();
    if (user?.subscriptionType === "trial") {
      const [incCount, expCount] = await Promise.all([
        Income.countDocuments({ user: req.userId }),
        Expense.countDocuments({ user: req.userId }),
      ]);
      if (incCount + expCount >= 20) {
        return res.status(403).json({ success: false, code: "TRIAL_LIMIT_20_ENTRIES", message: "Trial limit reached: maximum 20 entries allowed." });
      }
    }

    await assertAccountsUsable(req.userId, accountId);

    const expense = await Expense.create({
      user: req.userId,
      amount: parseFloat(amount), description,
      date:   date ? new Date(date) : new Date(),
      paymentMethod, expenseType, category: category.trim(),
      currency: (await accountCurrency(req.userId, accountId)) || currency || "EGP",
      notes, status: status || "confirmed",
      account: accountId || null,
    });

    if (accountId) {
      await recordTxn(req.userId, accountId, "debit", parseFloat(amount), description, expense.date, "Expense", expense._id);
    }

    res.status(201).json({ success: true, data: expense });
  } catch (err) { next(err); }
};

// PUT /api/expenses/:id
exports.update = async (req, res, next) => {
  try {
    const old = await Expense.findOne({ _id: req.params.id, user: req.userId });
    if (!old) return res.status(404).json({ success: false, message: "Expense not found" });

    const { amount, description, date, paymentMethod, expenseType, category, currency, notes, status, accountId, account } = req.body;

    // Fix #2 — validate category belongs to this user when category is being updated
    if (category !== undefined) {
      if (!category || !category.trim()) {
        return res.status(400).json({ success: false, message: "Category is required" });
      }
      const categoryExists = await ExpenseCategory.findOne({ user: req.userId, name: category.trim() });
      if (!categoryExists) {
        return res.status(400).json({ success: false, message: "Invalid category: not found in your categories list" });
      }
    }

    await assertAccountsUsable(req.userId, old.account, accountId !== undefined ? accountId : account);

    // Reverse previous account debit if it existed
    if (old.account) {
      await reverseTxn(req.userId, "Expense", old._id);
    }

    const targetAccountId = accountId !== undefined ? (accountId || null) : (account !== undefined ? (account || null) : old.account);

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      {
        amount: parseFloat(amount),
        description,
        date:   date ? new Date(date) : old.date,
        paymentMethod,
        expenseType,
        category: category ? category.trim() : old.category,
        currency: (await accountCurrency(req.userId, targetAccountId)) || currency || old.currency,
        notes,
        status: status || old.status,
        account: targetAccountId,
      },
      { new: true, runValidators: true }
    );

    if (targetAccountId) {
      await recordTxn(req.userId, targetAccountId, "debit", parseFloat(amount), description, expense.date, "Expense", expense._id);
    }

    await expense.populate("account", "name type currency");

    res.json({ success: true, data: expense });
  } catch (err) { next(err); }
};

// DELETE /api/expenses/:id
exports.remove = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.userId });
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    await assertAccountsUsable(req.userId, expense.account);

    if (expense.account) {
      await reverseTxn(req.userId, "Expense", expense._id);
    }

    await expense.deleteOne();
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (err) { next(err); }
};
