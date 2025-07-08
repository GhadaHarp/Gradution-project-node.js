const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const AppError = require("../utilities/appError");
const catchAsync = require("../utilities/catchAsync");

// Delete Order
const deleteOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  console.log(orderId);
  const order = await Order.findByIdAndDelete(orderId);
  if (!order) return next(new AppError("Order not found", 404));

  await User.updateMany({ orders: orderId }, { $pull: { orders: orderId } });

  res.status(200).json({
    status: "success",
    message: "Order deleted successfully",
  });
});

// Get All Orders with Stats
const getAllOrders = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 8 } = req.query;
  const filter = status ? { status } : {};

  const orders = await Order.find(filter)
    .populate("user")
    .populate("items.product");

  const numberOfOrders = await Order.countDocuments(filter);
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalPriceOrder || 0),
    0
  );
  const avgOrderValue = numberOfOrders ? totalRevenue / numberOfOrders : 0;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    newCustomers,
    newProduct,
    newOrder,
    userCount,
    userActive,
    userInactive,
    userVip,
  ] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: weekAgo }, isDeleted: false }),
    Product.countDocuments({ createdAt: { $gte: weekAgo }, isDeleted: false }),
    Order.countDocuments({
      createdAt: { $gte: weekAgo },
      status: { $ne: "Cancelled" },
    }),
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "inactive" }),
    User.countDocuments({ status: "vip" }),
  ]);

  res.status(200).json({
    status: "success",
    results: orders.length,
    numberOfOrders,
    totalRevenue,
    avgOrderValue,
    newCustomers,
    newProduct,
    newOrder,
    userCount,
    userActive,
    userInactive,
    userVip,
    orders,
  });
});
const getMyOrders = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const orders = await Order.find({ user: userId })
    .populate("items.product")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: orders.length,
    orders,
  });
});

const createOrder = catchAsync(async (req, res, next) => {
  const { items, paymentMethod, shippingAddress } = req.body;

  if (!paymentMethod || !["cash", "visa"].includes(paymentMethod))
    return next(new AppError("Invalid payment method", 400));
  if (
    !shippingAddress ||
    !shippingAddress.address ||
    !shippingAddress.postalCode
  )
    return next(new AppError("Address and postal code are required", 400));

  const itemsWithPrices = await Promise.all(
    items.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) throw new AppError("Product not found", 404);

      const itemTotal = product.price * item.quantity;
      return { ...item, totalPriceItems: itemTotal };
    })
  );

  const orderTotalPrice = itemsWithPrices.reduce(
    (sum, item) => sum + item.totalPriceItems,
    0
  );

  const order = await Order.create({
    user: req.user._id,
    items: itemsWithPrices,
    totalPrice: orderTotalPrice,
    totalPriceOrder: orderTotalPrice,
    paymentMethod,
    shippingAddress,
    status: "processing",
  });

  await User.findByIdAndUpdate(req.user._id, {
    $push: { orders: order._id },
  });

  res.status(201).json({
    status: "success",
    order,
  });
});

// Get Order by ID
const getOrderBYId = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user")

    .populate({
      path: "items.product",
      select: "name price brand imageUrl",
    });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
// =======
//     .populate("items.product");

//   if (!order) return next(new AppError("Order not found", 404));
// >>>>>>> develop

  res.status(200).json({
    status: "success",
    order,
  });
});

// Update Order Status
const updateOrder = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ["processing", "shipped", "delivered"];

  if (!validStatuses.includes(status))
    return next(new AppError("Invalid status", 400));

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedOrder) return next(new AppError("Order not found", 404));

  res.status(200).json({
    status: "success",
    message: "Order updated successfully",
     data: {
      order: updatedOrder,
    },
  });
});

module.exports = {
  deleteOrder,
  getAllOrders,
  createOrder,
  updateOrder,
  getOrderBYId,
  getMyOrders,
};
