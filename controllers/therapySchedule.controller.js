const TherapySchedule = require("../models/therapySchedule.model");
const moment = require("moment");
const AdminSlot = require("../models/adminSlot.model");
const generateSlots = require("../utils/slotGenerator");


// CLIENT: Create Schedule + Book Slot in ONE API
exports.createSchedule = async (req, res) => {
  try {
    const { sessions } = req.body;

    // 1. Validate sessions
    if (!sessions || !sessions.length) {
      return res.status(400).json({
        message: "Sessions array is required and cannot be empty",
      });
    }

    const firstSession = sessions[0];

    if (!firstSession.date || !firstSession.start || !firstSession.end) {
      return res.status(400).json({
        message: "Each session requires date, start, and end time",
      });
    }

    // 2. Normalize to UTC midnight
    const bookingDateStr = moment(firstSession.date).format("YYYY-MM-DD");
    const normalizedDate = new Date(bookingDateStr + "T00:00:00.000Z");
    const nextDay = new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000);
    const startSlot = firstSession.start;

    // 3. Try exact match first, then date range match for flexibility
    let adminSlot = await AdminSlot.findOne({ date: normalizedDate });

    if (!adminSlot) {
      // fallback for records stored with timezone offsets
      adminSlot = await AdminSlot.findOne({
        date: { $gte: normalizedDate, $lt: nextDay },
      });
    }

    if (!adminSlot) {
      return res.status(400).json({
        message: `Admin has not set working hours for ${bookingDateStr}`,
      });
    }

    const slot = adminSlot.slots.find(s => s.start === startSlot);
    if (!slot) {
      return res.status(400).json({ message: `Slot starting at ${startSlot} does not exist` });
    }

    // Check if the slot is occupied only by declined bookings
    if (!slot.isAvailable) {
      const existingBooking = await TherapySchedule.findOne({
        "sessions.date": { $gte: normalizedDate, $lt: nextDay },
        "sessions.start": startSlot,
        isApproved: { $in: ["pending", "approved"] }, // declined excluded
      });

      if (existingBooking) {
        return res.status(400).json({ message: `Slot starting at ${startSlot} is already booked` });
      }
    }

    const newSchedule = new TherapySchedule(req.body);
    const savedSchedule = await newSchedule.save();

    // 7. Mark slot as booked and save
    slot.isAvailable = false;
    await adminSlot.save();

    // 8. Response
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Schedule created and slot booked successfully",
      data: savedSchedule,
    });

  } catch (err) {
    console.error("Error in createSchedule:", err);
    return res.status(500).json({
      status: 500,
      message: err.message || "An error occurred while creating the schedule",
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

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id; // id from URL path

    // Find all schedules belonging to this user
    const schedules = await TherapySchedule.find({ user: userId })
      .populate("user", "name email")
      .populate("category_id", "name");

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "No schedules found for this user",
        data: [] // always empty array when not found
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "User schedules fetched successfully",
      data: schedules
    });

  } catch (err) {
    console.error("Error fetching user schedules:", err);
    return res.status(400).json({
      status: 400,
      success: false,
      message: err.message || "An error occurred while fetching user schedules",
      data: []
    });
  }
};

exports.updateApprovalStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    // Build update object
    const updateData = { isApproved: status };

    // If declined, store reason
    if (status === "declined") {
      if (!reason) {
        return res.status(400).json({ message: "Reason is required when declining" });
      }
      updateData.declineReason = reason;
    } else {
      // Clear declineReason if approving or pending
      updateData.declineReason = "";
    }

    const updated = await TherapySchedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: `Approval status updated to ${status}`,
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

    if (!newDate || !start || !end || !reason) {
      return res.status(400).json({ message: "newDate, start, end, and reason are required" });
    }

    const schedule = await TherapySchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Get last session from the schedule
    const lastSessionIndex = schedule.sessions.length - 1;
    const lastSession = schedule.sessions[lastSessionIndex];

    const oldDateStr = moment(lastSession.date).format("YYYY-MM-DD");
    const newDateStr = moment(newDate).format("YYYY-MM-DD");

    const oldNormalizedDate = new Date(oldDateStr + "T00:00:00.000Z");
    const newNormalizedDate = new Date(newDateStr + "T00:00:00.000Z");
    const nextDayNew = new Date(newNormalizedDate.getTime() + 24 * 60 * 60 * 1000);

    // 1️⃣ Free up the old slot in AdminSlot
    let oldSlotDoc = await AdminSlot.findOne({ date: oldNormalizedDate });
    if (oldSlotDoc) {
      const oldSlot = oldSlotDoc.slots.find(s => s.start === lastSession.start);
      if (oldSlot) oldSlot.isAvailable = true;
      await oldSlotDoc.save();
    }

    // 2️⃣ Check for new slot availability
    let newSlotDoc = await AdminSlot.findOne({ date: newNormalizedDate });
    if (!newSlotDoc) {
      // Try fallback by date range
      newSlotDoc = await AdminSlot.findOne({
        date: { $gte: newNormalizedDate, $lt: nextDayNew }
      });
    }
    if (!newSlotDoc) {
      return res.status(400).json({ message: `Admin has not set working hours for ${newDateStr}` });
    }

    const targetSlot = newSlotDoc.slots.find(s => s.start === start);
    if (!targetSlot) {
      return res.status(400).json({ message: `Slot starting at ${start} not found for ${newDateStr}` });
    }
    if (!targetSlot.isAvailable) {
      return res.status(400).json({ message: `Slot starting at ${start} is already booked` });
    }

    // 3️⃣ Mark the new slot as booked
    targetSlot.isAvailable = false;
    await newSlotDoc.save();

    // 4️⃣ Add reschedule history
    schedule.rescheduleHistory.push({
      previousDate: lastSession.date,
      newDate,
      reason,
      message: message || "",
    });

    // 5️⃣ Update session details
    schedule.sessions[lastSessionIndex].date = newDate;
    schedule.sessions[lastSessionIndex].start = start;
    schedule.sessions[lastSessionIndex].end = end;

    // 6️⃣ Update status
    schedule.status = "rescheduled";

    const updated = await schedule.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Session rescheduled successfully",
      data: updated,
    });

  } catch (err) {
    console.error("Reschedule error:", err);
    return res.status(400).json({
      status: 400,
      success: false,
      message: err.message || "Error rescheduling session",
    });
  }
};

