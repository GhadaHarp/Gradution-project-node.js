const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

//handling uncaught exception (sync)
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXECEPTION. SHUTTING DOWN...");
  console.log(err.message, err.message);
  process.exit(1);
});
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then((con) => {
  console.log("MongoDB connected successfully!");
});
// .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// handling uncaught promises (async)
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION. SHUTTING DOWN...");
  console.log(err.message, err.message);
  server.close(() => {
    process.exit(1);
  });
});
