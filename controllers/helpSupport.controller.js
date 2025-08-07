const mongoose = require("mongoose");
const HelpSupport = require("../models/helpSupport.model");
const { helpSupportSchema, helpSupportUpdateSchema } = require("../validations/helpSupport.validator");


// Create HelpSupport
exports.createHelpSupport = async (req, res) => {
  try {
    const { error } = helpSupportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: error.details[0].message,
        data: [],
      });
    }

    const helpSupport = new HelpSupport(req.body);
    await helpSupport.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Help support entry created successfully",
      data: [helpSupport],
    });
  } catch (err) {
    console.error("Create HelpSupport error:", err);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};

// Get All with pagination & search
exports.getAllHelpSupport = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const query = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { email: regex }, { message: regex }];
    }

    const total = await HelpSupport.countDocuments(query);
    const supports = await HelpSupport.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      status: 200,
      success: true,
      message: "Help support list fetched successfully",
      data: supports,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        status: 500,
        success: false,
        message: "Internal server error",
        data: [],
      });
  }
};

// Get By ID
exports.getHelpSupportById = async (req, res) => {
  try {
    const { id } = req.params;
    const support = await HelpSupport.findById(id);
    if (!support)
      return res
        .status(404)
        .json({
          status: 404,
          success: false,
          message: "Help support not found",
          data: [],
        });

    res
      .status(200)
      .json({
        status: 200,
        success: true,
        message: "Help support fetched successfully",
        data: [support],
      });
  } catch (err) {
    res
      .status(500)
      .json({
        status: 500,
        success: false,
        message: "Internal server error",
        data: [],
      });
  }
};

// Update any/all fields
exports.updateHelpSupport = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ObjectId is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid ID format",
        data: [],
      });
    }

    // Validate incoming fields
    const { error } = helpSupportUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: error.details[0].message,
        data: [],
      });
    }

    // Log for debugging
    console.log("Updating ID:", id);
    console.log("Update Payload:", req.body);

    const updated = await HelpSupport.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Help support entry not found",
        data: [],
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Help support updated successfully",
      data: [updated],
    });
  } catch (err) {
    console.error("Update Help Support error:", err);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};

// Delete
exports.deleteHelpSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HelpSupport.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({
          status: 404,
          success: false,
          message: "Help support not found",
          data: [],
        });

    res
      .status(200)
      .json({
        status: 200,
        success: true,
        message: "Help support deleted successfully",
        data: [],
      });
  } catch (err) {
    res
      .status(500)
      .json({
        status: 500,
        success: false,
        message: "Internal server error",
        data: [],
      });
  }
};

// Admin: Update Status Only
exports.updateHelpSupportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in_progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid status value",
        data: [],
      });
    }

    const updated = await HelpSupport.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Help support entry not found",
        data: [],
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Status updated successfully",
      data: [updated],
    });
  } catch (err) {
    console.error("Update Help Support Status error:", err);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};