// CLIENT: Get Available Slots Based on Admin Settings & Bookings

exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    // Validate YYYY-MM-DD format
    if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ message: "Invalid date format (YYYY-MM-DD)" });
    }

    // 1. Always normalize to UTC midnight for exact match
    const simpleDate = new Date(date + "T00:00:00.000Z");

    // 2. Get admin's working hours for the specific date
    const adminSlot = await AdminSlot.findOne({ date: simpleDate });
    if (!adminSlot) {
      return res.status(404).json({ message: "No working hours set for this date" });
    }

    // 3. Get all bookings for this date that are pending or approved
    const schedules = await TherapySchedule.find({
      sessions: {
        $elemMatch: {
          date: {
            $gte: simpleDate,
            $lt: new Date(simpleDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
      isApproved: { $in: ["pending", "approved"] }, // declined not included
    });

    const bookedSlots = [];
    schedules.forEach(schedule => {
      schedule.sessions.forEach(session => {
        if (moment(session.date).format("YYYY-MM-DD") === date) {
          bookedSlots.push(session.start);
        }
      });
    });

    // 5. Merge bookings with admin slots to mark availability
    const updatedSlots = adminSlot.slots.map(slot => ({
      start: slot.start,
      end: slot.end,
      isAvailable: !bookedSlots.includes(slot.start)
    }));

    // 6. Send response
    return res.status(200).json({
      date,
      slots: updatedSlots
    });

  } catch (err) {
    console.error("getAvailableSlots error:", err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

//Get Available Slots wab Based on Admin Settings & Bookings
exports.getSlotsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    // Validate YYYY-MM-DD format
    if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid date format (YYYY-MM-DD)",
        data: {}
      });
    }

    // Normalize to UTC midnight for exact match
    const simpleDate = new Date(date + "T00:00:00.000Z");

    // Get admin's working hours for the specific date
    const adminSlot = await AdminSlot.findOne({ date: simpleDate });
    if (!adminSlot) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "No working hours set for this date",
        data: {}
      });
    }

    // Get all bookings for this date that are pending or approved
    const schedules = await TherapySchedule.find({
      sessions: {
        $elemMatch: {
          date: {
            $gte: simpleDate,
            $lt: new Date(simpleDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
      isApproved: { $in: ["pending", "approved"] },
    });

    const bookedSlots = [];
    schedules.forEach(schedule => {
      schedule.sessions.forEach(session => {
        if (moment(session.date).format("YYYY-MM-DD") === date) {
          bookedSlots.push(session.start);
        }
      });
    });

    // Merge bookings with admin slots to mark availability
    const updatedSlots = adminSlot.slots.map(slot => ({
      start: slot.start,
      end: slot.end,
      isAvailable: !bookedSlots.includes(slot.start)
    }));

    // Response
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Slots fetched successfully",
      data: {
        date,
        slots: updatedSlots
      }
    });

  } catch (err) {
    console.error("getSlotsByDate error:", err);
    return res.status(500).json({
      status: 500,
      success: false,
      message: err.message || "Server Error",
      data: {}
    });
  }
};


// ADMIN: Set Working Hours & Generate Slots
 
exports.setWorkingHours = async (req, res) => {
  try {
    const { date, startTime, endTime, slotDuration } = req.body;

    // 1. Validate date format (YYYY-MM-DD)
    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ message: "Invalid date format (YYYY-MM-DD)" });
    }

    // 2. Make date always simple: store as pure UTC midnight
    const simpleDate = new Date(date + "T00:00:00.000Z");

    // 3. Generate slots (default to 60 minutes if not passed)
    const slots = generateSlots(startTime, endTime, slotDuration || 60);

    // 4. Save or update the working hours for that date
    const updated = await AdminSlot.findOneAndUpdate(
      { date: simpleDate },
      {
        date: simpleDate,
        startTime,
        endTime,
        slotDuration: slotDuration || 60,
        slots
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Working hours saved",
      data: updated
    });
  } catch (err) {
    console.error("setWorkingHours error:", err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};