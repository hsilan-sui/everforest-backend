const express = require("express");
const router = express.Router();
//引入checkAuth middlewares
const checkAuth = require("../middlewares/checkAuth");
const errorAsync = require("../utils/errorAsync");
const orderController = require("../controllers/orderController");

router.post("/:orderId/payment", checkAuth, errorAsync(orderController.postPayment));
router.post("/:orderId/payment-callback", errorAsync(orderController.postPaymentCallback));
// router.get("/:orderId/payment-callback", errorAsync(orderController.getPaymentCallback));

module.exports = router;
