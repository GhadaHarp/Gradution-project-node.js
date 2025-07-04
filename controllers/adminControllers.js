// const userModel = require("../Models/userModel");
const adminModel = require("../models/adminModel");
const catchAsync = require("../utilities/catchAsync");
const bcrypt = require("bcrypt");
// let salt = bcrypt.genSaltSync(10);

const createAdmin = catchAsync(async (req, res) => {
  const passHashed = await bcrypt.hash(req.body.password, 10);
  const newAdmin = await adminModel.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    role: req.body.role,
    password: passHashed,
  });
  res.status(200).json({
    status: "success",
    data: newAdmin,
  });
});

const getAllAdmins = catchAsync(async (req, res, next) => {
  const Admins = await adminModel.find({ role: "admin" });
  res.status(200).json({
    status: "success",
    data: { Admins },
  });
});

const getAdmin = catchAsync(async (req, res, next) => {
  const Admin = await adminModel.findById(req.params.id);
  console.log(Admin);

  if (!Admin) {
    return next(new AppError("No Admin Exists with that id", 400));
  }
  res.status(200).json({
    status: "success",
    data: { Admin },
  });
});

const updateAdmin = catchAsync(async (req, res, next) => {
  const Admin = await adminModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!Admin) return res.status(400).json({ message: "nothing to update" });
  res.status(200).json({
    status: "success",
    data: { Admin },
  });
});

const deleteAdmin = catchAsync(async (req, res, next) => {
  // const Admin = await adminModel.findByIdAndDelete(req.params.id);
  const Admin = await adminModel.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    new: true,
  });
  console.log(Admin);

  if (!Admin) return res.status(400).json({ message: "Admin is not found" });
  res.status(200).json({
    status: "Success",
    message: "admin soft deleted successfully",
    // data: null,
  });
});

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
};
