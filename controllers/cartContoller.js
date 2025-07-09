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
      (item.size || "").toLowerCase() === (size || "").toLowerCase()
  );
};

const addToCart = catchAsync(async (req, res, next) => {
  const { products } = req.body;
  const userId = req.user._id;

  if (!Array.isArray(products) || !products.length) {
    return next(new AppError("Products array is required", 400));
  }

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found", 404));

  for (const item of products) {
    const { productId, quantity, size } = item;

    const product = await Product.findById(productId);
    if (!product)
      return next(new AppError(`Product with ID ${productId} not found`, 404));

    const requiresSize = product.size_range?.length > 0;
    let availableStock;

    if (requiresSize) {
      if (!size)
        return next(new AppError("Size is required for this product", 400));

      availableStock = product.stock_by_size?.[size];
      if (availableStock === undefined)
        return next(
          new AppError(`Size ${size} not available for this product`, 400)
        );
    } else {
      availableStock = product.stock;
    }

    const existingItem = findCartItem(
      user.cart,
      productId,
      requiresSize ? size : ""
    );
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

  for (const update of updates) {
    const { productId, currentSize, newSize, quantity } = update;
    const product = await Product.findById(productId);
    if (!product) return next(new AppError("Product not found", 404));

    const requiresSize = product.size_range?.length > 0;
    const sizeInCart = requiresSize ? currentSize : "";

    const cartItem = findCartItem(user.cart, productId, sizeInCart);
    if (!cartItem) return next(new AppError("Item not found in cart", 404));

    const targetSize = requiresSize ? newSize || currentSize : "";
    const availableStock = requiresSize
      ? product.stock_by_size?.[targetSize]
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
    const duplicateItem = findCartItem(user.cart, productId, targetSize);

    const totalDesired =
      finalQuantity +
      (duplicateItem && duplicateItem !== cartItem
        ? duplicateItem.quantity
        : 0);

    if (totalDesired > availableStock)
      return next(
        new AppError(
          `Only ${availableStock} in stock for ${
            requiresSize ? `size ${targetSize}` : "this product"
          }`,
          400
        )
      );

    if (
      requiresSize &&
      newSize &&
      newSize !== currentSize &&
      duplicateItem &&
      duplicateItem !== cartItem
    ) {
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
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError("User not found", 404));

  const product = await Product.findById(productId);
  if (!product) return next(new AppError("Product not found", 404));

  const requiresSize = product.size_range?.length > 0;
  const sizeToCompare = requiresSize ? size : "";

  const initialLength = user.cart.length;
  user.cart = user.cart.filter(
    (item) =>
      !(
        getProductId(item.product) === productId &&
        (item.size || "") === (sizeToCompare || "")
      )
  );

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
  const { paymentMethod } = req.body;

  if (!["cash", "visa"].includes(paymentMethod))
    return next(new AppError("Invalid payment method", 400));

  if (paymentMethod === "cash") {
    return res.status(200).json({
      status: "success",
      message: "Cash payment selected, no Stripe needed",
    });
  }

  const user = await User.findById(req.user._id).populate("cart.product");
  if (!user || !user.cart.length)
    return next(new AppError("Cart is empty", 400));

  let totalPrice = 0;
  const line_items = [];

  for (const item of user.cart) {
    const product = item.product;
    if (!product) return next(new AppError("Product not found", 404));

    const availableStock = product.size_range?.length
      ? product.stock_by_size?.[item.size]
      : product.stock;

    if (availableStock === undefined || item.quantity > availableStock) {
      return next(
        new AppError(
          `Insufficient stock for ${product.name}, size ${item.size || "N/A"}`,
          400
        )
      );
    }

    const itemTotal = item.quantity * product.price;
    totalPrice += itemTotal;

    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${product.name} ${item.size ? `(Size: ${item.size})` : ""}`,
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: item.quantity,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/confirm-order?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/decline-order`,
    metadata: {
      userId: user._id.toString(),
    },
  });

  res.status(200).json({
    status: "success",
    checkoutSessionUrl: session.url,
  });
});

const confirmOrder = catchAsync(async (req, res, next) => {
  const { paymentMethod, shippingAddress } = req.body;

  if (!["cash", "visa"].includes(paymentMethod))
    return next(new AppError("Invalid payment method", 400));

  if (
    !shippingAddress?.address ||
    !shippingAddress?.city ||
    !shippingAddress?.country ||
    !shippingAddress?.postalCode ||
    !shippingAddress?.phone
  )
    return next(new AppError("Complete shipping details are required", 400));

  const user = await User.findById(req.user._id);
  if (!user || !user.cart.length)
    return next(new AppError("Cart is empty", 400));

  let totalPrice = 0;
  const orderItems = [];

  for (const item of user.cart) {
    const product = await Product.findById(item.product);
    if (!product) return next(new AppError("Product not found", 404));

    const availableStock = product.size_range?.length
      ? product.stock_by_size?.[item.size]
      : product.stock;

    if (availableStock === undefined || item.quantity > availableStock) {
      return next(
        new AppError(
          `Insufficient stock for ${product.name}, size ${item.size || "N/A"}`,
          400
        )
      );
    }

    if (product.size_range?.length) {
      product.stock_by_size[item.size] = availableStock - item.quantity;
      product.markModified("stock_by_size");
    } else {
      product.stock = availableStock - item.quantity;
    }

    await product.save({ validateModifiedOnly: true });

    totalPrice += item.quantity * product.price;
    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      size: item.size,
      totalPriceItems: item.quantity * product.price,
    });
  }

  const order = await Order.create({
    user: user._id,
    items: orderItems,
    totalPrice,
    totalPriceOrder: totalPrice,
    paymentMethod,
    shippingAddress,
    status: "processing",
  });

  user.cart = [];
  user.orders.push(order._id);
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
