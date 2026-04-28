const CoachingEnquiry = require("../models/CoachingEnquiry.model");
const Category = require("../models/category.model");
const {
  coachingEnquirySchema,
} = require("../validations/coachingEnquiry.validator");
const User = require("../models/user.model");

// Submit Coaching Enquiry
exports.submitCoachingEnquiry = async (req, res) => {
  try {
    const { category_id, userId, organisation, message } = req.body;

    // ✅ basic validation
    if (!userId || !organisation) {
      return res.status(400).json({
        success: false,
        message: "userId and organisation are required",
      });
    }

    // ✅ check user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ check category
    const category = await Category.findById(category_id);
    if (!category || category.category !== "Executive Coaching") {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // ✅ create enquiry (ONLY userId store)
    const enquiry = new CoachingEnquiry({
      category_id,
      userId,
      organisation,
      message,
      contactInfo: user.email || user.phoneNumber, // optional
    });

    await enquiry.save();

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: enquiry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all enquiries (admin) with search/filter/pagination
exports.getAllEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    const total = await CoachingEnquiry.countDocuments(query);

    const enquiries = await CoachingEnquiry.find(query)
      .populate("category_id", "category")
      .populate("userId", "name email phoneNumber gender country") // ✅ main change
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: enquiries,
      total,
      page: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single enquiry by ID(admin)
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await CoachingEnquiry.findById(req.params.id)
      .populate("category_id", "category")
      .populate("userId", "name email phoneNumber gender country");

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update enquiry status (admin)
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { status, contactInfo } = req.body;

    const enquiry = await CoachingEnquiry.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(contactInfo && { contactInfo }), // optional update
      },
      { new: true },
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: enquiry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete enquiry(admin)
exports.deleteEnquiry = async (req, res) => {
  try {
    const deleted = await CoachingEnquiry.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
