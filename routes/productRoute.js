const express = require("express");
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const {
  protect,
  restrictToAdminOnly,
} = require("../controllers/authController");
const reviewRouter = require("./reviewRoute");
const router = express.Router();
router.use("/:productId/reviews", reviewRouter);
router
  .route("/")
  .get(getAllProducts)
  .post(protect, restrictToAdminOnly, createProduct);
router
  .route("/:id")
  .get(getProduct)
  .patch(protect, restrictToAdminOnly, updateProduct)
  .delete(protect, restrictToAdminOnly, deleteProduct);
module.exports = router;
