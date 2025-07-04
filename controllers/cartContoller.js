const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getProductId = (product) => {
  if (typeof product === "string") return product;
  if (typeof product === "object" && product !== null)
    return product._id?.toString();
  return null;
};

const findCartItem = (cart, productId, size) => {
  return cart.find(
    (item) =>
      getProductId(item.product) === productId &&
      item.size.toLowerCase() === size.toLowerCase()
  );
};

const addToCart = catchAsync(async (req, res, next) => {
  const { products } = req.body;
  const userId = req.user._id;

  if (!userId) return next(new AppError("No user ID provided", 401));
  if (!Array.isArray(products) || !products.length) {
    return next(new AppError("Products array is required", 400));
  }

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found", 404));

  for (const item of products) {
    const { productId, quantity, size } = item;

    if (!productId || !quantity) {
      return next(new AppError("Product ID and quantity are required", 400));
    }

    const product = await Product.findById(productId);
    if (!product)
      return next(new AppError(`Product with ID ${productId} not found`, 404));

    const requiresSize = product.size_range?.length > 0;

    let availableStock;
    let existingItem;

    if (requiresSize) {
      if (!size)
        return next(new AppError("Size is required for this product", 400));

      availableStock = product.stock_by_size?.get(size);
      if (availableStock === undefined)
        return next(
          new AppError(`Size ${size} not available for this product`, 400)
        );

      existingItem = user.cart.find(
        (cartItem) =>
          cartItem.product.toString() === productId && cartItem.size === size
      );
    } else {
      availableStock = product.stock;
      existingItem = user.cart.find(
        (cartItem) =>
          cartItem.product.toString() === productId && !cartItem.size
      );
    }

    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (availableStock < currentQuantity + quantity)
      return next(
        new AppError(
          `Only ${availableStock} in stock for ${
            requiresSize ? `size ${size}` : "this product"
          }`,
          400
        )
      );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({
        product: productId,
        quantity,
        size: requiresSize ? size : undefined,
      });
    }
  }

  await user.save({ validateModifiedOnly: true });

  const updatedUser = await User.findById(userId).populate({
    path: "cart.product",
    populate: { path: "category" },
  });

  res.status(200).json({
    status: "success",
    message: "Added to cart",
    data: { cart: updatedUser.cart },
  });
});

const updateCart = catchAsync(async (req, res, next) => {
  const { updates } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError("User not found", 404));
  if (!Array.isArray(updates) || !updates.length) {
    return next(new AppError("Updates array is required", 400));
  }

  for (const update of updates) {
    const { productId, currentSize, newSize, quantity } = update;
    if (!productId) return next(new AppError("Product ID is required", 400));

    const product = await Product.findById(productId);
    if (!product) return next(new AppError("Product not found", 404));

    const requiresSize = product.size_range?.length > 0;
    const sizeInCart = requiresSize ? currentSize : undefined;

    const cartItem = user.cart.find(
      (item) =>
        item.product.toString() === productId &&
        (requiresSize ? item.size === sizeInCart : !item.size)
    );

    if (!cartItem) return next(new AppError("Item not found in cart", 404));

    const targetSize = requiresSize ? newSize || currentSize : undefined;
    const availableStock = requiresSize
      ? product.stock_by_size?.get(targetSize)
      : product.stock;

    if (availableStock === undefined)
      return next(
        new AppError(
          requiresSize
            ? `Size ${targetSize} not available for this product`
            : "Product stock not available",
          400
        )
      );

    const finalQuantity = quantity !== undefined ? quantity : cartItem.quantity;

    const duplicateItem = user.cart.find(
      (item) =>
        item.product.toString() === productId &&
        (requiresSize ? item.size === targetSize : !item.size) &&
        item !== cartItem
    );

    const totalDesired =
      finalQuantity + (duplicateItem ? duplicateItem.quantity : 0);

    if (totalDesired > availableStock)
      return next(
        new AppError(
          `Only ${availableStock} in stock for ${
            requiresSize ? `size ${targetSize}` : "this product"
          }`,
          400
        )
      );

    if (requiresSize && newSize && newSize !== currentSize && duplicateItem) {
      duplicateItem.quantity += finalQuantity;
      user.cart = user.cart.filter((item) => item !== cartItem);
    } else {
      cartItem.size = targetSize;
      cartItem.quantity = finalQuantity;
    }
  }

  await user.save({ validateModifiedOnly: true });
  await user.populate({ path: "cart.product", populate: { path: "category" } });

  res.status(200).json({
    status: "success",
    message: "Cart updated",
    data: { cart: user.cart },
  });
});

