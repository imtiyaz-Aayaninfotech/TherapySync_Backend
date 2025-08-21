// controllers/pricingController.js
const Pricing = require('../models/Pricing.model');
const Category = require('../models/category.model');

exports.createPricing = async (req, res) => {
  try {
    // Check if categoryId exists
    const category = await Category.findById(req.body.categoryId);
    
    if (!category) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: `Category not found for id: ${req.body.categoryId}`,
        data: null,
      });
    }

    // Proceed to create pricing if category exists
    const pricing = await Pricing.create(req.body);
    res.status(200).json({
      status: 200,
      success: true,
      message: "Pricing created successfully",
      data: pricing,
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

exports.getPricingById = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id).populate('categoryId');
    if (!pricing) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Pricing not found",
        data: null,
      });
    }
    res.status(200).json({
      status: 200,
      success: true,
      message: "Pricing fetched successfully",
      data: pricing,
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

exports.getAllPricings = async (req, res) => {
  try {
    const pricings = await Pricing.find().populate('categoryId');
    res.status(200).json({
      status: 200,
      success: true,
      message: "Pricings fetched successfully",
      data: pricings,
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

exports.updatePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pricing) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Pricing not found",
        data: null,
      });
    }
    res.status(200).json({
      status: 200,
      success: true,
      message: "Pricing updated successfully",
      data: pricing,
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      success: false,
      message: error.message,
      data: null,
    });
  }
};

exports.deletePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndDelete(req.params.id);
    if (!pricing) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Pricing not found",
        data: null,
      });
    }
    res.status(200).json({
      status: 200,
      success: true,
      message: "Pricing deleted successfully",
      data: pricing,
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      success: false,
      message: error.message,
      data: null,
    });
  }
};
