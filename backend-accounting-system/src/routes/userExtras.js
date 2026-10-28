const router = require("express").Router();
const c = require("../controllers/userExtrasController");
const auth = require("../middleware/auth");

// Mounted at /api, so auth goes on each route (not router.use) to leave other /api paths alone.
// No subscription check: expired users must still be able to ask for a renewal.
router.get("/announcements", auth, c.listMyAnnouncements);
router.get("/renewal", auth, c.getMyRenewal);
router.post("/renewal", auth, c.requestRenewal);
router.delete("/renewal", auth, c.cancelMyRenewal);

module.exports = router;
