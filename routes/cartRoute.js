const express = require("express");
const {
  addToCart,
  checkout,
  removeFromCart,

  updateCart,
} = require("../controllers/cartContoller");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.route("/").post(protect, addToCart);
router.route("/checkout").post(protect, checkout);
router.route("/").delete(protect, removeFromCart);
router.route("/").patch(protect, updateCart);

module.exports = router;
