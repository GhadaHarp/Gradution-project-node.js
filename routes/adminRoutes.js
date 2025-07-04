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
const{loginAdmin}=require("../controllers/authController")


router.post("/",  createAdmin);

router.get("/",  getAllAdmins);
router.post('/login', loginAdmin);

router.get("/:id", getAdmin);
router.patch("/:id",  updateAdmin);
router.delete("/:id",  deleteAdmin);
// router.post("/" ,signup)
// router.post("/")
module.exports = router;
