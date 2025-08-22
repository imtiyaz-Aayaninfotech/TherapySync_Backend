const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  durationMinutes: { 
    type: Number,
    required: true,
    min: 1
  },
  sessionCount: { 
    type: Number,
    enum: [1, 5, 10, 20],
    default: 1,
    required: true
  },
  totalPrice: { 
    type: Number,
    required: true,
    min: 0
  },
  bookingFeeAmount: { 
    type: Number,
    required: true,
    min: 0
  },
  finalPaymentAmount: { 
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'EUR',
    uppercase: true,
    trim: true
  },
  status: { 
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: { 
    type: Date,
    default: Date.now
  },
  notes: { 
    type: String,
    default: '',
  },
},
{
  timestamps: true 
});

module.exports = mongoose.model('Pricing', pricingSchema);
