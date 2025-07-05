// const mongoose = require("mongoose");

// const productSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "A product must have a name"],
//       trim: true,
//     },
//     price: {
//       type: Number,
//       required: [true, "A product must have a price"],
//     },
//     brand: {
//       type: String,
//       required: [true, "A product must have a brand"],
//     },
//     category: {
//       type: String,
//       required: [true, "A product must have a category"],
//     },
//     imageUrl: {
//       type: String,
//       required: [true, "A product must have an image"],
//     },
//     description: {
//       type: String,
//       trim: true,
//     },
//     color: {
//       type: String,
//       trim: true,
//     },
//     material: {
//       type: String,
//       trim: true,
//     },
//     subCategory: {
//       type: String,
//       trim: true,
//     },
//     stock: {
//       type: Number,
//       default: 5,
//     },
//     rating: {
//       type: Number,
//       default: 4.5,
//     },
//     gender: {
//       type: [String],
//     },
//     release_date: {
//       type: Date,
//       default: Date.now(),
//     },
//     form: {
//       type: String,
//       trim: true,
//     },
//     activeIngredient: {
//       type: String,
//       trim: true,
//     },
//     unitCount: {
//       type: String,
//       trim: true,
//     },
//     gender: {
//       type: [String],
//       enum: {
//         values: ["men", "women"],
//         message: "Gender must be 'men' or 'women'",
//       },
//       validate: {
//         validator: function (value) {
//           return new Set(value).size === value.length;
//         },
//         message: "Duplicate values are not allowed in gender",
//       },
//       required: true,
//     },
//   },
//   {
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// productSchema.virtual("reviews", {
//   ref: "Review",
//   foreignField: "product",
//   localField: "_id",
// });
// const Product = mongoose.model("Product", productSchema);

// module.exports = Product;
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "A product must have a price"],
    },
    brand: {
      type: String,
      required: [true, "A product must have a brand"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "A product must belong to a category"],
    },
    subCategory: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "A product must have an image"],
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: [String],
      trim: true,
    },
    material: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      default: 5,
    },
    stock_by_size: {
      type: Object,
      default: {},
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    gender: {
      type: [String],
      enum: {
        values: ["men", "women"],
        message: "Gender must be 'men' or 'women'",
      },
      validate: {
        validator: function (value) {
          return new Set(value).size === value.length;
        },
        message: "Duplicate values are not allowed in gender",
      },
      required: true,
    },
    release_date: {
      type: Date,
      default: Date.now(),
    },
    form: {
      type: String,
      trim: true,
    },
    activeIngredient: {
      type: String,
      trim: true,
    },
    unitCount: {
      type: String,
      trim: true,
    },
    size_range: {
      type: [String],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "name description",
  });
  next();
});

// Calculate total stock before saving
productSchema.pre("save", function (next) {
  if (this.size_range?.length && this.stock_by_size) {
    let totalStock = 0;
    for (const key in this.stock_by_size) {
      if (Object.hasOwnProperty.call(this.stock_by_size, key)) {
        totalStock += this.stock_by_size[key];
      }
    }
    this.stock = totalStock;
  }
  next();
});

productSchema.methods.toJSON = function () {
  const product = this.toObject();

  if (product.size_range?.length && product.stock_by_size) {
    let totalStock = 0;
    for (const key in product.stock_by_size) {
      if (Object.hasOwnProperty.call(product.stock_by_size, key)) {
        totalStock += product.stock_by_size[key];
      }
    }
    product.stock = totalStock;
  }

  return product;
};

productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
