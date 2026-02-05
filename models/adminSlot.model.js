const mongoose = require("mongoose");

const SlotGroupSchema = new mongoose.Schema(
  {
    startTime: String,
    endTime: String,
    slotDuration: { type: Number, default: 60 },
    slots: [
      {
        start: String,
        end: String,
        isAvailable: { type: Boolean, default: true },
      },
    ],
  },
  { _id: false },
);

const AdminSlotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    region: {
      type: String,
      enum: ["Berlin", "Thessaloniki"],
      required: true,
    },
    slotGroups: [SlotGroupSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminSlot", AdminSlotSchema);
