const Income   = require("../models/Income");
const Expense  = require("../models/Expense");
const User     = require("../models/User");
const Account  = require("../models/Account");
const { recordTxn, reverseTxn, assertAccountsUsable } = require("./accountController");

// Income paid into an account is in that account's currency, whatever the client sent.
async function accountCurrency(userId, accountId) {
  if (!accountId) return null;
  const acc = await Account.findOne({ _id: accountId, user: userId }).select("currency").lean();
  return acc?.currency || null;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SUPPORTED_CURRENCIES = ["EGP", "USD", "EUR", "GBP"];

function contributionForMonth(inc, year, month) {
  const rd = new Date(inc.receivedDate);
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0, 23, 59, 59, 999);

  if (inc.recurrence === "once") {
    return rd >= monthStart && rd <= monthEnd ? inc.amount : 0;
  }
  if (!inc.isActive || rd > monthEnd) return 0;
  if (inc.recurrence === "monthly") return inc.amount;
  if (inc.recurrence === "yearly")  return rd.getMonth() === month ? inc.amount : 0;
  if (inc.recurrence === "weekly") {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    let cur = new Date(rd.getTime());
    while (cur < monthStart) cur = new Date(cur.getTime() + weekMs);
    let count = 0;
    while (cur <= monthEnd) { count++; cur = new Date(cur.getTime() + weekMs); }
    return inc.amount * count;
  }
  return 0;
}

// GET /api/income
exports.list = async (req, res, next) => {
  try {
    const incomes = await Income.find({ user: req.userId }).sort({ receivedDate: -1 });
    res.json({ success: true, data: incomes });
  } catch (err) { next(err); }
};

// POST /api/income
exports.create = async (req, res, next) => {
  try {
    const { name, category, amount, currency, receivedDate, recurrence, status, notes, accountId } = req.body;

    const allowedCategories = ["salary", "freelance", "rental", "investment", "other"];
    const parsedAmount = Number(amount);
    const parsedDate = new Date(receivedDate);

    if (!name?.trim() || !category || amount === undefined || amount === "" || !currency || !receivedDate) {
      return res.status(400).json({ success: false, message: "Name, category, amount, currency, and receivedDate are required." });
    }
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid income category." });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than zero." });
    }
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: "receivedDate must be a valid date." });
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

    const income = await Income.create({
      user: req.userId,
      name: name.trim(), category,
      amount: parsedAmount,
      currency: (await accountCurrency(req.userId, accountId)) || currency || "EGP",
      receivedDate: parsedDate, recurrence: recurrence || "once",
      status: status || "cleared", notes,
      account: accountId || null,
    });

    if (accountId) {
      await recordTxn(req.userId, accountId, "credit", parsedAmount, name, parsedDate, "Income", income._id);
    }

    res.status(201).json({ success: true, message: "تم إضافة مصدر الدخل بنجاح", data: income });
  } catch (err) { next(err); }
};

// PUT /api/income/:id
exports.update = async (req, res, next) => {
  try {
    const old = await Income.findOne({ _id: req.params.id, user: req.userId });
    if (!old) return res.status(404).json({ success: false, message: "Income not found" });

    await assertAccountsUsable(req.userId, old.account, req.body.accountId);

    if (old.account) {
      await reverseTxn(req.userId, "Income", old._id);
    }

    const { name, category, amount, currency, receivedDate, recurrence, status, notes, accountId } = req.body;

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      {
        name, category,
        amount: parseFloat(amount),
        currency: (await accountCurrency(req.userId, accountId)) || currency || old.currency,
        receivedDate, recurrence, status, notes,
        account: accountId || null,
      },
      { new: true, runValidators: true }
    );

    if (accountId) {
      await recordTxn(req.userId, accountId, "credit", parseFloat(amount), name, new Date(receivedDate), "Income", income._id);
    }

    res.json({ success: true, data: income });
  } catch (err) { next(err); }
};

// PATCH /api/income/:id/toggle-recurrence
// Pauses/resumes a recurring income without deleting it (US-102 AC #3).
exports.toggleRecurrence = async (req, res, next) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, user: req.userId });
    if (!income) return res.status(404).json({ success: false, message: "Income not found" });

    income.isActive = !income.isActive;
    await income.save();

    res.json({ success: true, data: income });
  } catch (err) { next(err); }
};

// DELETE /api/income/:id
exports.remove = async (req, res, next) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, user: req.userId });
    if (!income) return res.status(404).json({ success: false, message: "Income not found" });

    await assertAccountsUsable(req.userId, income.account);

    if (income.account) {
      await reverseTxn(req.userId, "Income", income._id);
    }

    await income.deleteOne();
    res.json({ success: true, message: "Income deleted successfully" });
  } catch (err) { next(err); }
};

// GET /api/income/summary?months=6
exports.summary = async (req, res, next) => {
  try {
    const hasSelectedMonth = req.query.year !== undefined || req.query.month !== undefined;
    if (hasSelectedMonth) {
      const now = new Date();
      const year = Number.parseInt(req.query.year, 10) || now.getFullYear();
      const month = Number.parseInt(req.query.month, 10);
      const selectedMonth = Number.isInteger(month) && month >= 0 && month <= 11 ? month : now.getMonth();
      const requestedCurrency = String(req.query.currency || "ALL").toUpperCase();
      const currency =
        requestedCurrency === "ALL"
          ? "ALL"
          : SUPPORTED_CURRENCIES.includes(requestedCurrency)
            ? requestedCurrency
            : "EGP";
      // Only incomes in the selected currency (no conversion: the fixed rates were not real
      // exchange rates). Incomes saved before currency existed count as EGP.
      const currencyFilter =
        currency === "ALL"
          ? undefined
          : currency === "EGP"
            ? { $in: ["EGP", null] }
            : currency;
      const query = { user: req.userId };
      if (currencyFilter !== undefined) query.currency = currencyFilter;
      const allIncomes = await Income.find(query).sort({ receivedDate: -1 });

      const items = allIncomes
        .map((inc) => {
          const amount = contributionForMonth(inc, year, selectedMonth);
          return {
            ...inc.toObject(),
            monthlyAmount: amount,
            convertedAmount: amount, // same currency; field kept for the client
          };
        })
        .filter((inc) => inc.monthlyAmount > 0);

      const totalsByCurrency = items.reduce((totals, inc) => {
        const itemCurrency = inc.currency || "EGP";
        totals[itemCurrency] = (totals[itemCurrency] || 0) + inc.convertedAmount;
        return totals;
      }, {});
      const total = currency === "ALL"
        ? null
        : totalsByCurrency[currency] || 0;
      return res.json({
        success: true,
        data: { year, month: selectedMonth, currency, total, totalsByCurrency, items },
      });
    }

    const months = Math.min(parseInt(req.query.months) || 6, 24);
    const allIncomes = await Income.find({ user: req.userId });
    const now = new Date();
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth();
      const total = allIncomes.reduce((sum, inc) => sum + contributionForMonth(inc, year, month), 0);
      result.push({ month: MONTH_LABELS[month], year, total });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
