const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const AppError = require("../utilities/appError");
const catchAsync = require("../utilities/catchAsync");

const deleteOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;

  const order = await Order.findByIdAndDelete(orderId);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  const userUpdateResult = await User.updateMany(
    { "orders._id": orderId },
    { $pull: { orders: { _id: orderId } } }
  );

  console.log("User update result:", userUpdateResult);

  if (userUpdateResult.modifiedCount === 0) {
    return next(new AppError("Order not found in user's orders array", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Order deleted successfully",
  });
});










const getAllOrders = catchAsync(async (req, res) => {
  /// filter with status
  const { status, page = 1, limit = 8 } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  const data = await Order
    .find(filter)
    // .skip((page - 1) * limit)
    // .limit(parseInt(limit))
    .populate("user")
    .populate("items.product");
  //orders.length
  const NumberOfOrders = await Order.countDocuments(filter);
  //total revenue --- total orders price
  const totalRevenue = data.reduce((acc, item) => {
    // sum = +item.totalPriceOrder;
    return acc + +item.totalPriceOrder || 0;
  }, 0);

  //average order value
  avg_order_value = totalRevenue / NumberOfOrders;

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

  ////////
  const userCount = await User.countDocuments();
  const userActive = await User.countDocuments({ status: "active" });
  const userInActive = await User.countDocuments({ status: "inactive" });
  const userVip = await User.countDocuments({ status: "vip" });
  /////////

  res.status(200).json({
    status: "success",
    results: data.length,
    NumberOfOrders: NumberOfOrders,
    totalRevenue: totalRevenue,
    averageOrderValue: avg_order_value,
    newCustomers: newCustomers,
    newProduct: newProduct,
    newOrder: newOrder,
    userCount: userCount,
    userActive: userActive,
    userInActive: userInActive,
    userVip: userVip,
    // page,
    // limit,
    data,
  });
});

const createOrder = catchAsync(async (req, res) => {
  const itemsWithPrices = await Promise.all(
    req.body.items.map(async (item) => {
      console.log(item.product);
      const productId = new mongoose.Types.ObjectId(item.product);
      const product = await Product.findById(productId);
      console.log("Product found:", product);
      // <<<<<<< sama
      const itemTotal = product.price * item.quantity;
      console.log(itemTotal);
      return {
        ...item,
        totalPriceItems: itemTotal,
      };
    })
  );
  const orderTotalPrice = itemsWithPrices.reduce(
    (sum, item) => sum + item.totalPriceItems,
    0
  );
  // =======
  //       // const itemTotal = product.price * item.quantity;
  //       item.totalPriceItems = item.quantity * item.product.price;

  //          console.log(itemTotal);
  //       return {
  //         ...item,
  //         totalPriceItems: item.totalPriceItems,
  //       };
  //     })
  //   );
  //   const orderTotalPrice = itemsWithPrices.reduce((sum, item) => sum + item.totalPriceItems, 0);
  // >>>>>>> develop
  console.log(orderTotalPrice);

  const order = await Order.create({
    ...req.body,
    items: itemsWithPrices,
    totalPriceOrder: orderTotalPrice,
  });
  await updateUserStatus(order.user);
  // console.log(order.user);

  res.status(200).json({
    status: "success",
    results: order,
  });
});

const getOrderBYId = catchAsync(async (req, res) => {
  const order = await Order
    .findById(req.params.id)
    .populate("user")
    .populate({
      path: "items.product",
      select: "name price brand images",
    });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.status(200).json({
    status: "success",
    result: order,
  });
});

const updateOrder = catchAsync(async (req, res) => {
  // <<<<<<< sama
  //   const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
  //     new: true,
  //     runValidators: true,
  //   });
  // =======
  const { status } = req.body;

  if (!status) {
    return res.status(404).json({ message: "Status is required" });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status }, // 👈 تحديث status فقط
    { new: true, runValidators: true }
  );
  // >>>>>>> develop

  if (!order) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  res.status(200).json({
    status: "success",
    message: "Updated successfully",
    results: order,
  });
});


module.exports = {
  deleteOrder,
  getAllOrders,
  createOrder,
  updateOrder,
  getOrderBYId,
};
