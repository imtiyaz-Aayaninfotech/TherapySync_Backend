const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  deviceToken: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["android", "ios"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);
