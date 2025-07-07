const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const AppError = require("../utilities/appError");
const catchAsync = require("../utilities/catchAsync");

const createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  res.status(200).json({
    status: "success",
    data: newUser,
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  // const users = await User.find({});
  const queryObj = {};
  //search
  const userorder = await User.findById(req.params.id).populate("orders");
  if (req.query.name) {
    queryObj.$or = [
      { firstName: { $regex: req.query.name, $options: "i" } },
      { lastName: { $regex: req.query.name, $options: "i" } },
    ];
  }
  if (req.query.status) {
    queryObj.status = req.query.status;
  }

  //filter by role
  if (req.query.role) {
    queryObj.role = req.query.role;
  }
  const userCount = await User.countDocuments();
  const userActive = await User.countDocuments({ status: "active" });
  const userInActive = await User.countDocuments({ status: "inactive" });
  const userVip = await User.countDocuments({ status: "vip" });
  // queryObj.isDeleted = { $ne: true };    for show the users which is not soft deleted only
  const users = await User.find(queryObj).populate("orders");

  // NEW Customers / Products /Orders
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const newCustomers = await User.countDocuments({
    createdAt: { $gte: weekAgo, $lte: new Date() },
    isDeleted: false,
  });

  const newProduct = await Product.countDocuments({
    createdAt: { $gte: weekAgo, $lte: new Date() },
    isDeleted: false,
  });

  const newOrder = await Order.countDocuments({
    createdAt: { $gte: weekAgo, $lte: new Date() },
    status: { $ne: "Cancelled" },
    // status: { enum: ["pending", "shipping", "Delivered"] },
  });
  res.status(200).json({
    status: "success",
    userCount: userCount,
    userActive: userActive,
    userInActive: userInActive,
    userVip: userVip,
    newCustomers: newCustomers,
    newProduct: newProduct,
    newOrder: newOrder,
    results: users.length,
    data: {
      users,
    },
  });
});
const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate({
    path: "orders",
    populate: {
      path: "items.product",
      model: "Product",
      select: "name price brand imageUrl ",
    },
  });
  if (!user) {
    return next(new AppError("No user Exists with that id", 400));
  }
 res.status(200).json({
    status: "success",
    data: {
      user: user,
      status: user.status,
    },
  });
});
// const updateUser = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!updatedUser) {
//     return next(new AppError("No user found with that id", 404));
//   }
//   res.status(200).json({
//     status: "success",
//     data: {
//       updatedUser,
//     },
//   });
// });
const updateUser = catchAsync(async (req, res, next) => {
  const userBeforeUpdate = await User
    .findById(req.params.id)
    .select("+password");
  if (!userBeforeUpdate)
    return res.status(404).json({ message: "user not found" });
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) return res.status(400).json({ message: "nothing to update" });

  if (req.body.role == "admin" && userBeforeUpdate.role !== "admin") {
    const existingAdmin = await adminModel.findOne({ email: req.body.email });
    if (existingAdmin) {
      return res.status(400).json({
        status: "fail",
        message: "An admin with this email already exists.",
      });
    }
    const newAdmin = await adminModel.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: userBeforeUpdate.password,
      // ...user,
      role: "admin",
    });

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      status: "success",
      date: { newAdmin },
      message: "admin added successfully",
    });
  }

  res.status(200).json({
    status: "success",
    data: { user },
    message: "user updated successfully",
  });
});
// const deleteUser = catchAsync(async (req, res, next) => {
//   const user = await User.findByIdAndDelete(req.params.id);
//   if (!user) {
//     return next(new AppError("No user Exists with that id", 404));
//   }
//   res.status(200).json({
//     status: "success",
//     data: null,
//   });
// });
const deleteUser = catchAsync(async (req, res, next) => {
  // const user = await User.findByIdAndDelete(req.params.id);
  const user = await User.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    // runValidators:true
    new: true,
  });
  console.log(user);

  if (!user) return res.status(400).json({ message: "user is not found" });
  res.status(200).json({
    status: "Success",
    message: "product soft deleted succesfully",
    // data: null,
  });
});

module.exports = { createUser, getAllUsers, getUser, updateUser, deleteUser };
