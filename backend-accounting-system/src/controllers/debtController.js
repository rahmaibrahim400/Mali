const Debt        = require("../models/Debt");
const DebtPayment = require("../models/DebtPayment");
const Account     = require("../models/Account");
const AccountTransaction = require("../models/AccountTransaction");

/* ── helpers ─────────────────────────────────────── */
function autoStatus(debt) {
  if (debt.status === "paid") return "paid";
  if (debt.dueDate && new Date(debt.dueDate) < new Date()) return "overdue";
  return "active";
}

function addMonths(date, months) {
  const result = new Date(date);
  const wholeMonths = Math.floor(months);
  const fraction = months - wholeMonths;
  result.setMonth(result.getMonth() + wholeMonths);
  result.setDate(result.getDate() + Math.round(fraction * 30.4375));
  return result;
}

function calculatePaymentForecast(debt, payments) {
  const validPayments = payments
    .filter((payment) => Number(payment.amount) > 0 && payment.date && !Number.isNaN(new Date(payment.date).getTime()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const insufficient = {
    status: "insufficient_data",
    averageMonthlyPayment: 0,
    estimatedPayoffDate: null,
    message: "أضف دفعات أكثر لحساب التوقع",
  };

  if (validPayments.length < 2 || debt.totalAmount <= debt.paidAmount) {
    return debt.totalAmount <= debt.paidAmount
      ? { ...insufficient, status: "paid", message: "تم سداد الدين بالكامل" }
      : insufficient;
  }

  const firstPayment = new Date(validPayments[0].date);
  const lastPayment = new Date(validPayments[validPayments.length - 1].date);
  const months = Math.max(
    1,
    (lastPayment.getFullYear() - firstPayment.getFullYear()) * 12 +
      lastPayment.getMonth() - firstPayment.getMonth() +
      1
  );
  const totalPaid = validPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const averageMonthlyPayment = totalPaid / months;
  const remainingAmount = Math.max(0, debt.totalAmount - debt.paidAmount);
  const estimatedPayoffDate = addMonths(new Date(), remainingAmount / averageMonthlyPayment);

  return {
    status: "available",
    averageMonthlyPayment,
    estimatedPayoffDate,
    message: `بناءً على معدل دفعك الحالي، ستسدد الدين في ${estimatedPayoffDate.toLocaleDateString("ar-EG")}`,
  };
}

async function attachForecast(debts) {
  if (!debts.length) return [];
  const debtIds = debts.map((debt) => debt._id);
  const payments = await DebtPayment.find({ userId: debts[0]?.userId, debt: { $in: debtIds } })
    .select("debt amount date")
    .lean();
  const paymentsByDebt = payments.reduce((groups, payment) => {
    const key = payment.debt.toString();
    (groups[key] ||= []).push(payment);
    return groups;
  }, {});

  return debts.map((debt) => ({
    ...debt.toObject(),
    paymentForecast: calculatePaymentForecast(debt, paymentsByDebt[debt._id.toString()] || []),
  }));
}

// GET /api/debts
exports.getAll = async (req, res, next) => {
  try {
    const debts = await Debt.find({ userId: req.userId }).sort({ createdAt: -1 });
    // Auto-update overdue status and mutate in-memory for immediate response
    const updates = [];
    for (const d of debts) {
      const s = autoStatus(d);
      if (s !== d.status) {
        d.status = s;                                       // mutate doc object
        updates.push(Debt.findByIdAndUpdate(d._id, { status: s }));
      }
    }
    if (updates.length) await Promise.all(updates);
    res.json({ success: true, data: await attachForecast(debts) });
  } catch (err) { next(err); }
};

// GET /api/debts/:id
exports.getOne = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) return res.status(404).json({ success: false, message: "Debt not found" });
    const payments = await DebtPayment.find({ debt: debt._id, userId: req.userId }).select("amount date").lean();
    res.json({
      success: true,
      data: { ...debt.toObject(), paymentForecast: calculatePaymentForecast(debt, payments) },
    });
  } catch (err) { next(err); }
};

// GET /api/debts/:id/forecast
exports.getForecast = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) return res.status(404).json({ success: false, message: "Debt not found" });
    const payments = await DebtPayment.find({ debt: debt._id, userId: req.userId })
      .select("amount date")
      .lean();
    res.json({ success: true, data: calculatePaymentForecast(debt, payments) });
  } catch (err) { next(err); }
};

