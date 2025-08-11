const mongoose = require("mongoose");

const AdminSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // e.g. "09:00 AM"
    required: true
  },
  endTime: {
    type: String, // e.g. "05:00 PM"
    required: true
  },
  slotDuration: {
    type: Number, // in minutes, default 60
    default: 60
  },
  slots: [
    {
      start: { type: String, required: true },
      end: { type: String, required: true },
      isAvailable: { type: Boolean, default: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("AdminSlot", AdminSlotSchema);
