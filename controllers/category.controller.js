const Category = require('../models/category.model');
const { categoryValidation } = require('../validations/category.validation');

// Add Category
exports.addCategory = async (req, res) => {
  try {
    const { error } = categoryValidation.validate(req.body);
    if (error) return res.status(400).json({ status: 400, success: false, message: error.details[0].message });

    const newCategory = new Category(req.body);
    await newCategory.save();

    res.status(201).json({
      status: 201,
      success: true,
      message: "Category added successfully",
      data: newCategory
    });
  } catch (err) {
    res.status(500).json({ status: 500, success: false, message: "Internal server error", error: err.message });
  }
};

// Get All Categories by Reason Only
exports.getAllCategories = async (req, res) => {
  try {
    const { reason } = req.query;

    if (!reason) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Reason is required"
      });
    }

    const categories = await Category.find({ reason });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Categories fetched successfully",
      data: categories
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "Fetch error",
      error: err.message
    });
  }
};


// Get Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 404, success: false, message: "Category not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Category fetched successfully",
      data: category
    });
  } catch (err) {
    res.status(500).json({ status: 500, success: false, message: "Error fetching category", error: err.message });
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { error } = categoryValidation.validate(req.body);
    if (error) return res.status(400).json({ status: 400, success: false, message: error.details[0].message });

    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ status: 404, success: false, message: "Category not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Category updated successfully",
      data: updated
    });
  } catch (err) {
    res.status(500).json({ status: 500, success: false, message: "Update error", error: err.message });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ status: 404, success: false, message: "Category not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Category deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ status: 500, success: false, message: "Delete error", error: err.message });
  }
};
