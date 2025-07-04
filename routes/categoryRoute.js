const express = require("express");
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
} = require("../controllers/categoryController");
const { protect, restrictTo } = require("../controllers/authController");
const router = express.Router();

router
  .route("/")
  .get(getAllCategories)
  .post( createCategory);
router
  .route("/:id")
  .get(getCategory)
  .patch( updateCategory)
  .delete( deleteCategory);
module.exports = router;
