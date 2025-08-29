const TherapySchedule = require("../models/therapySchedule.model");
const moment = require("moment");
const AdminSlot = require("../models/adminSlot.model");
const generateSlots = require("../utils/slotGenerator");
const Pricing = require("../models/Pricing.model");
const Category = require('../models/category.model');

exports.createSchedule = async (req, res) => {
  try {
    const { sessions, category_id, sessionPlan } = req.body;

    // 1. Validate sessions array existence and non-empty
    if (!sessions || !sessions.length) {
      return res.status(400).json({
        message: "Sessions array is required and cannot be empty",
      });
    }

    const firstSession = sessions[0];

    // 2. Validate required fields on first session
    if (!firstSession.date || !firstSession.start || !firstSession.end) {
      return res.status(400).json({
        message: "Each session requires date, start, and end time",
      });
    }
    // 2a. Check if first session date/time is not in the past
    const firstSessionDateTimeStr = `${moment(firstSession.date).format("YYYY-MM-DD")} ${firstSession.start}`;
    const firstSessionDateTime = moment(firstSessionDateTimeStr, "YYYY-MM-DD hh:mm A");
    if (firstSessionDateTime.isBefore(moment())) {
      return res.status(400).json({ message: "Cannot create schedule for past date/time" });
    }

    // 3. Validate session count based on session plan
    const sessionCount = sessions.length;
    if (sessionPlan === "single" && sessionCount !== 1) {
      return res.status(400).json({
        message: "Single session plan requires exactly 1 session",
      });
    }
    if (sessionPlan === "package" && ![5, 10, 20].includes(sessionCount)) {
      return res.status(400).json({
        message: "Package session plan requires 5, 10, or 20 sessions",
      });
    }

    // 4. Calculate durationMinutes from first session start and end times using moment to parse 12-hour format with AM/PM
    const startMoment = moment(firstSession.start, "hh:mm A");
    const endMoment = moment(firstSession.end, "hh:mm A");
    const durationMinutes = endMoment.diff(startMoment, "minutes");

    if (durationMinutes <= 0) {
      return res.status(400).json({ message: "Invalid session start and end times" });
    }

    // 5. Find corresponding Pricing document for the therapy category, duration, session count, active status
    const pricing = await Pricing.findOne({
      categoryId: category_id,
      durationMinutes: durationMinutes,
      sessionCount: sessionCount,
      status: "active"
    });

    if (!pricing) {
      return res.status(400).json({
        message: "Pricing not found for selected category, duration, and session count",
      });
    }

    // 6. Normalize date for slot and booking validation
    const bookingDateStr = moment(firstSession.date).format("YYYY-MM-DD");
    const normalizedDate = new Date(bookingDateStr + "T00:00:00.000Z");
    const nextDay = new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000);
    const startSlot = firstSession.start;

    // 7. Find AdminSlot for the normalized date or date range to verify working hours
    let adminSlot = await AdminSlot.findOne({ date: normalizedDate });
    if (!adminSlot) {
      adminSlot = await AdminSlot.findOne({
        date: { $gte: normalizedDate, $lt: nextDay },
      });
    }
    if (!adminSlot) {
      return res.status(400).json({
        message: `Admin has not set working hours for ${bookingDateStr}`,
      });
    }

    // 8. Find the correct slot inside the slotGroups of adminSlot
    let foundSlot = null;
    let foundGroup = null;
    for (const group of adminSlot.slotGroups) {
      const slot = group.slots.find((s) => s.start === startSlot);
      if (slot) {
        foundSlot = slot;
        foundGroup = group;
        break;
      }
    }
    if (!foundSlot) {
      return res.status(400).json({ message: `Slot starting at ${startSlot} does not exist` });
    }

    // 9. Check if the slot is available or already booked in approved/pending TherapySchedules
    if (!foundSlot.isAvailable) {
      const existingBooking = await TherapySchedule.findOne({
        "sessions.date": { $gte: normalizedDate, $lt: nextDay },
        "sessions.start": startSlot,
        isApproved: { $in: ["pending", "approved"] },
      });
      if (existingBooking) {
        return res.status(400).json({ message: `Slot starting at ${startSlot} is already booked` });
      }
    }

    // 10. Mark the slot as unavailable and save adminSlot
    foundSlot.isAvailable = false;
    await adminSlot.save();

    // 11. Create new TherapySchedule using request data,
    // including price from Pricing (totalPrice),
    // initial payment state and status set to pending
    const newSchedule = new TherapySchedule({
      ...req.body,
      price: pricing.totalPrice,
      isPaid: false,
      status: "pending",
    });

    // 12. Save the schedule to DB
    const savedSchedule = await newSchedule.save();

    // 13. Respond with success and saved schedule data
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Slot tentatively booked - please complete payment",
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

// Admin Booking API
exports.adminCreateBooking = async (req, res) => {
  try {
    const { sessions, category_id, sessionPlan, user, region } = req.body;

    if (!sessions || !sessions.length) {
      return res.status(400).json({ message: "Sessions array is required and cannot be empty" });
    }
    const firstSession = sessions[0];
    if (!firstSession.date || !firstSession.start || !firstSession.end) {
      return res.status(400).json({ message: "Each session requires date, start, and end time" });
    }

    const sessionCount = sessions.length;
    if (sessionPlan === "single" && sessionCount !== 1) {
      return res.status(400).json({ message: "Single session plan requires exactly 1 session" });
    }
    if (sessionPlan === "package" && ![5, 10, 20].includes(sessionCount)) {
      return res.status(400).json({ message: "Package session plan requires 5, 10, or 20 sessions" });
    }

    const startMoment = moment(firstSession.start, "hh:mm A");
    const endMoment = moment(firstSession.end, "hh:mm A");
    const durationMinutes = endMoment.diff(startMoment, "minutes");
    if (durationMinutes <= 0) {
      return res.status(400).json({ message: "Invalid session start and end times" });
    }

    const pricing = await Pricing.findOne({
      categoryId: category_id,
      durationMinutes: durationMinutes,
      sessionCount: sessionCount,
      status: "active",
    });

    if (!pricing) {
      return res.status(400).json({ message: "Pricing not found for selected category, duration, and session count" });
    }

    // Normalize date at UTC midnight (same as createSchedule)
    const bookingDateStr = moment(firstSession.date).format("YYYY-MM-DD");
    const normalizedDate = new Date(bookingDateStr + "T00:00:00.000Z");
    const nextDay = new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000);

    // Update sessions array's first session date to UTC normalized ISO string
    const updatedSessions = sessions.map((session, index) => {
      if (index === 0) {
        return {
          ...session,
          date: normalizedDate.toISOString(),
        };
      }
      // For package sessions, you can similarly normalize other sessions if needed
      return session;
    });

    const startSlot = firstSession.start;

    let adminSlot = await AdminSlot.findOne({ date: normalizedDate });
    if (!adminSlot) {
      adminSlot = await AdminSlot.findOne({
        date: { $gte: normalizedDate, $lt: nextDay },
      });
    }

    if (!adminSlot) {
      return res.status(400).json({
        message: `Admin has not set working hours for ${bookingDateStr}`,
      });
    }

    let foundSlot = null;
    let foundGroup = null;
    for (const group of adminSlot.slotGroups) {
      const slot = group.slots.find((s) => s.start === startSlot);
      if (slot) {
        foundSlot = slot;
        foundGroup = group;
        break;
      }
    }

    if (!foundSlot) {
      return res.status(400).json({ message: `Slot starting at ${startSlot} does not exist` });
    }

    if (!foundSlot.isAvailable) {
      const existingBooking = await TherapySchedule.findOne({
        "sessions.date": { $gte: normalizedDate, $lt: nextDay },
        "sessions.start": startSlot,
        isApproved: { $in: ["pending", "approved"] },
      });
      if (existingBooking) {
        return res.status(400).json({ message: `Slot starting at ${startSlot} is already booked` });
      }
    }

    foundSlot.isAvailable = false;
    await adminSlot.save();

    const newSchedule = new TherapySchedule({
      ...req.body,
      sessions: updatedSessions, // use updated sessions with normalized dates
      price: pricing.totalPrice,
      isPaid: true,
      isApproved: "approved",
      status: "scheduled",
      paymentType: "full",
    });

    const savedSchedule = await newSchedule.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Admin booking created successfully with confirmed payment status",
      data: savedSchedule,
    });
  } catch (err) {
    console.error("Error in adminCreateBooking:", err);
    return res.status(500).json({
      status: 500,
      message: err.message || "An error occurred while creating admin booking",
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

/*
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
};  */

exports.rescheduleSession = async (req, res) => {
  try {
    const { newDate, start, end, reason, message, sessionIndex } = req.body;

    // 1. Validate input
    if (!newDate || !start || !end || !reason) {
      return res.status(400).json({ message: "newDate, start, end, and reason are required" });
    }

    // Prevent rescheduling to a past date/time
    const newDateTimeStr = `${newDate} ${start}`;
    const newDateTime = moment(newDateTimeStr, "YYYY-MM-DD hh:mm A");
    if (newDateTime.isBefore(moment())) {
      return res.status(400).json({ message: "Cannot reschedule to a past date/time" });
    }

    // 2. Find schedule
    const schedule = await TherapySchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // 3. Only allow if fully paid
    // if (!["full", "finalPayment"].includes(schedule.paymentType)) {
    //   return res.status(403).json({
    //     message: "Rescheduling allowed only after full or final payment is completed",
    //   });
    // }

    // 4. Determine which session to reschedule
    let idx = sessionIndex;
    if (idx === undefined || idx === null) {
      // if index not provided, fallback to last session like old code
      idx = schedule.sessions.length - 1;
    }
    if (idx < 0 || idx >= schedule.sessions.length) {
      return res.status(400).json({ message: "Invalid session index for reschedule" });
    }

    const sessionToReschedule = schedule.sessions[idx];

    // 5. Free old slot
    const oldDateStr = moment(sessionToReschedule.date).format("YYYY-MM-DD");
    const oldNormalizedDate = new Date(oldDateStr + "T00:00:00.000Z");
    let oldSlotDoc = await AdminSlot.findOne({ date: oldNormalizedDate });

    if (oldSlotDoc) {
      for (const group of oldSlotDoc.slotGroups) {
        const oldSlot = group.slots.find((s) => s.start === sessionToReschedule.start);
        if (oldSlot) {
          oldSlot.isAvailable = true;
          break;
        }
      }
      await oldSlotDoc.save();
    }

    // 6. Check new slot availability
    const newDateStr = moment(newDate).format("YYYY-MM-DD");
    const newNormalizedDate = new Date(newDateStr + "T00:00:00.000Z");
    const nextDayNew = new Date(newNormalizedDate.getTime() + 24 * 60 * 60 * 1000);

    let newSlotDoc = await AdminSlot.findOne({ date: newNormalizedDate });
    if (!newSlotDoc) {
      newSlotDoc = await AdminSlot.findOne({
        date: { $gte: newNormalizedDate, $lt: nextDayNew },
      });
    }
    if (!newSlotDoc) {
      return res.status(400).json({ message: `Admin has not set working hours for ${newDateStr}` });
    }

    let targetSlot = null;
    for (const group of newSlotDoc.slotGroups) {
      const slot = group.slots.find((s) => s.start === start);
      if (slot) {
        targetSlot = slot;
        break;
      }
    }
    if (!targetSlot) {
      return res.status(400).json({ message: `Slot starting at ${start} not found for ${newDateStr}` });
    }
    if (!targetSlot.isAvailable) {
      return res.status(400).json({ message: `Slot starting at ${start} is already booked` });
    }

    // 7. Mark new slot as used
    targetSlot.isAvailable = false;
    await newSlotDoc.save();

    // 8. Track history
    schedule.rescheduleHistory.push({
      previousDate: sessionToReschedule.date,
      newDate,
      reason,
      message: message || "",
    });

    // 9. Replace only that session
    schedule.sessions[idx].date = newDate;
    schedule.sessions[idx].start = start;
    schedule.sessions[idx].end = end;

    schedule.status = "rescheduled";

    const updated = await schedule.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: `Session ${idx + 1} rescheduled successfully`,
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

    if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        status: 400, success: false, message: "Invalid date format (YYYY-MM-DD)", data: {}
      });
    }

    const simpleDate = new Date(date + "T00:00:00.000Z");
    const adminSlot = await AdminSlot.findOne({ date: simpleDate });
    if (!adminSlot) {
      return res.status(404).json({
        status: 404, success: false, message: "No working hours set for this date", data: {}
      });
    }

    // Get bookings for the date
    const schedules = await TherapySchedule.find({
      sessions: {
        $elemMatch: {
          date: { $gte: simpleDate, $lt: new Date(simpleDate.getTime() + 24 * 60 * 60 * 1000) }
        }
      },
      isApproved: { $in: ["pending", "approved"] }
    });

    // Build list of booked start times
    const bookedSlots = [];
    schedules.forEach(schedule => {
      schedule.sessions.forEach(session => {
        if (moment(session.date).format("YYYY-MM-DD") === date) {
          bookedSlots.push(session.start);
        }
      });
    });

    // Mark slot availability per group
    const slotGroups = adminSlot.slotGroups.map(group => ({
      startTime: group.startTime,
      endTime: group.endTime,
      slotDuration: group.slotDuration,
      slots: group.slots.map(slot => ({
        start: slot.start,
        end: slot.end,
        isAvailable: !bookedSlots.includes(slot.start)
      }))
    }));

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Slots fetched successfully",
      data: {
        date,
        slotGroups // changed key
      }
    });

  } catch (err) {
    console.error("getSlotsByDate error:", err);
    return res.status(500).json({
      status: 500, success: false, message: err.message || "Server Error", data: {}
    });
  }
};

