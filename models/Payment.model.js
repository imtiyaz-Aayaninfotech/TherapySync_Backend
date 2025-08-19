const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  therapyScheduleId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapySchedule',
    required: true
  },
  sessionPlan: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  method: {
    type: String,
    enum: ['applepay', 'creditcard', 'paypal',],
    required: true
  },
  cardDetails: {
    last4: { type: String },
    brand: { type: String }
  },
  transactionId: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentType: { 
    type: String,
    enum: ['full', 'bookingFee', 'finalPayment'],
    required: true
  },
  bookingFee: {
    type: Number,
    default: 0
  },
  finalPayment: {
    type: Number,
    default: 0
  },
  finalDueDate: { 
    type: Date,
    default: null
  },
  refund: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
