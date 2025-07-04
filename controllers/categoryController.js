const Category = require("../models/categoryModel");
const AppError = require("../utilities/appError");
const catchAsync = require("../utilities/catchAsync");

// const getAllCategories = catchAsync(async (req, res, next) => {
//   const categories = await Category.find();
//   res.status(200).json({
//     status: "success",
//     results: categories.length,
//     data: {
//       categories,
//     },
//   });
// });

const getAllCategories=catchAsync(async(req,res)=>{
  const categories= await Category.find({});
    res.status(200).json({
        status: "success",
        data: categories,
      })
  }
);

// const createCategory = catchAsync(async (req, res, next) => {
//   const newCategory = await Category.create(req.body);
//   res.status(201).json({
//     status: "success",
//     data: {
//       category: newCategory,
//     },
//   });
// });

const createCategory=catchAsync(async(req,res)=>{
 const category=await Category.create(req.body);
 res.status(200).json({
    status: "success",
    data: category,
})
});
// const updateCategory = catchAsync(async (req, res, next) => {
//   const updatedCategory = await Category.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     {
//       new: true,
//       runValidators: true,
//     }
//   );
//   if (!updatedCategory) {
//     return next(new AppError("No category found with that id"), 404);
//   }
//   res.status(200).json({
//     status: "success",
//     data: updatedCategory,
//   });
// });

const updateCategory = catchAsync(async (req, res) => {
    const categoryId = req.params.id;
    const newName = req.body.name;
  
    // 1. تأكد أن الـ category موجودة
    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
    }
  
    // 2. لو الاسم هيتغير، تأكد أنه مش متكرر
    if (newName && newName !== existingCategory.name) {
      const nameExists = await Category.findOne({ name: newName });
      if (nameExists) {
        return res.status(400).json({
          status: "fail",
          message: `Category name "${newName}" already exists.`,
        });
      }
    } else {
      // لو الاسم مش هيتغير، إحذفه من body
      delete req.body.name;
    }
  
    // 3. تنفيذ التحديث
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, req.body, {
      new: true,
      runValidators: true,
    });
  
    // if (!updatedCategory) {
    //   return res.status(400).json({
    //     status: "fail",
    //     message: "Nothing to update",
    //   });
    // }
  
    return res.status(200).json({
      status: "success",
      message: "Updated successfully",
      data: updatedCategory,
    });
  });

// const getCategory = catchAsync(async (req, res, next) => {
//   const category = await Category.findById(req.params.id);
//   if (!category) {
//     return next(new AppError("No category found with that id", 404));
//   }
//   res.status(200).json({
//     status: "success",
//     data: {
//       category,
//     },
//   });
// });

const getCategory=catchAsync(async(req,res)=>{
    const category=await Category.findById(req.params.id);
    res.status(200).json({
        status: "success",
        data: category,
    })
});

// const deleteCategory = catchAsync(async (req, res, next) => {
//   const category = await Category.findById(req.params.id);
//   if (!category) {
//     return next(new AppError("No category found with that id", 404));
//   }
//   await Category.findByIdAndDelete(req.params.id);
//   res.status(200).json({
//     status: "success",
//     data: null,
//   });
// });

const deleteCategory=catchAsync(async(req,res)=>{
    const deletedCategory=await Category.findByIdAndUpdate(req.params.id,{isDeleted:true},{new:true});
    if(!deletedCategory){
        res.status(400).json({ status: "success",message:"nothing to delete",date:deletedCategory})
    }
  else{
    res.status(200).json({ status: "success",message:"deleted successfully",date:deletedCategory})}
})

module.exports = {
  getAllCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  getCategory,
};
