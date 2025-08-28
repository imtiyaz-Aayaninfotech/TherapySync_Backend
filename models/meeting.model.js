const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  therapySchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapySchedule',
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  meetingLink: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    default: ''
  },
  // Scheduled date and time of the meeting
  scheduledAt: {
    type: Date,
    required: true
  },
  // Actual start time (if meeting started)
  startedAt: {
    type: Date,
    default: null
  },
  // Actual end time
  endedAt: {
    type: Date,
    default: null
  },
  // Flag for attendance
  attended: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
