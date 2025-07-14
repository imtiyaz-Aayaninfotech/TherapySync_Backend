const mongoose = require("mongoose");

const DoctorInfoSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    enum: ["Psychologist", "Psychiatrist", "Therapist", "PhD"],
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  image: {
    type: String, // URL to profile image
    required: false,
  },
  about: {
    type: String,
    required: true,
  },
  experienceYears: {
    type: Number,
    required: true,
  },
  totalPatients: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      name: String,
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  consentForm: {
    url: {
      type: String, // URL to PDF
      required: false,
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
    acceptedAt: {
      type: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("DoctorInfo", DoctorInfoSchema);
