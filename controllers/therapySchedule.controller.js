const TherapySchedule = require("../models/therapySchedule.model");
const moment = require("moment");


exports.createSchedule = async (req, res) => {
  try {
    const newSchedule = new TherapySchedule(req.body);
    const saved = await newSchedule.save();
    res.status(200).json({
      status: 200,
      success: true,
      message: "Schedule created successfully",
      data: saved,
    });
  } catch (err) {
    res.status(400).json({
      status: 400,
      success: false,
      message: err.message,
      data: [],
    });
  }
};


exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await TherapySchedule.find()
      .populate("user", "name email")
      .populate("category_id", "name");

    res.status(200).json({
      status: 200,
      success: true,
      message: "Schedules fetched successfully",
      data: schedules,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
    });
  }
};


exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await TherapySchedule.findById(req.params.id)
      .populate("user", "name email")
      .populate("category_id", "name");

    if (!schedule) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Schedule not found",
        data: [],
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Schedule fetched successfully",
      data: schedule,
    });
  } catch (err) {
    res.status(400).json({
      status: 400,
      success: false,
      message: err.message,
      data: [],
    });
  }
};


exports.updateApprovalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await TherapySchedule.findByIdAndUpdate(
      req.params.id,
      { isApproved: status },
      { new: true }
    );

    res.status(200).json({
      status: 200,
      success: true,
      message: "Approval status updated",
      data: updated,
    });
  } catch (err) {
    res.status(400).json({
      status: 400,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

exports.updateTherapySchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedSchedule = await TherapySchedule.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Therapy schedule not found",
        data: [],
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Therapy schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      success: false,
      message: error.message,
      data: [],
    });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    await TherapySchedule.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: 200,
      success: true,
      message: "Schedule deleted successfully",
      data: [],
    });
  } catch (err) {
    res.status(400).json({
      status: 400,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

exports.rescheduleSession = async (req, res) => {
  try {
    const { newDate, start, end, reason, message } = req.body;

    const schedule = await TherapySchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Schedule not found",
        data: [],
      });
    }

    // Get last session
    const lastSessionIndex = schedule.sessions.length - 1;
    const lastSession = schedule.sessions[lastSessionIndex];

    // Add to reschedule history
    schedule.rescheduleHistory.push({
      previousDate: lastSession.date,
      newDate: newDate,
      reason: reason,
      message: message || "",
    });

    // Update session with new date and time
    schedule.sessions[lastSessionIndex].date = newDate;
    schedule.sessions[lastSessionIndex].start = start;
    schedule.sessions[lastSessionIndex].end = end;

    // Update status
    schedule.status = "rescheduled";

    const updated = await schedule.save();

    res.status(200).json({
      status: 200,
      success: true,
      message: "Session rescheduled successfully",
      data: updated,
    });
  } catch (err) {
    res.status(400).json({
      status: 400,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ message: "Invalid or missing date" });
    }

    const allSlots = [
      "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
      "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
    ];

    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const schedules = await TherapySchedule.find({
      sessions: {
        $elemMatch: {
          date: {
            $gte: targetDate,
            $lt: nextDay
          }
        }
      },
      isApproved: { $in: ["pending", "approved"] }
    });

    const bookedSlots = [];
    schedules.forEach(schedule => {
      schedule.sessions.forEach(session => {
        const sessionDate = new Date(session.date).toISOString().split("T")[0];
        if (sessionDate === date) {
          bookedSlots.push(session.start);
        }
      });
    });

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      date,
      availableSlots,
      bookedSlots,
    });

  } catch (err) {
    console.error("Slot Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};
