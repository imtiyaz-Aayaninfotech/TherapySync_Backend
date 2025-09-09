const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// RescheduleSchema declared here or imported
const RescheduleSchema = new mongoose.Schema(
  {
    previousDate: {
      type: Date,
      required: true,
    },
    newDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
    },
    rescheduledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const TherapyScheduleSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionPlan: {
      type: String,
      enum: ["single", "package"],
      required: true,
    },
    sessions: {
      type: [SessionSchema],
      validate: {
        validator: function (val) {
          return this.sessionPlan === "single"
            ? val.length === 1
            : val.length > 1;
        },
        message: "Invalid number of sessions for selected session plan",
      },
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    declineReason: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
    region: {
      type: String,
      enum: ["Berlin", "Thessaloniki"],
      required: true,
      trim: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "rescheduled", "declined"],
      default: "pending",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    rescheduleHistory: {
      type: [RescheduleSchema],
      default: [],
    },
    paymentType: {
      type: String,
      enum: [null, "full", "bookingFee", "finalPayment"],
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 }, // TTL index auto-deletes at this time
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TherapySchedule", TherapyScheduleSchema);
