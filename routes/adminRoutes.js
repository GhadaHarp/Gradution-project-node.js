const express = require("express");
const router = express.Router();
// const signup =require("../Controllers/authController")
const {
  createAdmin,
  getAllAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
} = require("../Controllers/adminControllers");
const {
  loginAdmin,
  protect,
  restrictToAdminOnly,
} = require("../controllers/authController");

router.post("/", protect, restrictToAdminOnly, createAdmin);

router.get("/", protect, restrictToAdminOnly, getAllAdmins);
router.post("/login", loginAdmin);

router.get("/:id", protect, restrictToAdminOnly, getAdmin);
router.patch("/:id", protect, restrictToAdminOnly, updateAdmin);
router.delete("/:id", protect, restrictToAdminOnly, deleteAdmin);
// router.post("/" ,signup)
// router.post("/")
module.exports = router;
