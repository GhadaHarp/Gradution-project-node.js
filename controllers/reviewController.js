const Review = require("../models/reviewModel");
const AppError = require("../utilities/appError");
const catchAsync = require("../utilities/catchAsync");

const getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.productId) {
    filter = { product: req.params.productId };
  }
  const reviews = await Review.find(filter);
  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

const createReview = catchAsync(async (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user._id;
  const newReview = await Review.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      review: newReview,
    },
  });
});
const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError("No review found with that id", 404));
  }
  if (req.user._id.toString() !== review.user._id.toString()) {
    return next(
      new AppError("You are not authorized to delete this review", 403)
    );
  }
  await Review.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: "success",
    data: null,
  });
});
const updateReview = catchAsync(async (req, res, next) => {
  const updatedReview = await Review.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedReview) {
    return next(new AppError("No Review found with that id"), 404);
  }
  res.status(200).json({
    status: "success",
    data: updatedReview,
  });
});
module.exports = { getAllReviews, createReview, deleteReview, updateReview };
