const express = require("express");
const { protect } = require("../controllers/authController");
// const deleteOrder = require("../controllers/orderController");
const router = express.Router();
const { getAllOrders,createOrder,updateOrder,deleteOrder, getOrderBYId}=require("../Controllers/orderController");
router.get("/",getAllOrders),
router.post("/",createOrder),
router.patch('/:id',updateOrder);
router.get("/:id",getOrderBYId)

router.delete("/:id", protect, deleteOrder);

module.exports = router;
