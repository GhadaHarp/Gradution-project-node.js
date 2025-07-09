const express = require("express");
const {
  protect,
  restrictToAdminOnly,
} = require("../controllers/authController");
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

router.get("/", protect, restrictToAdminOnly, getAllOrders),
  router.post("/", createOrder),
  router.patch("/:id", protect, updateOrder);
router.get("/my-orders", protect, getMyOrders);

router.get("/:id", protect, getOrderBYId);

router.delete("/:id", protect, deleteOrder);

module.exports = router;