// exports.getSlotsByCategoryAndDate = async (req, res) => {
//   try {
//     const { date, categoryId } = req.query;
//     if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
//       return res.status(400).json({ status: 400, success: false, message: 'Invalid date format (YYYY-MM-DD)', data: {} });
//     }
//     if (!categoryId) {
//       return res.status(400).json({ status: 400, success: false, message: 'categoryId is required', data: {} });
//     }

//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({ status: 404, success: false, message: 'Category not found', data: {} });
//     }

//     // Set session duration based on category type
//     let sessionDuration = 60; // default to 60
//     if (category.category === 'Individual Therapy') {
//       sessionDuration = 50;
//     } else if (category.category === 'Couples Therapy') {
//       // You can customize to 60 or 90 as per your business rules
//       sessionDuration = 60;
//     }

//     const simpleDate = new Date(date + 'T00:00:00.000Z');
//     const adminSlot = await AdminSlot.findOne({ date: simpleDate });
//     if (!adminSlot) {
//       return res.status(200).json({ status: 200, success: true, message: 'No working hours set for this date', data: {} });
//     }

//     const slotGroups = adminSlot.slotGroups
//       .filter(group => group.slotDuration === sessionDuration)
//       .map(group => ({
//         startTime: group.startTime,
//         endTime: group.endTime,
//         slotDuration: group.slotDuration,
//         slots: group.slots,
//       }));

