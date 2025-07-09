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
  restrictToAdminOnly,
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
  .get(protect, restrictToAdminOnly, getAllUsers)
  .post(protect, createUser);
router
  .route("/:id")
  .get(getUser)
  .delete(protect, restrictToAdminOnly, deleteUser)
  .patch(protect, updateUser);

module.exports = router;
