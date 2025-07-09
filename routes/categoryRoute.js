const express = require("express");
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
} = require("../controllers/categoryController");
const {
  protect,
  restrictToAdminOnly,
} = require("../controllers/authController");
const router = express.Router();

router.route("/").get(getAllCategories).post(createCategory);
router
  .route("/:id")
  .get(getCategory)
  .patch(protect, restrictToAdminOnly, updateCategory)
  .delete(protect, restrictToAdminOnly, deleteCategory);
module.exports = router;
