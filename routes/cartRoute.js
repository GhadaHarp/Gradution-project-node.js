const express = require("express");
const {
  addToCart,
  updateCart,
  removeFromCart,
  checkout,
  confirmOrder,
} = require("../controllers/cartContoller");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.post("/", addToCart);
router.patch("/", updateCart);
router.delete("/", removeFromCart);

router.post("/checkout", checkout);
router.post("/confirm-order", confirmOrder);

module.exports = router;
