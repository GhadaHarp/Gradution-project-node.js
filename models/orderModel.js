const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "An order must belong toa user"],
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        totalPrice: Number,
        size: String,
        totalPriceItems: Number,
        color: String,
      },
    ],
    totalPrice: Number,
    totalPriceOrder: { type: Number },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    shippingAddress: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
