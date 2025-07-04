const User = require("../models/userModel");
const AppError = require("../utilities/appError");
const catchAsync = require("../utilities/catchAsync");

const addToFavorites = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  const userId = req.user._id;
  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favorites: productId } },
    { new: true }
  );
  if (!user) {
    return next(new AppError("No user found with this ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: { user },
  });
});
const removeFromFavorites = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  const userId = req.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { favorites: productId } },
    { new: true }
  );

  if (!user) {
    return next(new AppError("No user found with this ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

const getUserFavorites = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("favorites");

  if (!user) {
    return next(new AppError("No user found with this ID", 404));
  }

  res.status(200).json({
    status: "success",
    results: user.favorites.length,
    data: user.favorites,
  });
});

module.exports = { addToFavorites, removeFromFavorites, getUserFavorites };
