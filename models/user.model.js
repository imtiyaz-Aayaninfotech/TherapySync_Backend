const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: undefined,
    },
    dateOfBirth: {
      type: Date,
      default: undefined,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: "",
    },

    // ✅ NEW COUNTRY FIELD
    country: {
      type: String,
      enum: [
        "UK",
        "Ireland",
        "Luxembourg",
        "Latvia",
        "Hungary",
        "Bulgaria",
        "Cyprus",
        "Romania",
        "Poland",
        "Czech Republic",
        "Berlin",
        "Thessaloniki",
      ],
      required: true,
    },

    timeZone: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      enum: ["English", "German"],
      default: "English",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
