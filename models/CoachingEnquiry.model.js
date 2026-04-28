const mongoose = require("mongoose");

const coachingEnquirySchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  organisation: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "contacted"],
    default: "pending",
  },

  contactInfo: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CoachingEnquiry", coachingEnquirySchema);
