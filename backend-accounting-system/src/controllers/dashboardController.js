const mongoose        = require("mongoose");
const Income          = require("../models/Income");
const Expense         = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory");
const Account         = require("../models/Account");
const Debt            = require("../models/Debt");
const DebtPayment     = require("../models/DebtPayment");

/* ── helpers ─────────────────────────────────────── */
function periodBounds(period, from, to) {
  const now = new Date();
  let start, end;

  if (period === "last_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === "3months") {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === "custom" && from && to) {
    start = new Date(from);
    end   = new Date(to);
    end.setHours(23, 59, 59, 999);
  } else {
    // default: this month
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start, end };
}

/* previous period of the same length */
function prevPeriod(start, end) {
  const len = end.getTime() - start.getTime();
  const prevEnd   = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - len);
  return { prevStart, prevEnd };
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + Math.floor(months));
  result.setDate(result.getDate() + Math.round((months % 1) * 30.4375));
  return result;
}

function getDebtForecast(debts, payments) {
  const paymentGroups = payments.reduce((groups, payment) => {
    const key = String(payment.debt);
    (groups[key] ||= []).push(payment);
    return groups;
  }, {});

  const forecasts = debts.map((debt) => {
    const validPayments = (paymentGroups[String(debt._id)] || [])
      .filter((payment) => Number(payment.amount) > 0 && payment.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    if (validPayments.length < 2) return null;

    const first = new Date(validPayments[0].date);
    const last = new Date(validPayments[validPayments.length - 1].date);
    const months = Math.max(1, (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth() + 1);
    const averageMonthlyPayment = validPayments.reduce((sum, payment) => sum + Number(payment.amount), 0) / months;
    const remainingAmount = Math.max(0, debt.totalAmount - debt.paidAmount);
    const monthsRemaining = averageMonthlyPayment > 0 ? Math.ceil(remainingAmount / averageMonthlyPayment) : null;

    return monthsRemaining === null ? null : {
      averageMonthlyPayment,
      estimatedPayoffDate: addMonths(new Date(), monthsRemaining),
    };
  }).filter(Boolean);

  if (!forecasts.length) return { status: "insufficient_data", averageMonthlyPayment: 0, estimatedPayoffDate: null };
  const averageMonthlyPayment = forecasts.reduce((sum, forecast) => sum + forecast.averageMonthlyPayment, 0);
  const monthsRemaining = Math.max(...forecasts.map((forecast) => {
    const days = (new Date(forecast.estimatedPayoffDate) - new Date()) / 86400000;
    return Math.ceil(days / 30.4375);
  }));
  return {
    status: "available",
    averageMonthlyPayment,
    estimatedPayoffDate: addMonths(new Date(), monthsRemaining),
  };
}

/* GET /api/dashboard */
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { period = "month", from, to } = req.query;

    /* Amounts are never summed across currencies: the summary is computed for one currency at a
       time (?currency=, default EGP or the user's first currency), and the list of currencies the
       user actually has is returned so the client can switch between them. */
    const distinctCurrencies = await Promise.all([
      Account.distinct("currency", { user: userId, isActive: true }),
      Income.distinct("currency", { user: userId }),
      Expense.distinct("currency", { user: userId }),
      Debt.distinct("currency", { userId }),
    ]);
    const currencies = [...new Set(distinctCurrencies.flat().map((c) => c || "EGP"))].sort((a, b) =>
      a === "EGP" ? -1 : b === "EGP" ? 1 : a.localeCompare(b)
    );
    const requestedCurrency = String(req.query.currency || "").toUpperCase();
    const currency = currencies.includes(requestedCurrency) ? requestedCurrency : currencies[0] || "EGP";
    // Documents saved before currency existed count as EGP (the schema default).
    const cur = currency === "EGP" ? { currency: { $in: ["EGP", null] } } : { currency };

    const { start, end } = periodBounds(period, from, to);
    const { prevStart, prevEnd } = prevPeriod(start, end);

    /* trailing 6 calendar months, independent of the period filter — used for the wealth trend sparkline */
    const now = new Date();
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    /* ── parallel queries ─────────────────────────── */
    const [
      incomeAgg, prevIncomeAgg,
      expenseAgg, prevExpenseAgg,
      accounts,
      debts,
      debtPayments,
      expCatAgg,
      categories,
      recentIncome,
      recentExpenses,
      chartIncome,
      chartExpenses,
      trendIncome,
      trendExpenses,
    ] = await Promise.all([

      /* current period income */
      Income.aggregate([
        { $match: { user: userId, ...cur, receivedDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      /* previous period income */
      Income.aggregate([
        { $match: { user: userId, ...cur, receivedDate: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      /* current period expenses */
      Expense.aggregate([
        { $match: { user: userId, ...cur, date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      /* previous period expenses */
      Expense.aggregate([
        { $match: { user: userId, ...cur, date: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      /* accounts */
      Account.find({ user: userId, isActive: true }).lean(),

      /* debts (userId stored as ObjectId, userId var is already ObjectId) */
      Debt.find({ userId, ...cur, status: { $in: ["active", "overdue"] } })
        .sort({ dueDate: 1 })
        .lean(),

      DebtPayment.find({ userId }).select("debt amount date").lean(),

      /* expense categories breakdown (current period, top 6) */
      Expense.aggregate([
        { $match: { user: userId, ...cur, date: { $gte: start, $lte: end } } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 6 },
      ]),

      /* category name lookup — find() auto-casts ObjectId */
      ExpenseCategory.find({ user: userId }).lean(),

      /* recent income */
      Income.find({ user: userId, ...cur, receivedDate: { $gte: start, $lte: end } })
        .sort({ receivedDate: -1 })
        .limit(10)
        .lean(),

      /* recent expenses */
      Expense.find({ user: userId, ...cur, date: { $gte: start, $lte: end } })
        .sort({ date: -1 })
        .limit(10)
        .lean(),

      /* selected-period chart — income */
      Income.aggregate([
        {
          $match: {
            user: userId,
            ...cur,
            receivedDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { year: { $year: "$receivedDate" }, month: { $month: "$receivedDate" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      /* selected-period chart — expenses */
      Expense.aggregate([
        {
          $match: {
            user: userId,
            ...cur,
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      /* trailing 6-month wealth trend — income */
      Income.aggregate([
        { $match: { user: userId, ...cur, receivedDate: { $gte: trendStart } } },
        {
          $group: {
            _id: { year: { $year: "$receivedDate" }, month: { $month: "$receivedDate" } },
            total: { $sum: "$amount" },
          },
        },
      ]),

      /* trailing 6-month wealth trend — expenses */
      Expense.aggregate([
        { $match: { user: userId, ...cur, date: { $gte: trendStart } } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    /* ── assemble totals ─────────────────────────── */
    const totalIncome   = incomeAgg[0]?.total      ?? 0;
    const totalExpenses = expenseAgg[0]?.total     ?? 0;
    const prevIncome    = prevIncomeAgg[0]?.total   ?? null;
    const prevExpenses  = prevExpenseAgg[0]?.total  ?? null;
    const netBalance    = totalIncome - totalExpenses;

    /* ── accounts ────────────────────────────────── */
    const accountBalancesByCurrency = accounts.reduce((totals, account) => {
      const currency = account.currency || "EGP";
      totals[currency] = (totals[currency] || 0) + (account.balance ?? 0);
      return totals;
    }, {});
    const totalAccountBalance = accountBalancesByCurrency[currency] ?? 0;

    /* ── debts ───────────────────────────────────── */
    const totalDebtRemaining = debts.reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);
    const overdueDebts       = debts.filter((d) => d.status === "overdue" || (d.dueDate && new Date(d.dueDate) < new Date()));
    const nearestDue         = debts.find((d) => d.dueDate && Math.max(0, d.totalAmount - d.paidAmount) > 0);
    const debtForecast       = getDebtForecast(debts, debtPayments);

    /* ── expense categories ──────────────────────── */
    const catMap = Object.fromEntries(
      categories.flatMap((c) => [[String(c._id), c], [c.name, c]])
    );
    const expenseCategories = expCatAgg.map((row) => {
      const cat = catMap[row._id];
      return {
        categoryId: row._id,
        name:  cat?.name  ?? row._id ?? "Other",
        color: cat?.color ?? "#6b7280",
        total: row.total,
        count: row.count,
      };
    });

    /* ── selected-period chart ───────────────────── */
    const chartStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const chartEnd = new Date(end.getFullYear(), end.getMonth(), 1);
    const chartData = [];
    for (const d = new Date(chartStart); d <= chartEnd; d.setMonth(d.getMonth() + 1)) {
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const inc = chartIncome.find((r) => r._id.year === y && r._id.month === m)?.total ?? 0;
      const exp = chartExpenses.find((r) => r._id.year === y && r._id.month === m)?.total ?? 0;
      chartData.push({ month: d.getMonth(), year: y, income: inc, expenses: exp });
    }

    /* ── wealth trend (trailing 6 months, relative cumulative net) ── */
    const monthlyNet = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const inc = trendIncome.find((r) => r._id.year === y && r._id.month === m)?.total ?? 0;
      const exp = trendExpenses.find((r) => r._id.year === y && r._id.month === m)?.total ?? 0;
      monthlyNet.push(inc - exp);
    }
    const cumulativeNet = monthlyNet.reduce((acc, net) => {
      acc.push((acc[acc.length - 1] ?? 0) + net);
      return acc;
    }, []);
    const minCumulative = Math.min(...cumulativeNet, 0);
    const wealthTrend = cumulativeNet.map((value) => value - minCumulative + 1);

    /* ── recent activity ─────────────────────────── */
    const activity = [
      ...recentIncome.map((x) => ({
        _id: String(x._id), type: "income",
        name: x.name, category: x.category,
        amount: x.amount, currency: x.currency,
        date: x.receivedDate,
      })),
      ...recentExpenses.map((x) => ({
        _id: String(x._id), type: "expense",
        name: x.description, category: x.category,
        amount: x.amount, currency: x.currency,
        date: x.date,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        period: { start, end },
        currency,
        currencies,
        income:   { total: totalIncome,   count: incomeAgg[0]?.count ?? 0 },
        expenses: { total: totalExpenses, count: expenseAgg[0]?.count ?? 0 },
        netBalance,
        prev: {
          income:   prevIncome   !== null ? { total: prevIncome }   : null,
          expenses: prevExpenses !== null ? { total: prevExpenses } : null,
          hasPrev:  prevIncome !== null || prevExpenses !== null,
        },
        accounts: accounts.map((a) => ({
          _id: String(a._id), name: a.name, type: a.type,
          balance: a.balance, currency: a.currency, color: a.color,
        })),
        totalAccountBalance,
        accountBalancesByCurrency,
        debts: {
          totalRemaining: totalDebtRemaining,
          activeCount:    debts.length,
          overdueCount:   overdueDebts.length,
          forecast:       debtForecast,
          nearestDue:     nearestDue
            ? {
                creditor:        nearestDue.creditor,
                dueDate:         nearestDue.dueDate,
                remainingAmount: Math.max(0, nearestDue.totalAmount - nearestDue.paidAmount),
                currency:        nearestDue.currency,
                status:          nearestDue.status,
              }
            : null,
        },
        expenseCategories,
        chartData,
        wealthTrend,
        recentActivity: activity,
      },
    });
  } catch (err) { next(err); }
};
