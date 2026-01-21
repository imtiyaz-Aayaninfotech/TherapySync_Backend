const mongoose = require("mongoose");

const websiteEnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    program: {
      type: String,
      required: true,
     enum: ['couples therapy', 'executive coaching', 'individual therapy'],
    },
    ipAddress: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending',
    },
  },
  {
    timestamps: true 
  }
);

module.exports = mongoose.model("WebsiteEnquiry", websiteEnquirySchema);
