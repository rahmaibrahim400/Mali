const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { register, login, me, avatar, forgotPassword, resetPassword } = require("../controllers/authController");
const auth = require("../middleware/auth");
const adminLoginLimiter = require("../middleware/adminLoginLimiter");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/login", loginLimiter, adminLoginLimiter, login);
router.get("/me", auth, me);
router.get("/avatar", auth, avatar);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
