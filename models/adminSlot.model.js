const mongoose = require("mongoose");

const SlotGroupSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    slotDuration: {
      type: Number,
      default: 60,
    },
    slots: [
      {
        start: {
          type: String,
          required: true,
        },
        end: {
          type: String,
          required: true,
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { _id: false }
);

const AdminSlotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    slotGroups: [SlotGroupSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminSlot", AdminSlotSchema);
