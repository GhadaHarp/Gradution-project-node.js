const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const { promisify } = require("util");
const passport = require("passport");
const sendEmail = require("../utilities/email");
const crypto = require("crypto");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Admin = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("Google profile:", profile);
      return done(null, profile);
    }
  )
);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    role: "customer",
    password: req.body.password,

    passwordConfirm: req.body.passwordConfirm,
  });
  const token = signToken(newUser._id);
  res.status(201).json({
    status: "success",
    token,
    data: {
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        favorites: newUser.favorites,
        cart: newUser.cart,
        orders: newUser.orders,
        _id: newUser._id,
      },
    },
  });
});

// const login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;
//   if (!password || !email) {
//     return next(new AppError("Please provide email and password", 400));
//   }

//   const user = await User.findOne({ email }).select("+password");

//   const correct = user && (await user.correctPassword(password, user.password));

//   if (!user || !correct) {
//     return next(new AppError("incorrect email or password", 401));
//   }
//   const token = signToken(user._id);
//   res.status(200).json({
//     status: "success",
//     token,
//     data: {
//       user: {
//         _id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         role: user.role,
//         favorites: user.favorites,
//         cart: user.cart,
//         orders: user.orders,
//       },
//     },
//   });
// });

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!password || !email) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  const correct = user && (await user.correctPassword(password, user.password));

  if (!user || !correct) {
    return next(new AppError("incorrect email or password", 401));
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        favorites: user.favorites,
        cart: user.cart,
        orders: user.orders,
      },
    },
  });
});

const loginAdmin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!password || !email) {
    return next(new AppError("Please provide email and password", 400));
  }

  const admin = await Admin.findOne({ email }).select("+password");

  const correct = admin && (await bcrypt.compare(password, admin.password));

  if (!admin || !correct) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const token = signToken(admin._id);
  console.log(token);
  console.log(admin);
  // console.log(token);

  res.status(200).json({
    status: "success",
    token,
    data: {
      admin: {
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
      },
    },
  });
});

// const protect = catchAsync(async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }

//   if (!token) {
//     return next(
//       new AppError("You are not logged in! Please log in to get access.", 401)
//     );
//   }

//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

//   // ✅ check both User and Admin
//   const currentUser =
//     (await User.findById(decoded.id)) || (await Admin.findById(decoded.id));

//   if (!currentUser) {
//     return next(
//       new AppError(
//         "The user belonging to this token does no longer exist.",
//         401
//       )
//     );
//   }

//   if (
//     currentUser.changedPasswordAfter &&
//     currentUser.changedPasswordAfter(decoded.iat)
//   ) {
//     return next(
//       new AppError("User recently changed password! Please log in again.", 401)
//     );
//   }

//   req.user = currentUser;
//   res.locals.user = currentUser;

//   next();
// });

// const restrictTo = (...roles) => {
//   return catchAsync(async (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return next(
//         new AppError("You do not have permission to perform this action", 403)
//       );
//     }
//     next();
//   });
// };
const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  let currentUser = await User.findById(decoded.id);
  if (currentUser) {
    req.userType = "user";
  } else {
    currentUser = await Admin.findById(decoded.id);
    if (currentUser) req.userType = "admin";
  }

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  if (
    currentUser.changedPasswordAfter &&
    currentUser.changedPasswordAfter(decoded.iat)
  ) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});
const restrictToAdminOnly = catchAsync(async (req, res, next) => {
  if (req.userType !== "admin") {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }

  next();
});

const forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `http://localhost:4200/reset-password/${resetToken}`;
  const message = `<p>Forget your password? Submit a PATCH request with your new password and passwordConfirm to:</p>
  <a href="${resetURL}">${resetURL}</a>
  <p>If you didn't forget your password, please ignore this email.</p>`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
};

const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

module.exports = {
  signup,
  loginUser,
  loginAdmin,
  protect,
  restrictToAdminOnly,
  forgotPassword,
  resetPassword,
};
