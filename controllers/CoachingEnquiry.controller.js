const CoachingEnquiry = require('../models/CoachingEnquiry.model');
const Category = require('../models/CoachingEnquiry.model');

// Submit Coaching Enquiry
exports.submitCoachingEnquiry = async (req, res) => {
  try {
    const { category_id, name, email, phoneNumber, gender, organisation } = req.body;

    const category = await Category.findById(category_id);
    if (!category || category.category !== 'Executive Coaching') {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Selected category is not 'Executive Coaching'",
        data: []
      });
    }

    const enquiry = new CoachingEnquiry({
      category_id,
      name,
      email,
      phoneNumber,
      gender,
      organisation
    });

    await enquiry.save();

    return res.status(201).json({
      status: 201,
      success: true,
      message: 'Coaching enquiry submitted successfully.',
      data: enquiry
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: error.message,
      data: []
    });
  }
};

// Get all enquiries (admin) with search/filter/pagination
exports.getAllEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ]
    };

    if (status) {
      query.status = status;
    }

    const total = await CoachingEnquiry.countDocuments(query);
    const enquiries = await CoachingEnquiry.find(query)
      .populate('category_id', 'category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Enquiries fetched successfully',
      data: enquiries,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message,
      data: []
    });
  }
};

// Get single enquiry by ID
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await CoachingEnquiry.findById(req.params.id).populate('category_id', 'category');
    if (!enquiry) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Enquiry not found',
        data: []
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Enquiry fetched',
      data: enquiry
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message,
      data: []
    });
  }
};

// Update enquiry status (admin)
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'Invalid status value',
        data: []
      });
    }

    const enquiry = await CoachingEnquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Enquiry not found',
        data: []
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Status updated successfully',
      data: enquiry
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message,
      data: []
    });
  }
};

// Delete enquiry
exports.deleteEnquiry = async (req, res) => {
  try {
    const deleted = await CoachingEnquiry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Enquiry not found',
        data: []
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Enquiry deleted successfully',
      data: []
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message,
      data: []
    });
  }
};
