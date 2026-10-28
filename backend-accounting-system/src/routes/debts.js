const router = require("express").Router();
const c    = require("../controllers/debtController");
const auth = require("../middleware/auth");
const subCheck = require("../middleware/subscriptionCheck");

router.use(auth);
router.use(subCheck);

router.route("/").get(c.getAll).post(c.create);
router.get("/:id/forecast", c.getForecast);
router.route("/:id").get(c.getOne).put(c.update).delete(c.remove);
router.patch("/:id/paid",         c.markPaid);
router.route("/:id/payments").get(c.getPayments).post(c.addPayment);

module.exports = router;
