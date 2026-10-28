const router = require("express").Router();
const c = require("../controllers/notificationController");
const auth = require("../middleware/auth");

// No subscription check: an expired user still needs to hear about it.
router.use(auth);
router.get("/", c.getUserNotifications);
router.post("/read", c.markUserNotificationRead);
router.post("/read-all", c.markAllUserNotificationsRead);

module.exports = router;
