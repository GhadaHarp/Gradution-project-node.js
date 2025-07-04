const express = require("express");
const {
  createUser,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
} = require("../controllers/userController");
const {
  signup,
  loginUser,
  protect,
  restrictTo,
  resetPassword,
  forgotPassword,
} = require("../controllers/authController");
const router = express.Router();

router.route("/signup").post(signup);
router.route("/login").post(loginUser);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword/:token").patch(resetPassword);

router
  .route("/")
  .get(protect, getAllUsers)
  .post(protect, restrictTo("admin"), createUser);
router
  .route("/:id")
  .get(protect, getUser)
  .delete(protect, restrictTo("admin"), deleteUser)
  .patch(protect, restrictTo("admin"), updateUser);

module.exports = router;
