const mongoose = require("mongoose");
const { path } = require("../app");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "A review must have content"],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, "A review can not have a rating less than 1"],
      max: [5, "A review can not have a rating more than 5"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "firstName lastName email",
  });
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
