require("dotenv").config();

const dns = require("dns");

dns.setServers(["8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const incomeRoutes = require("./routes/income");
const expenseRoutes = require("./routes/expenses");
const expenseCategoryRoutes = require("./routes/expenseCategories");
const accountRoutes         = require("./routes/accounts");
const transactionRoutes = require("./routes/transactions");
const debtRoutes      = require("./routes/debts");
const reportRoutes    = require("./routes/reports");
const dashboardRoutes  = require("./routes/dashboard");
const settingsRoutes   = require("./routes/settings");
const savingsRoutes    = require("./routes/savings");
const adminRoutes      = require("./routes/admin");
const chatRoutes       = require("./routes/chat");
const notificationRoutes = require("./routes/notifications");
const userExtrasRoutes = require("./routes/userExtras");

if (!process.env.JWT_ADMIN_SECRET) {
  console.error("JWT_ADMIN_SECRET is missing in .env — admin tokens need their own secret.");
  process.exit(1);
}
if (process.env.JWT_ADMIN_SECRET === process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_ADMIN_SECRET should be different from JWT_SECRET.");
}

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:3000").split(",").map(s => s.trim());
app.use(cors({
  credentials: true,
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    // Allow localhost and any private-network IP (192.168.x.x, 172.x.x.x, 10.x.x.x)
    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /^http:\/\/(192\.168\.|172\.\d+\.|10\.)\d+\.\d+(:\d+)?$/.test(origin)
    ) return cb(null, true);
    cb(new Error("CORS: origin not allowed"));
  },
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings",  settingsRoutes);
app.use("/api/savings",   savingsRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/chat",      chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api",           userExtrasRoutes);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// 404
app.use((_, res) => res.status(404).json({ success: false, message: "Route not found" }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT ?? 5000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`Server running on port ${PORT}`),
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });
