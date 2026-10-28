const router = require("express").Router();
const c = require("../controllers/chatController");
const auth = require("../middleware/auth");

// No subscription check: users with an expired plan can still reach support.
router.use(auth);
router.get("/messages", c.getMyMessages);
router.post("/messages", c.sendMyMessage);
router.patch("/messages/:messageId", c.editMyMessage);
router.delete("/messages/:messageId", c.deleteMyMessage);
router.get("/unread", c.getMyUnread);
router.get("/messages/:messageId/audio", c.getMyAudio);

module.exports = router;