const removeFromCart = catchAsync(async (req, res, next) => {
  const { productId, size } = req.body;
  const userId = req.user._id;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found", 404));

  const product = await Product.findById(productId);
  if (!product) return next(new AppError("Product not found", 404));

  const requiresSize = product.size_range?.length > 0;

  if (requiresSize && !size) {
    return next(new AppError("Size is required for this product", 400));
  }

  const initialLength = user.cart.length;

  user.cart = user.cart.filter((item) => {
    const sameProduct = item.product._id.toString() === productId;
    const sameSize = requiresSize ? item.size === size : !item.size;
    return !(sameProduct && sameSize);
  });

  if (user.cart.length === initialLength) {
    return next(new AppError("Item not found in cart", 404));
  }

  await user.save({ validateModifiedOnly: true });
  await user.populate({ path: "cart.product", populate: { path: "category" } });

  res.status(200).json({
    status: "success",
    message: "Item removed",
    data: { cart: user.cart },
  });
});

const checkout = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user || !user.cart.length)
    return next(new AppError("Cart is empty", 400));

  let totalPrice = 0;

  for (const item of user.cart) {
    const product = await Product.findById(item.product);

    if (!product) return next(new AppError("Product not found", 404));

    let availableStock;

    if (product.size_range?.length) {
      availableStock = product.stock_by_size.get(item.size);
    } else {
      availableStock = product.stock;
    }

    if (availableStock === undefined || item.quantity > availableStock) {
      return next(
        new AppError(
          `Insufficient stock for ${product.name}, size ${item.size}`,
          400
        )
      );
    }

    totalPrice += item.quantity * product.price;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalPrice * 100),
    currency: "usd",
    metadata: { userId: user._id.toString() },
  });

  res.status(200).json({
    status: "success",
    clientSecret: paymentIntent.client_secret,
    totalPrice,
  });
});

const confirmOrder = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user || !user.cart.length)
    return next(new AppError("Cart is empty", 400));

  let totalPrice = 0;
  const orderItems = [];

  for (const item of user.cart) {
    const product = await Product.findById(item.product);
    if (!product) return next(new AppError("Product not found", 404));

    let availableStock;

    if (product.size_range?.length) {
      if (!(product.stock_by_size instanceof Map)) {
        product.stock_by_size = new Map(
          Object.entries(product.stock_by_size || {})
        );
      }

      availableStock = product.stock_by_size.get(item.size);

      if (availableStock === undefined)
        return next(
          new AppError(
            `Size ${item.size} not available for ${product.name}`,
            400
          )
        );

      if (item.quantity > availableStock)
        return next(
          new AppError(
            `Insufficient stock for ${product.name}, size ${item.size}`,
            400
          )
        );

      product.stock_by_size.set(item.size, availableStock - item.quantity);
    } else {
      availableStock = product.stock;

      if (availableStock === undefined || item.quantity > availableStock)
        return next(
          new AppError(`Insufficient stock for ${product.name}`, 400)
        );

      product.stock = availableStock - item.quantity;
    }

    totalPrice += item.quantity * product.price;
    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      size: item.size,
      totalPrice: item.quantity * product.price,
    });

    await product.save({ validateModifiedOnly: true });
  }

  const order = await Order.create({
    user: user._id,
    items: orderItems,
    totalPrice,
  });

  user.cart = [];
  user.orders.push(order._id); // ✅ Add order to user's orders array
  await user.save({ validateModifiedOnly: true });

  res.status(201).json({
    status: "success",
    message: "Order placed successfully",
    order,
  });
});

module.exports = {
  addToCart,
  updateCart,
  removeFromCart,
  checkout,
  confirmOrder,
};
