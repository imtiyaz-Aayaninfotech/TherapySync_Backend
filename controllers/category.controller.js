const Category = require('../models/category.model');
const { categoryValidation } = require('../validations/category.validation');
const deleteFromS3 = require('../utils/aws/deleteFromS3');
const { t, getGermanAboutTherapy  } = require("../utils/i18n");

// Add Category
exports.addCategory = async (req, res) => {
  try {
    // Extract uploaded S3 file URLs
    const imageUrl = req.s3Uploads?.image?.[0] || null;
    const videoUrl = req.s3Uploads?.video?.[0] || null;

    // Merge S3 URLs into the body
    const categoryData = {
      ...req.body,
      image: imageUrl,
      video: videoUrl,
    };

    // Validate the complete payload
    const { error } = categoryValidation.validate(categoryData);
    if (error)
      return res.status(400).json({
        status: 400,
        success: false,
        message: error.details[0].message,
      });

    const newCategory = new Category(categoryData);
    await newCategory.save();

    res.status(201).json({
      status: 201,
      success: true,
      message: 'Category added successfully',
      data: newCategory,
    });
  } catch (err) {
    console.error('Add Category Error:', err);
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};


exports.getAllCategories = async (req, res) => {
  try {
    const { lang = "en" } = req.query;

    const categories = await Category.find({
      status: "active",
    });

    const data = categories.map((cat) => {
      const germanAbout = getGermanAboutTherapy(cat.category, lang);

      return {
        ...cat.toObject(),
        category: t(cat.category, lang),
        type: t(cat.type, lang),
        aboutTherapy: germanAbout || cat.aboutTherapy,
      };
    });

    return res.status(200).json({
      success: true,
      message: t("Categories fetched successfully", lang),
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Fetch error",
      error: err.message,
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
    const { id } = req.params;

    // New uploaded files from S3
    const imageUrl = req.s3Uploads?.image?.[0] || null;
    const videoUrl = req.s3Uploads?.video?.[0] || null;

    const oldCategory = await Category.findById(id);
    if (!oldCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updatedData = {
      ...req.body,
      image: imageUrl || oldCategory.image,
      video: videoUrl || oldCategory.video,
    };

    const { error } = categoryValidation.validate(updatedData);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Replace S3 files if new ones uploaded
    if (imageUrl && oldCategory.image) await deleteFromS3(oldCategory.image);
    if (videoUrl && oldCategory.video) await deleteFromS3(oldCategory.video);

    const updated = await Category.findByIdAndUpdate(id, updatedData, { new: true });

    res.json({
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ message: 'Update error', error: err.message });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // ✅ Delete S3 files FIRST
    if (category.image) await deleteFromS3(category.image);
    if (category.video) await deleteFromS3(category.video);

    // ✅ Now delete DB record
    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Category and S3 files deleted successfully',
    });
  } catch (err) {
    console.error('❌ Delete Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};