// POST /api/debts
exports.create = async (req, res, next) => {
  try {
    const { creditor, category, totalAmount, currency, interestRate, startDate, dueDate, description } = req.body;
    if (!creditor?.trim() || !totalAmount)
      return res.status(400).json({ success: false, message: "Creditor and totalAmount are required." });
    const debt = await Debt.create({
      userId: req.userId,
      creditor: creditor.trim(), category: category || "other",
      totalAmount: parseFloat(totalAmount), paidAmount: 0,
      currency: currency || "EGP",
      interestRate: parseFloat(interestRate) || 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      description: description?.trim() || "",
    });
    // Set correct initial status (handles past due dates)
    const initStatus = autoStatus(debt);
    if (initStatus !== debt.status) {
      debt.status = initStatus;
      await debt.save();
    }
    res.status(201).json({ success: true, data: debt });
  } catch (err) { next(err); }
};

// PUT /api/debts/:id
exports.update = async (req, res, next) => {
  try {
    const allowed = ["creditor","category","totalAmount","currency","interestRate","startDate","dueDate","description","status"];
    const update  = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, update, { new: true, runValidators: true }
    );
    if (!debt) return res.status(404).json({ success: false, message: "Debt not found" });
    if (debt.status !== "paid") {
      const recalculatedStatus = autoStatus(debt);
      if (debt.status !== recalculatedStatus) {
        debt.status = recalculatedStatus;
        await debt.save();
      }
    }
    res.json({ success: true, data: debt });
  } catch (err) { next(err); }
};

// DELETE /api/debts/:id
exports.remove = async (req, res, next) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!debt) return res.status(404).json({ success: false, message: "Debt not found" });
    await DebtPayment.deleteMany({ debt: req.params.id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// PATCH /api/debts/:id/paid  — mark fully paid
exports.markPaid = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) return res.status(404).json({ success: false, message: "Debt not found" });
    debt.paidAmount = debt.totalAmount;
    debt.status     = "paid";
    await debt.save();
    res.json({ success: true, data: debt });
  } catch (err) { next(err); }
};

// POST /api/debts/:id/payments  — add a payment
exports.addPayment = async (req, res, next) => {
  try {
    const { amount, date, accountId, notes } = req.body;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return res.status(400).json({ success: false, message: "Amount must be positive." });

    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) return res.status(404).json({ success: false, message: "Debt not found" });
    if (debt.status === "paid") return res.status(400).json({ success: false, message: "Debt is already fully paid." });

    // Deduct from linked account
    if (accountId) {
      const acc = await Account.findOne({ _id: accountId, user: req.userId });
      if (!acc) return res.status(404).json({ success: false, message: "Account not found." });
      if (acc.isArchived || acc.isActive === false) {
        return res.status(400).json({ success: false, code: "ACCOUNT_FROZEN", message: `Account "${acc.name}" is archived (frozen): you can't withdraw from it.` });
      }
      const balBefore = acc.balance;
      acc.balance -= amt;
      await acc.save();
      await AccountTransaction.create({
        user: req.userId, account: acc._id,
        type: "debit", amount: amt,
        description: `Debt payment — ${debt.creditor}`,
        balanceBefore: balBefore, balanceAfter: acc.balance,
        date: date ? new Date(date) : new Date(),
      });
    }

    // Record payment
    const payment = await DebtPayment.create({
      debt: debt._id, userId: req.userId,
      amount: amt, date: date ? new Date(date) : new Date(),
      accountId: accountId || null, notes: notes?.trim(),
    });

    // Update debt
    debt.paidAmount += amt;
    if (debt.paidAmount >= debt.totalAmount) {
      debt.paidAmount = debt.totalAmount;
      debt.status     = "paid";
    } else {
      debt.status = autoStatus(debt);
    }
    await debt.save();

    const payments = await DebtPayment.find({ debt: debt._id, userId: req.userId }).select("amount date").lean();
    res.status(201).json({
      success: true,
      data: {
        debt: {
          ...debt.toObject(),
          paymentForecast: calculatePaymentForecast(debt, payments),
        },
        payment,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/debts/:id/payments
exports.getPayments = async (req, res, next) => {
  try {
    const payments = await DebtPayment.find({ debt: req.params.id, userId: req.userId })
      .populate("accountId", "name type currency")
      .sort({ date: -1 });
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};
