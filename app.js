const express = require("express");
const morgan = require("morgan");
const AppError = require("./utilities/appError");
const globalErrorHandler = require("./controllers/errorController");
// const

const app = express();
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
require("./controllers/authController");

app.use(cors({ origin: "http://localhost:4200", credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const productRouter = require("./routes/productRoute");
const userRouter = require("./routes/userRoute");
const cartRouter = require("./routes/cartRoute");
const categoryRouter = require("./routes/categoryRoute");
const reviewRouter = require("./routes/reviewRoute");
const favoritesRouter = require("./routes/favoritesRoute");
const orderRouter = require("./routes/orderRoute");
const adminRouter =require("./routes/adminRoutes")
const googleAuthRouter = require("./routes/googleAuthRoute");
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  app.use(
    cors({
      origin: "*",
      // origin: "http://localhost:4200",
      methods: "GET,POST,PUT,DELETE,PATCH",
      allowedHeaders: "Content-Type,Authorization",
    })
  );
}

app.use("/products", productRouter);
app.use("/users", userRouter);
app.use("/cart", cartRouter);
app.use("/reviews", reviewRouter);
app.use("/categories", categoryRouter);
app.use("/favorites", favoritesRouter);
app.use("/orders", orderRouter);
app.use("/auth", googleAuthRouter);
app.use("/admins", adminRouter)
app.all("*", (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
