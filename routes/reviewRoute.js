const express = require("express");
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
} = require("../controllers/reviewController");
const {
  protect,
  restrictToAdminOnly,
} = require("../controllers/authController");
const router = express.Router({ mergeParams: true });

router.route("/").get(getAllReviews).post(protect, createReview);
router.route("/:id").delete(protect, deleteReview).patch(protect, updateReview);
module.exports = router;
