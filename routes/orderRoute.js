const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const router = express.Router();
const {
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderBYId,
  getMyOrders,
} = require("../Controllers/orderController");
router.use(protect);

router.get("/", restrictTo(["admin"]), getAllOrders),
  router.post("/", createOrder),
  router.patch("/:id", updateOrder);
router.get("/my-orders", getMyOrders);

router.get("/:id", getOrderBYId);

router.delete("/:id", restrictTo(["admin"]), deleteOrder);

module.exports = router;
