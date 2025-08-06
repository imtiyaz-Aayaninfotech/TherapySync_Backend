const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    type: String, // image URL or path
    default: '',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: '',
  },
  gender: {
    type: String,
    default: undefined,
    enum: ['Male', 'Female', 'Other'],
  },
  dateOfBirth: {
    type: Date,
    default: '',
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
    default: '',
  },
  region: {
    type: String,
    enum: ['Berlin', 'Thessaloniki', 'Athens', 'Hamburg', 'Other'],
    required: true,
    trim: true,
  },
  language: {
    type: String,
    enum: ['English', 'German'],
    default: 'English',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
