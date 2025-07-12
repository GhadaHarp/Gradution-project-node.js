const express = require("express");
const {
  addToCart,
  updateCart,
  removeFromCart,
  checkout,
  confirmOrder,
  getStripeSessionStatus,
  placeOrderFromStripe,
  confirmStripeOrder,
} = require("../controllers/cartContoller");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.post("/", addToCart);
router.patch("/", updateCart);
router.delete("/", removeFromCart);
router.get("/stripe-session-status", getStripeSessionStatus);
router.get("/stripe/confirm", placeOrderFromStripe);
router.post("/stripe/confirm", confirmStripeOrder);

router.post("/checkout", checkout);
router.post("/confirm-order", confirmOrder);

module.exports = router;
