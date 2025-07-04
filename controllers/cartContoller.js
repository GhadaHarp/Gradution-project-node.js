const User = require("../models/userModel");
const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

const addToCart = catchAsync(async (req, res, next) => {
  const { products } = req.body;
  const userId = req.user._id;

  if (!userId) {
    return next(new AppError("No user ID sent"), 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("No user exists with that ID"), 401);
  }

  for (const item of products) {
    const { productId, quantity, size } = item;

    if (!size) {
      return next(new AppError(`No size sent with product: ${productId}`), 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError(`No product exists with ID: ${productId}`), 404);
    }
    console.log(user.cart);
    const existingItem = user.cart.find(
      (i) => i.product._id.toString() === productId && i.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity, size });
    }
  }

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    message: "Added to cart",
    data: {
      cart: user.cart,
    },
  });
});

const updateCart = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { updates } = req.body;

  if (!userId) return next(new AppError("No user ID provided", 401));
  if (!updates || (Array.isArray(updates) && updates.length === 0)) {
    return next(new AppError("No updates provided", 400));
  }

  const updatesArray = Array.isArray(updates) ? updates : [updates];

  const user = await User.findById(userId);
  if (!user) return next(new AppError("No user exists with that ID", 404));
  for (const update of updatesArray) {
    const { productId, currentSize, newSize, quantity } = update;

    if (!productId || !currentSize) {
      return next(
        new AppError("Product ID and current size are required", 400)
      );
    }

    const cartItemIndex = user.cart.findIndex((item) => {
      return (
        item.product._id.toString() === productId && item.size === currentSize
      );
    });

    if (cartItemIndex === -1) {
      return next(
        new AppError(
          `Item not found in cart for product ${productId} and size ${currentSize}`,
          404
        )
      );
    }

    const existingItem = user.cart[cartItemIndex];

    if (newSize && newSize !== currentSize) {
      const duplicateIndex = user.cart.findIndex(
        (item) =>
          item.product._id.toString() === productId && item.size === newSize
      );

      if (duplicateIndex !== -1) {
        user.cart[duplicateIndex].quantity += quantity || existingItem.quantity;
        user.cart.splice(cartItemIndex, 1);
      } else {
        existingItem.size = newSize;
        if (quantity !== undefined) existingItem.quantity = quantity;
      }
    } else {
      if (quantity !== undefined) {
        existingItem.quantity = quantity;
      }
    }
  }

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    message: "Cart updated successfully",
    data: {
      cart: user.cart,
    },
  });
});

const removeFromCart = catchAsync(async (req, res, next) => {
  const { productId, size } = req.body;
  const userId = req.user._id;

  if (!userId) {
    return next(new AppError("No user ID sent"), 401);
  }

  if (!productId) {
    return next(new AppError("Please provide the product ID"), 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found"), 404);
  }

  const initialCartLength = user.cart.length;

  user.cart = user.cart.filter((item) => {
    const sameProduct = item.product._id.toString() === productId;
    const sameSize = size ? item.size === size : true;
    return !(sameProduct && sameSize);
  });

  if (user.cart.length === initialCartLength) {
    return next(new AppError("No matching item found in cart", 404));
  }

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    message: "Item removed from cart",
    data: {
      cart: user.cart,
    },
  });
});

const checkout = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  if (!userId) {
    return next(new AppError("Please provide the user's id", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError(`No user found with id: ${userId}`, 400));
  }

  if (user.cart.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  let totalPrice = 0;

  for (const item of user.cart) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(
        new AppError(`No product found with id: ${item.product}`, 400)
      );
    }

    if (product.stock < item.quantity) {
      return next(new AppError(`Not enough stock for ${product.name}`, 400));
    }

    totalPrice += item.quantity * product.price;
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  const orderItems = await Promise.all(
    user.cart.map(async (item) => {
      const product = await Product.findById(item.product);
      return {
        product: item.product,
        quantity: item.quantity,
        size: item.size,
        totalPrice: item.quantity * product.price,
      };
    })
  );

  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalPrice,
  });

  user.cart = [];
  user.orders.push(order);
  await user.save({ validateModifiedOnly: true });

  res.status(201).json({
    status: "success",
    message: "Order placed successfully!",
    order,
  });
});

module.exports = { addToCart, checkout, removeFromCart, updateCart };
