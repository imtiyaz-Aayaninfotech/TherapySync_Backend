const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
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
}, { _id: false }); // Optional: disables _id for nested docs

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
          // If package, there must be more than 1 session
          return this.sessionPlan === "single" ? val.length === 1 : val.length > 1;
        },
        message: "Invalid number of sessions for selected session plan",
      },
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    isApproved: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TherapySchedule", TherapyScheduleSchema);