//     if (category.category === 'Family Therapy' && slotGroups.length === 0) {
//       return res.status(200).json({
//         status: 200,
//         success: true,
//         message: 'Family Therapy session slots not specified, showing book and available slots',
//         data: { date, slotGroups: [] },
//       });
//     }

//     const schedules = await TherapySchedule.find({
//       sessions: { $elemMatch: { date: { $gte: simpleDate, $lt: new Date(simpleDate.getTime() + 24 * 60 * 60 * 1000) } } },
//       isApproved: { $in: ['pending', 'approved'] },
//     });

//     const bookedSlots = [];
//     schedules.forEach(schedule => {
//       schedule.sessions.forEach(session => {
//         if (moment(session.date).format('YYYY-MM-DD') === date) bookedSlots.push(session.start);
//       });
//     });

//     slotGroups.forEach(group => {
//       group.slots = group.slots.map(slot => ({
//         start: slot.start,
//         end: slot.end,
//         isAvailable: !bookedSlots.includes(slot.start),
//       }));
//     });

//     // Fetch pricing info for category + sessionDuration + active
//     const pricingList = await Pricing.find({
//       categoryId,
//       durationMinutes: sessionDuration,
//       status: 'active',
//     }).sort({ sessionCount: 1 });

//     // Format pricing info for response (optional customization)
//     const pricing = pricingList.map(p => ({
//       sessionCount: p.sessionCount,
//       totalPrice: p.totalPrice,
//       bookingFeeAmount: p.bookingFeeAmount,
//       finalPaymentAmount: p.finalPaymentAmount,
//       currency: p.currency,
//       notes: p.notes,
//     }));

