const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../models/productModel");

dotenv.config({
  path: "./config.env",
});
const DB = process.env.DATABASE.replace(
  `<PASSWORD>`,
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {})
  .then((con) => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const products = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/products.json`, "utf-8")
);

const importData = async () => {
  try {
    await Product.create(products);
    console.log("data successfully loaded");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Product.deleteMany();
    console.log("data successfully deleted");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
