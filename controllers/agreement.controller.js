const Agreement = require('../models/agreement.model');
const { validateAgreement } = require('../validations/agreement.validator');

// Create
exports.createAgreement = async (req, res) => {
  try {
    const { error } = validateAgreement.validate(req.body);
    if (error)
      return res.status(400).json({
        status: 400,
        success: false,
        message: error.details[0].message,
        data: null,
      });

    const newAgreement = new Agreement(req.body);
    await newAgreement.save();

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Agreement created successfully',
      data: newAgreement,
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
exports.getAllAgreements = async (req, res) => {
  try {
    const agreements = await Agreement.find().populate('category_id');
    res.status(200).json({
      status: 200,
      success: true,
      message: 'Agreements fetched successfully',
      data: agreements,
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
exports.getAgreementById = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id).populate('category_id');
    if (!agreement)
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Agreement not found',
        data: null,
      });

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Agreement fetched successfully',
      data: agreement,
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

// Update
exports.updateAgreement = async (req, res) => {
  try {
    const { error } = validateAgreement.validate(req.body);
    if (error)
      return res.status(400).json({
        status: 400,
        success: false,
        message: error.details[0].message,
        data: null,
      });

    const updated = await Agreement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated)
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Agreement not found',
        data: null,
      });

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Agreement updated successfully',
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
exports.deleteAgreement = async (req, res) => {
  try {
    const deleted = await Agreement.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Agreement not found',
        data: null,
      });

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Agreement deleted successfully',
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

// getAgreementsByCategoryId
exports.getAgreementsByCategoryId = async (req, res) => {
  try {
    const { category_id } = req.params;
    const agreements = await Agreement.find({ category_id })
      .populate('category_id', 'category');

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Agreements fetched by category successfully',
      data: agreements
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Server error',
      data: null
    });
  }
};

