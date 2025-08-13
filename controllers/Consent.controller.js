const Consent = require('../models/consent.model');
const { validateConsent,validateConsentUpdate } = require('../validations/consent.validator');

// Create
exports.createConsent = async (req, res) => {
  try {
    const { error } = validateConsent.validate(req.body);
    if (error)
      return res.status(400).json({
        status: 400,
        success: false,
        message: error.details[0].message,
        data: null,
      });

    const newConsent = new Consent(req.body);
    await newConsent.save();

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Consent created successfully',
      data: newConsent,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Server error',
      data: null,
    });
  }
};

// Get All
exports.getAllConsents = async (req, res) => {
  try {
    const Consents = await Consent.find().populate('category_id');
    res.status(200).json({
      status: 200,
      success: true,
      message: 'Consents fetched successfully',
      data: Consents,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Server error',
      data: null,
    });
  }
};

// Get by ID
exports.getConsentById = async (req, res) => {
  try {
    const consent = await Consent.findById(req.params.id).populate('category_id', 'category');
    if (!consent)
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Consent not found',
        data: null,
      });

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Consent fetched successfully',
      data: consent,
    });
  } catch (err) {
    console.error('Error fetching consent by ID:', err); // optional: add logging
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Server error',
      data: null,
    });
  }
};

// Update
exports.updateConsent = async (req, res) => {
  try {
    const { error } = validateConsentUpdate.validate(req.body);
    if (error)
      return res.status(400).json({
        status: 400,
        success: false,
        message: error.details[0].message,
        data: null,
      });

    const updated = await Consent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Consent not found',
        data: null,
      });

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Consent updated successfully',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Server error',
      data: null,
    });
  }
};

// Delete
exports.deleteConsent = async (req, res) => {
  try {
    const deleted = await Consent.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Consent not found',
        data: null,
      });

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Consent deleted successfully',
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Server error',
      data: null,
    });
  }
};

// getConsentsByCategoryId
exports.getConsentsByCategoryId = async (req, res) => {
  try {
    const { category_id } = req.params;

    const consent = await Consent.findOne({ category_id })
      .populate('category_id', 'category');

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Consent fetched by category successfully',
      data: consent || {} 
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Server error',
      data: {}
    });
  }
};


