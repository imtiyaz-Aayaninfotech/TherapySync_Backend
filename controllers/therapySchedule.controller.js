const TherapySchedule = require("../models/therapySchedule.model");
const moment = require("moment");


exports.createSchedule = async (req, res) => {
  try {
    const newSchedule = new TherapySchedule(req.body);
    const saved = await newSchedule.save();
    res.status(201).json({ message: "Schedule created", data: saved });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await TherapySchedule.find()
      .populate("user", "name email")
      .populate("category_id", "name");
    res.json({ data: schedules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await TherapySchedule.findById(req.params.id)
      .populate("user", "name email")
      .populate("category_id", "name");
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json({ data: schedule });
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    res.json({ message: "Status updated", data: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    await TherapySchedule.findByIdAndDelete(req.params.id);
    res.json({ message: "Schedule deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
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
