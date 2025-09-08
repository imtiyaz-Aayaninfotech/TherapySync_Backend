const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['Individual Therapy','Executive Coaching','Couples Therapy']
  },
  type: {
    type: String,
    enum: ['1-on-1', 'Group', 'Online', 'Hybrid', 'Other'],
    required: true
  },
  aboutTherapy: {
    type: String,
    required: true
  },
  workingTime: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  image: { type: String, default: null },
  video: { type: String, default: null },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  region: {
    type: String,
    enum: ['Berlin', 'Thessaloniki'],
    required: true,
    trim: true,
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Category', categorySchema);
