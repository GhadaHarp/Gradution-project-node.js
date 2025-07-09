const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "An order must belong to a user"],
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        totalPriceItems: Number,
        size: String,
        color: String,
      },
    ],
    totalPrice: Number,
    totalPriceOrder: Number,

    paymentMethod: {
      type: String,
      enum: ["cash", "visa"],
      required: true,
    },
    cardNumber: {
      type: String,
      required: false,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
      phone: { type: String, required: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
orderSchema.pre("validate", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
