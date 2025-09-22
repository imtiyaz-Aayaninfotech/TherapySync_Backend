const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    therapySchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TherapySchedule",
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    meetingLink: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    notes: { type: String, default: "" },
    scheduledAt: { type: Date, required: true }, // planned start time
    scheduledEnd: { type: Date, required: true }, // planned end time
    startedAt: { type: Date, default: null }, // actual start time
    endedAt: { type: Date, default: null }, // actual end time
    attended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