//     return res.status(200).json({
//       status: 200,
//       success: true,
//       message: 'Slots and pricing fetched successfully',
//       data: {
//         date,
//         slotGroups,
//         pricing,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: 500, success: false, message: error.message || 'Server Error', data: {} });
//   }
// };

exports.getSlotsByCategoryAndDate = async (req, res) => {
  try {
    const { date, categoryId } = req.query;
    if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({ status: 400, success: false, message: 'Invalid date format (YYYY-MM-DD)', data: {} });
    }
    if (!categoryId) {
      return res.status(400).json({ status: 400, success: false, message: 'categoryId is required', data: {} });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ status: 404, success: false, message: 'Category not found', data: {} });
    }

    // Set session duration based on category type
    let sessionDurations = [60]; // default 60 minutes

    if (category.category === 'Individual Therapy') {
      sessionDurations = [50]; // 50 minutes for Individual Therapy
    } else if (category.category === 'Couples Therapy') {
      sessionDurations = [60, 90]; // 60 and 90 minutes for Couples Therapy
    }

    const simpleDate = new Date(date + 'T00:00:00.000Z');
    const adminSlot = await AdminSlot.findOne({ date: simpleDate });
    if (!adminSlot) {
      return res.status(200).json({ status: 200, success: true, message: 'No working hours set for this date', data: {} });
    }

    const slotGroups = adminSlot.slotGroups
      .filter(group => sessionDurations.includes(group.slotDuration))
      .map(group => ({
        startTime: group.startTime,
        endTime: group.endTime,
        slotDuration: group.slotDuration,
        slots: group.slots,
      }));

    if (category.category === 'Family Therapy' && slotGroups.length === 0) {
      return res.status(200).json({
        status: 200,
        success: true,
        message: 'Family Therapy session slots not specified, showing book and available slots',
        data: { date, slotGroups: [] },
      });
    }

    const schedules = await TherapySchedule.find({
      sessions: { $elemMatch: { date: { $gte: simpleDate, $lt: new Date(simpleDate.getTime() + 24 * 60 * 60 * 1000) } } },
      isApproved: { $in: ['pending', 'approved'] },
    });

    const bookedSlots = [];
    schedules.forEach(schedule => {
      schedule.sessions.forEach(session => {
        if (moment(session.date).format('YYYY-MM-DD') === date) bookedSlots.push(session.start);
      });
    });

    slotGroups.forEach(group => {
      group.slots = group.slots.map(slot => ({
        start: slot.start,
        end: slot.end,
        isAvailable: !bookedSlots.includes(slot.start),
      }));
    });

    // Fetch pricing info for category + sessionDuration + active
    const pricingList = await Pricing.find({
      categoryId,
      durationMinutes: { $in: sessionDurations },
      status: 'active',
    }).sort({ sessionCount: 1 });

    // Format pricing info for response (optional customization)
    const pricing = pricingList.map(p => ({
      sessionCount: p.sessionCount,
      totalPrice: p.totalPrice,
      bookingFeeAmount: p.bookingFeeAmount,
      finalPaymentAmount: p.finalPaymentAmount,
      currency: p.currency,
      notes: p.notes,
    }));

    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Slots and pricing fetched successfully',
      data: {
        date,
        slotGroups,
        pricing,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, success: false, message: error.message || 'Server Error', data: {} });
  }
};
 
// ADMIN: Set Working Hours & Generate Slots for multiple slot groups
exports.setWorkingHours = async (req, res) => {
  try {
    const { date, slotGroups } = req.body; // slotGroups: array

    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ status: 400, success: false, message: "Invalid date format (YYYY-MM-DD)", data: {} });
    }
    const simpleDate = new Date(date + "T00:00:00.000Z");

    // Validate/Generate slots for each group
    const processedSlotGroups = (slotGroups || []).map(group => {
      // You can add more field validations here
      const slots = generateSlots(group.startTime, group.endTime, group.slotDuration || 60);
      return {
        startTime: group.startTime,
        endTime: group.endTime,
        slotDuration: group.slotDuration || 60,
        slots
      };
    });

    // Upsert for this date
    const updated = await AdminSlot.findOneAndUpdate(
      { date: simpleDate },
      { date: simpleDate, slotGroups: processedSlotGroups },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Working hours saved",
      data: updated
    });
  } catch (err) {
    console.error("setWorkingHours error:", err);
    return res.status(500).json({ status: 500, success: false, message: err.message || "Server Error", data: {} });
  }
};
