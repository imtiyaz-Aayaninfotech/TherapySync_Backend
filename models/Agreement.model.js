const mongoose = require("mongoose");

const AgreementSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "AGREEMENT Terms of Service"
  },
  content: {
    type: String,
    required: true, // Full HTML or Markdown content of the terms
  },
  version: {
    type: String,
    default: "1.0.0",
  },
  lastUpdated: {
    type: Date,
    default: new Date("2022-05-12"),
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin", // assuming only admin creates/updates TOS
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  acceptedByUsers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      acceptedAt: {
        type: Date,
        default: Date.now,
      },
      versionAccepted: {
        type: String,
      },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Agreement", AgreementSchema);
