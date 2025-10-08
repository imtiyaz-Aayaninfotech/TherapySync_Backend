const DeviceToken = require("../models/DeviceToken.model");

exports.createDeviceToken = async (req, res) => {
  try {
    const { userId, deviceToken, type } = req.body;
    if (!userId || !deviceToken || !type) {
      return res
        .status(400)
        .json({
          success: false,
          message: "userId, deviceToken, and type are required",
          data: [],
        });
    }
    const saved = await DeviceToken.create({ userId, deviceToken, type });
    res
      .status(201)
      .json({ success: true, message: "Device token saved", data: saved });
  } catch (error) {
    // Handle duplicate token error
    if (error.code === 11000) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Device token already exists",
          data: [],
        });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Server error",
        data: [],
        error: error.message,
      });
  }
};
