const express = require("express");
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, restrictTo } = require("../controllers/authController");
const reviewRouter = require("./reviewRoute");
const router = express.Router();
router.use("/:productId/reviews", reviewRouter);
router
  .route("/")
  .get(getAllProducts)
  .post(protect, createProduct);
router
  .route("/:id")
  .get(getProduct)
  .patch(protect,  updateProduct)
  .delete(protect,  deleteProduct);
module.exports = router;
