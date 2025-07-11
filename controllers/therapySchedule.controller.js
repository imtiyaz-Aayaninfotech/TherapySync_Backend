const TherapySchedule = require("../models/therapySchedule.model");

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
