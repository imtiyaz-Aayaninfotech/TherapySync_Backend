const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  termsText: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  ins_date: {
    type: Date,
    default: Date.now
  },
  region: {
    type: String,
    enum: ['Berlin', 'Thessaloniki'],
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model('Agreement', agreementSchema);