const TherapySchedule = require("../models/therapySchedule.model");
// const moment = require("moment");
const AdminSlot = require("../models/adminSlot.model");
const generateSlots = require("../utils/slotGenerator");
const Pricing = require("../models/Pricing.model");
const Category = require("../models/category.model");
const moment = require("moment-timezone");
const REGION_TIMEZONE = require("../utils/regionTimezone");

/*
 Mongo shell RUN one time 
 db.therapyschedules.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
*/

// exports.createSchedule = async (req, res) => {
//   try {
//     const { sessions, category_id, sessionPlan, user } = req.body;

//     if (!sessions || !sessions.length) {
//       return res.status(400).json({
//         message: "Sessions array is required",
//       });
//     }

//     // 🔹 Validate sessionPlan
//     if (sessionPlan === "single" && sessions.length !== 1) {
//       return res.status(400).json({
//         message: "Single session must contain exactly 1 session",
//       });
//     }

//     if (sessionPlan === "package" && ![5, 10, 20].includes(sessions.length)) {
//       return res.status(400).json({
//         message: "Package must contain 5, 10 or 20 sessions",
//       });
//     }

//     // 🔹 Get User
//     const User = require("../models/user.model");
//     const userDoc = await User.findById(user);

//     if (!userDoc) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const userTz = userDoc.timeZone;

//     const convertedSessions = [];
//     let durationMinutes = null;

//     // 🔥 LOOP ALL SESSIONS (IMPORTANT FOR PACKAGE)
//     for (const session of sessions) {
//       if (!session.date || !session.start || !session.end) {
//         return res.status(400).json({
//           message: "Each session requires date, start and end",
//         });
//       }

//       const userStart = moment.tz(
//         `${session.date} ${session.start}`,
//         "YYYY-MM-DD HH:mm",
//         userTz,
//       );

//       const userEnd = moment.tz(
//         `${session.date} ${session.end}`,
//         "YYYY-MM-DD HH:mm",
//         userTz,
//       );

//       if (!userStart.isValid() || !userEnd.isValid()) {
//         return res.status(400).json({
//           message: "Invalid date or time format",
//         });
//       }

//       // 🔹 Find AdminSlot for that date
//       const possibleAdminSlots = await AdminSlot.find({
//         date: {
//           $gte: moment(session.date).startOf("day").toDate(),
//           $lt: moment(session.date).endOf("day").toDate(),
//         },
//       });

//       if (!possibleAdminSlots.length) {
//         return res.status(400).json({
//           message: `Admin has not set working hours for ${session.date}`,
//         });
//       }

//       let adminSlot = null;
//       let adminStart = null;
//       let adminEnd = null;
//       let adminTz = null;

//       // 🔥 Match correct admin slot by timezone
//       for (const slotDoc of possibleAdminSlots) {
//         adminTz = slotDoc.timezone;

//         const convertedStart = userStart.clone().tz(adminTz);
//         const convertedEnd = userEnd.clone().tz(adminTz);

//         const slotExists = slotDoc.slotGroups.some((group) =>
//           group.slots.some((s) => s.start === convertedStart.format("HH:mm")),
//         );

//         if (slotExists) {
//           adminSlot = slotDoc;
//           adminStart = convertedStart;
//           adminEnd = convertedEnd;
//           break;
//         }
//       }

//       if (!adminSlot) {
//         return res.status(400).json({
//           message: `Selected slot not found for ${session.date}`,
//         });
//       }

//       const currentDuration = adminEnd.diff(adminStart, "minutes");

//       if (isNaN(currentDuration) || currentDuration <= 0) {
//         return res.status(400).json({
//           message: "Invalid session duration",
//         });
//       }

//       // 🔹 Ensure all sessions same duration
//       if (durationMinutes === null) {
//         durationMinutes = currentDuration;
//       } else if (durationMinutes !== currentDuration) {
//         return res.status(400).json({
//           message: "All sessions must have same duration",
//         });
//       }

//       const adminDateStr = adminStart.format("YYYY-MM-DD");

//       const normalizedDate = moment
//         .tz(adminDateStr, "YYYY-MM-DD", adminTz)
//         .startOf("day")
//         .toDate();

//       // 🔹 Check slot existence
//       let foundSlot = null;

//       for (const group of adminSlot.slotGroups) {
//         const slot = group.slots.find(
//           (s) => s.start === adminStart.format("HH:mm"),
//         );
//         if (slot) {
//           foundSlot = slot;
//           break;
//         }
//       }

//       if (!foundSlot) {
//         return res.status(400).json({
//           message: `Slot not found at ${adminStart.format("HH:mm")}`,
//         });
//       }

//       // 🔹 Double check booking
//       const existingBooking = await TherapySchedule.findOne({
//         "sessions.date": normalizedDate,
//         "sessions.start": adminStart.format("HH:mm"),
//         isApproved: { $in: ["pending", "approved"] },
//       });

//       if (existingBooking) {
//         return res.status(400).json({
//           message: `Slot already booked on ${session.date} at ${session.start}`,
//         });
//       }

//       // 🔹 Lock slot
//       foundSlot.isAvailable = false;
//       await adminSlot.save();

//       // 🔹 Add converted session
//       convertedSessions.push({
//         date: normalizedDate,
//         start: adminStart.format("HH:mm"),
//         end: adminEnd.format("HH:mm"),
//       });
//     }

//     // 🔹 Pricing validation (AFTER loop)
//     const pricing = await Pricing.findOne({
//       categoryId: category_id,
//       durationMinutes: Number(durationMinutes),
//       sessionCount: Number(sessions.length),
//       status: "active",
//     });

//     if (!pricing) {
//       return res.status(400).json({
//         message: `Pricing not found for ${sessions.length} sessions of ${durationMinutes} minutes`,
//       });
//     }

//     // 🔹 Save schedule
//     const newSchedule = new TherapySchedule({
//       category_id,
//       user,
//       sessionPlan,
//       sessions: convertedSessions,
//       price: pricing.totalPrice,
//       isPaid: false,
//       status: "pending",
//       expiresAt: Date.now() + 15 * 60 * 1000,
//     });

//     const saved = await newSchedule.save();

//     return res.status(200).json({
//       success: true,
//       message: "Schedule booked successfully",
//       data: saved,
//     });
//   } catch (err) {
//     console.error("createSchedule error:", err);
//     return res.status(500).json({
//       message: err.message,
//     });
//   }
// };

exports.createSchedule = async (req, res) => {
  try {
    const { sessions, category_id, sessionPlan, user } = req.body;

    if (!sessions || !sessions.length) {
      return res.status(400).json({
        message: "Sessions array is required",
      });
    }

    if (sessionPlan === "single" && sessions.length !== 1) {
      return res.status(400).json({
        message: "Single session must contain exactly 1 session",
      });
    }

    if (sessionPlan === "package" && ![5, 10, 20].includes(sessions.length)) {
      return res.status(400).json({
        message: "Package must contain 5, 10 or 20 sessions",
      });
    }

    const User = require("../models/user.model");
    const userDoc = await User.findById(user);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const userTz = userDoc.timeZone;

    const convertedSessions = [];
    let durationMinutes = null;

    for (const session of sessions) {
      if (!session.date || !session.start || !session.end) {
        return res.status(400).json({
          message: "Each session requires date, start and end",
        });
      }

      const userStart = moment.tz(
        `${session.date} ${session.start}`,
        "YYYY-MM-DD HH:mm",
        userTz
      );

      const userEnd = moment.tz(
        `${session.date} ${session.end}`,
        "YYYY-MM-DD HH:mm",
        userTz
      );

      if (!userStart.isValid() || !userEnd.isValid()) {
        return res.status(400).json({
          message: "Invalid date or time format",
        });
      }

      // ✅ PRODUCTION SAFE ADMIN SLOT FIND
      const allAdminSlots = await AdminSlot.find();

      const possibleAdminSlots = allAdminSlots.filter((slotDoc) => {
        const adminTz = slotDoc.timezone;

        const startOfDayUTC = moment
          .tz(session.date, "YYYY-MM-DD", adminTz)
          .startOf("day")
          .utc();

        const endOfDayUTC = moment
          .tz(session.date, "YYYY-MM-DD", adminTz)
          .endOf("day")
          .utc();

        return moment(slotDoc.date).isBetween(
          startOfDayUTC,
          endOfDayUTC,
          null,
          "[)"
        );
      });

      if (!possibleAdminSlots.length) {
        return res.status(400).json({
          message: `Admin has not set working hours for ${session.date}`,
        });
      }

      let adminSlot = null;
      let adminStart = null;
      let adminEnd = null;
      let adminTz = null;

      for (const slotDoc of possibleAdminSlots) {
        adminTz = slotDoc.timezone;

        const convertedStart = userStart.clone().tz(adminTz);
        const convertedEnd = userEnd.clone().tz(adminTz);

        const slotExists = slotDoc.slotGroups.some((group) =>
          group.slots.some(
            (s) => s.start === convertedStart.format("HH:mm")
          )
        );

        if (slotExists) {
          adminSlot = slotDoc;
          adminStart = convertedStart;
          adminEnd = convertedEnd;
          break;
        }
      }

      if (!adminSlot) {
        return res.status(400).json({
          message: `Selected slot not found for ${session.date}`,
        });
      }

      const currentDuration = adminEnd.diff(adminStart, "minutes");

      if (isNaN(currentDuration) || currentDuration <= 0) {
        return res.status(400).json({
          message: "Invalid session duration",
        });
      }

      if (durationMinutes === null) {
        durationMinutes = currentDuration;
      } else if (durationMinutes !== currentDuration) {
        return res.status(400).json({
          message: "All sessions must have same duration",
        });
      }

      const adminDateStr = adminStart.format("YYYY-MM-DD");

      const normalizedDate = moment
        .tz(adminDateStr, "YYYY-MM-DD", adminTz)
        .startOf("day")
        .toDate();

      let foundSlot = null;

      for (const group of adminSlot.slotGroups) {
        const slot = group.slots.find(
          (s) => s.start === adminStart.format("HH:mm")
        );
        if (slot) {
          foundSlot = slot;
          break;
        }
      }

      if (!foundSlot) {
        return res.status(400).json({
          message: `Slot not found at ${adminStart.format("HH:mm")}`,
        });
      }

      const existingBooking = await TherapySchedule.findOne({
        "sessions.date": normalizedDate,
        "sessions.start": adminStart.format("HH:mm"),
        isApproved: { $in: ["pending", "approved"] },
      });

      if (existingBooking) {
        return res.status(400).json({
          message: `Slot already booked on ${session.date} at ${session.start}`,
        });
      }

      foundSlot.isAvailable = false;
      await adminSlot.save();

      convertedSessions.push({
        date: normalizedDate,
        start: adminStart.format("HH:mm"),
        end: adminEnd.format("HH:mm"),
      });
    }

    const pricing = await Pricing.findOne({
      categoryId: category_id,
      durationMinutes: Number(durationMinutes),
      sessionCount: Number(sessions.length),
      status: "active",
    });

    if (!pricing) {
      return res.status(400).json({
        message: `Pricing not found for ${sessions.length} sessions of ${durationMinutes} minutes`,
      });
    }

    const newSchedule = new TherapySchedule({
      category_id,
      user,
      sessionPlan,
      sessions: convertedSessions,
      price: pricing.totalPrice,
      isPaid: false,
      status: "pending",
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const saved = await newSchedule.save();

    return res.status(200).json({
      success: true,
      message: "Schedule booked successfully",
      data: saved,
    });
  } catch (err) {
    console.error("createSchedule error:", err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

// Admin Booking API
exports.adminCreateBooking = async (req, res) => {
  try {
    const { sessions, category_id, sessionPlan, user } = req.body;

    if (!sessions || !sessions.length) {
      return res.status(400).json({
        message: "Sessions array is required",
      });
    }

    const firstSession = sessions[0];

    if (!firstSession.date || !firstSession.start || !firstSession.end) {
      return res.status(400).json({
        message: "Each session requires date, start, and end time",
      });
    }

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

    // ✅ Validate time format strictly (24-hour)
    const startMoment = moment(firstSession.start, "HH:mm", true);
    const endMoment = moment(firstSession.end, "HH:mm", true);

    if (!startMoment.isValid() || !endMoment.isValid()) {
      return res.status(400).json({
        message: "Invalid time format. Use HH:mm (24-hour)",
      });
    }

    const durationMinutes = endMoment.diff(startMoment, "minutes");

    if (durationMinutes <= 0) {
      return res.status(400).json({
        message: "Invalid session duration",
      });
    }

    // ✅ Find AdminSlot for that date
    const adminSlot = await AdminSlot.findOne({
      date: {
        $gte: moment(firstSession.date).startOf("day").toDate(),
        $lt: moment(firstSession.date).endOf("day").toDate(),
      },
    });

    if (!adminSlot) {
      return res.status(400).json({
        message: `Admin has not set working hours for ${firstSession.date}`,
      });
    }

    const adminTz = adminSlot.timezone;

    // ✅ Normalize date in ADMIN timezone
    const normalizedDate = moment
      .tz(firstSession.date, "YYYY-MM-DD", adminTz)
      .startOf("day")
      .toDate();

    // ✅ Pricing validation
    const pricing = await Pricing.findOne({
      categoryId: category_id,
      durationMinutes,
      sessionCount,
      status: "active",
    });

    if (!pricing) {
      return res.status(400).json({
        message:
          "Pricing not found for selected category, duration, and session count",
      });
    }

    // ✅ Check if slot exists in AdminSlot
    let slotExists = false;

    for (const group of adminSlot.slotGroups) {
      const slot = group.slots.find((s) => s.start === firstSession.start);
      if (slot) {
        slotExists = true;
        break;
      }
    }

    if (!slotExists) {
      return res.status(400).json({
        message: `Slot starting at ${firstSession.start} does not exist`,
      });
    }

    // ✅ REAL booking check using DATE RANGE (timezone safe)
    const startOfDay = moment(normalizedDate).startOf("day").toDate();
    const endOfDay = moment(normalizedDate).endOf("day").toDate();

    const existingBooking = await TherapySchedule.findOne({
      sessions: {
        $elemMatch: {
          date: { $gte: startOfDay, $lte: endOfDay },
          start: firstSession.start,
        },
      },
      $or: [
        { status: "scheduled" },
        {
          status: "pending",
          expiresAt: { $gt: new Date() },
        },
      ],
    });

    if (existingBooking) {
      return res.status(400).json({
        message: `Slot starting at ${firstSession.start} is already booked`,
      });
    }

    // ✅ Mark slot unavailable (optional visual sync)
    for (const group of adminSlot.slotGroups) {
      const slot = group.slots.find((s) => s.start === firstSession.start);
      if (slot) {
        slot.isAvailable = false;
        break;
      }
    }

    await adminSlot.save();

    // ✅ Create schedule
    const newSchedule = new TherapySchedule({
      category_id,
      user,
      sessionPlan,
      sessions: [
        {
          date: normalizedDate,
          start: firstSession.start,
          end: firstSession.end,
        },
      ],
      price: pricing.totalPrice,
      isPaid: true,
      isApproved: "approved",
      status: "approved",
      paymentType: "full",
    });

    const savedSchedule = await newSchedule.save();

    return res.status(200).json({
      success: true,
      message: "Admin booking created successfully",
      data: savedSchedule,
    });
  } catch (err) {
    console.error("Error in adminCreateBooking:", err);
    return res.status(500).json({
      message: err.message || "Server error",
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
    const userId = req.params.id;

    const User = require("../models/user.model");
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
        data: [],
      });
    }

    const userTz = userDoc.timeZone;

    const schedules = await TherapySchedule.find({ user: userId })
      .populate("user", "name email timeZone")
      .populate("category_id", "name");

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "No schedules found for this user",
        data: [],
      });
    }

    // ✅ Convert sessions to USER timezone
    const convertedSchedules = schedules.map((schedule) => {
  const convertedSessions = schedule.sessions.map((session) => {

    // 🔥 Step 1: Find which admin timezone this slot belongs to
    // We detect using date matching from AdminSlot collection
    // (Because admin may be Berlin or Athens)

    const adminSlot = schedule._doc.region === "Thessaloniki"
      ? "Europe/Athens"
      : "Europe/Berlin"; // default Berlin

    const adminTz = adminSlot;

    // 🔥 Step 2: Build admin datetime correctly
    const adminDateTime = moment.tz(
      moment(session.date).format("YYYY-MM-DD") + " " + session.start,
      "YYYY-MM-DD HH:mm",
      adminTz
    );

    const adminEndDateTime = moment.tz(
      moment(session.date).format("YYYY-MM-DD") + " " + session.end,
      "YYYY-MM-DD HH:mm",
      adminTz
    );

    // 🔥 Step 3: Convert to user timezone
    const userDateTime = adminDateTime.clone().tz(userTz);
    const userEndDateTime = adminEndDateTime.clone().tz(userTz);

    return {
      ...session.toObject(),
      date: userDateTime.format("YYYY-MM-DD"),
      start: userDateTime.format("HH:mm"),
      end: userEndDateTime.format("HH:mm"),
    };
  });

  return {
    ...schedule.toObject(),
    sessions: convertedSessions,
  };
});
    return res.status(200).json({
      status: 200,
      success: true,
      message: "User schedules fetched successfully",
      data: convertedSchedules,
    });
  } catch (err) {
    console.error("Error fetching user schedules:", err);
    return res.status(400).json({
      status: 400,
      success: false,
      message: err.message || "An error occurred while fetching user schedules",
      data: [],
    });
  }
};

exports.updateApprovalStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    // Build update object to update both isApproved and status
    const updateData = {
      isApproved: status,
      status: status,
    };

    // If declining, require a reason and set declineReason
    if (status === "declined") {
      if (!reason) {
        return res
          .status(400)
          .json({ message: "Reason is required when declining" });
      }
      updateData.declineReason = reason;
    } else {
      // Clear declineReason when not declined
      updateData.declineReason = "";
    }

    const updated = await TherapySchedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: `Approval and status updated to ${status}`,
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
      { new: true },
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
    const { newDate, start, end, reason, message, sessionIndex } = req.body;

    if (!newDate || !start || !end || !reason) {
      return res.status(400).json({
        message: "newDate, start, end and reason are required",
      });
    }

    // 🔹 1️⃣ Find schedule
    const schedule = await TherapySchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // 🔹 2️⃣ Determine session index
    let idx =
      sessionIndex !== undefined && sessionIndex !== null
        ? sessionIndex
        : schedule.sessions.length - 1;

    if (idx < 0 || idx >= schedule.sessions.length) {
      return res.status(400).json({
        message: "Invalid session index",
      });
    }

    const oldSession = schedule.sessions[idx];

    // 🔹 3️⃣ Get schedule user timezone
    const User = require("../models/user.model");
    const userDoc = await User.findById(schedule.user);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const userTz = userDoc.timeZone;

    // 🔹 4️⃣ Find AdminSlot for NEW date
    const newSlotDoc = await AdminSlot.findOne({
      date: {
        $gte: moment(newDate).startOf("day").toDate(),
        $lt: moment(newDate).endOf("day").toDate(),
      },
    });

    if (!newSlotDoc) {
      return res.status(400).json({
        message: `Admin has not set working hours for ${newDate}`,
      });
    }

    const adminTz = newSlotDoc.timezone;

    // 🔥 Convert USER → ADMIN time
    const userStartMoment = moment.tz(
      `${newDate} ${start}`,
      "YYYY-MM-DD HH:mm",
      userTz,
    );

    const userEndMoment = moment.tz(
      `${newDate} ${end}`,
      "YYYY-MM-DD HH:mm",
      userTz,
    );

    if (!userStartMoment.isValid() || !userEndMoment.isValid()) {
      return res.status(400).json({
        message: "Invalid time format",
      });
    }

    const adminStartMoment = userStartMoment.clone().tz(adminTz);
    const adminEndMoment = userEndMoment.clone().tz(adminTz);

    const adminStart = adminStartMoment.format("HH:mm");
    const adminEnd = adminEndMoment.format("HH:mm");

    // 🔹 5️⃣ Check slot existence
    let targetSlot = null;

    for (const group of newSlotDoc.slotGroups) {
      const slot = group.slots.find((s) => s.start === adminStart);
      if (slot) {
        targetSlot = slot;
        break;
      }
    }

    if (!targetSlot) {
      return res.status(400).json({
        message: `Slot starting at ${start} not found`,
      });
    }

    // 🔹 6️⃣ Double check booking safety (real source of truth)
    const normalizedNewDate = moment
      .tz(newDate, "YYYY-MM-DD", adminTz)
      .startOf("day")
      .toDate();

    const existingBooking = await TherapySchedule.findOne({
      _id: { $ne: schedule._id },
      "sessions.date": normalizedNewDate,
      "sessions.start": adminStart,
      isApproved: { $in: ["pending", "approved"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: `Slot already booked`,
      });
    }

    if (!targetSlot.isAvailable) {
      return res.status(400).json({
        message: `Slot already booked`,
      });
    }

    // 🔹 7️⃣ FREE OLD SLOT (AFTER validation success)
    const oldDateStr = moment(oldSession.date).format("YYYY-MM-DD");

    const oldSlotDoc = await AdminSlot.findOne({
      date: {
        $gte: moment(oldDateStr).startOf("day").toDate(),
        $lt: moment(oldDateStr).endOf("day").toDate(),
      },
    });

    if (oldSlotDoc) {
      for (const group of oldSlotDoc.slotGroups) {
        const slot = group.slots.find((s) => s.start === oldSession.start);
        if (slot) {
          slot.isAvailable = true;
          break;
        }
      }
      await oldSlotDoc.save();
    }

    // 🔹 8️⃣ Lock new slot
    targetSlot.isAvailable = false;
    await newSlotDoc.save();

    // 🔹 9️⃣ Track history
    schedule.rescheduleHistory.push({
      previousDate: oldSession.date,
      newDate: normalizedNewDate,
      reason,
      message: message || "",
    });

    // 🔹 🔟 Update session (ADMIN TZ)
    schedule.sessions[idx].date = normalizedNewDate;
    schedule.sessions[idx].start = adminStart;
    schedule.sessions[idx].end = adminEnd;

    schedule.status = "rescheduled";

    const updated = await schedule.save();

    return res.status(200).json({
      success: true,
      message: `Session ${idx + 1} rescheduled successfully`,
      data: updated,
    });
  } catch (err) {
    console.error("Reschedule error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, region } = req.query;

    if (!date || !region) {
      return res.status(400).json({
        success: false,
        message: "date and region are required",
      });
    }

    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format (YYYY-MM-DD)",
      });
    }

    // First get timezone from REGION_TIMEZONE for date conversion
    const initialTz = REGION_TIMEZONE[region];

    if (!initialTz) {
      return res.status(400).json({
        success: false,
        message: "Invalid region",
      });
    }

    const simpleDate = moment
      .tz(date, "YYYY-MM-DD", initialTz)
      .startOf("day")
      .toDate();

    // Fetch admin slot
    const adminSlot = await AdminSlot.findOne({
      date: simpleDate,
      region,
    }).lean();

    if (!adminSlot) {
      return res.status(404).json({
        success: false,
        message: "No slots found",
      });
    }

    // ✅ IMPORTANT: Use timezone saved in DB
    const tz = adminSlot.timezone;

    // Find booked sessions
    const schedules = await TherapySchedule.find({
      sessions: {
        $elemMatch: {
          date: {
            $gte: simpleDate,
            $lt: moment(simpleDate).add(1, "day").toDate(),
          },
        },
      },
      isApproved: { $in: ["pending", "approved"] },
    });

    const bookedSlots = [];

    schedules.forEach((schedule) => {
      schedule.sessions.forEach((session) => {
        const sessionDate = moment(session.date).tz(tz).format("YYYY-MM-DD");

        if (sessionDate === date) {
          bookedSlots.push(session.start);
        }
      });
    });

    const slotGroups = adminSlot.slotGroups.map((group) => ({
      startTime: group.startTime,
      endTime: group.endTime,
      slotDuration: group.slotDuration,
      slots: group.slots.map((slot) => ({
        start: slot.start,
        end: slot.end,
        isAvailable: !bookedSlots.includes(slot.start),
      })),
    }));

    return res.status(200).json({
      success: true,
      data: {
        date,
        region,
        timezone: tz, // ✅ returning timezone also
        slotGroups,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// exports.getSlotsByCategoryAndDate = async (req, res) => {
//   try {
//     const { date, categoryId, userId } = req.query;

//     if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid date format (YYYY-MM-DD)",
//       });
//     }

//     if (!categoryId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: "date, categoryId and userId are required",
//       });
//     }

//     const User = require("../models/user.model");
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const userTz = user.timeZone;

//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     let sessionDurations = [60];
//     if (category.category === "Individual Therapy") sessionDurations = [50];
//     else if (category.category === "Couples Therapy")
//       sessionDurations = [60, 90];

//     // 🔹 Get admin slots
//     const adminSlots = await AdminSlot.find({
//       date: {
//         $gte: moment(date).startOf("day").toDate(),
//         $lt: moment(date).endOf("day").toDate(),
//       },
//     }).lean();

//     if (!adminSlots.length) {
//       return res.status(200).json({
//         success: true,
//         message: "No working hours set",
//         data: {},
//       });
//     }

//     // 🔹 Get active pricing for this category
//     const pricingData = await Pricing.find({
//       categoryId: categoryId,
//       status: "active",
//     }).lean();

//     // 🔥 NEW: Get booked schedules (SOURCE OF TRUTH)
//     const bookedSchedules = await TherapySchedule.find({
//       "sessions.date": {
//         $gte: moment(date).startOf("day").toDate(),
//         $lt: moment(date).endOf("day").toDate(),
//       },
//       isApproved: { $in: ["pending", "approved"] },
//     }).lean();

//     let finalSlotGroups = [];

//     for (const adminSlot of adminSlots) {
//       const adminTz = adminSlot.timezone;

//       for (const group of adminSlot.slotGroups) {
//         if (!sessionDurations.includes(group.slotDuration)) continue;

//         const convertedSlots = group.slots.map((slot) => {
//           const adminStart = moment.tz(
//             `${date} ${slot.start}`,
//             "YYYY-MM-DD HH:mm",
//             adminTz,
//           );

//           const adminEnd = moment.tz(
//             `${date} ${slot.end}`,
//             "YYYY-MM-DD HH:mm",
//             adminTz,
//           );

//           const userStart = adminStart.clone().tz(userTz);
//           const userEnd = adminEnd.clone().tz(userTz);

//           // 🔥 CHECK REAL BOOKINGS
//           const isBooked = bookedSchedules.some((sch) =>
//             sch.sessions.some(
//               (s) =>
//                 s.start === slot.start &&
//                 moment(s.date).format("YYYY-MM-DD") === date,
//             ),
//           );

//           return {
//             start: userStart.format("HH:mm"),
//             end: userEnd.format("HH:mm"),
//             isAvailable: !isBooked,
//           };
//         });

//         finalSlotGroups.push({
//           slotDuration: group.slotDuration,
//           slots: convertedSlots,
//         });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Slots converted to user timezone",
//       data: {
//         userTimezone: userTz,
//         date,
//         pricing: pricingData,
//         slotGroups: finalSlotGroups,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Server Error",
//     });
//   }
// };

exports.getSlotsByCategoryAndDate = async (req, res) => {
  try {
    const { date, categoryId, userId } = req.query;

    if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format (YYYY-MM-DD)",
      });
    }

    if (!categoryId || !userId) {
      return res.status(400).json({
        success: false,
        message: "date, categoryId and userId are required",
      });
    }

    const User = require("../models/user.model");
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userTz = user.timeZone;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    let sessionDurations = [60];
    if (category.category === "Individual Therapy") sessionDurations = [50];
    else if (category.category === "Couples Therapy")
      sessionDurations = [60, 90];

    // ✅ STEP 1: Get ALL admin slots (Berlin + Thessaloniki)
    const allAdminSlots = await AdminSlot.find().lean();

    if (!allAdminSlots.length) {
      return res.status(200).json({
        success: true,
        message: "No working hours set",
        data: {},
      });
    }

    // ✅ STEP 2: Filter slots by timezone-safe date matching
    const adminSlots = allAdminSlots.filter((slot) => {
      const adminTz = slot.timezone;

      const startOfDayUTC = moment
        .tz(date, "YYYY-MM-DD", adminTz)
        .startOf("day")
        .utc();

      const endOfDayUTC = moment
        .tz(date, "YYYY-MM-DD", adminTz)
        .endOf("day")
        .utc();

      return moment(slot.date).isBetween(
        startOfDayUTC,
        endOfDayUTC,
        null,
        "[)"
      );
    });

    if (!adminSlots.length) {
      return res.status(200).json({
        success: true,
        message: "No working hours set",
        data: {},
      });
    }

    // ✅ Pricing
    const pricingData = await Pricing.find({
      categoryId,
      status: "active",
    }).lean();

    // ✅ Get booked schedules using same timezone-safe logic
    const bookedSchedules = await TherapySchedule.find({
      isApproved: { $in: ["pending", "approved"] },
    }).lean();

    let finalSlotGroups = [];

    for (const adminSlot of adminSlots) {
      const adminTz = adminSlot.timezone;

      for (const group of adminSlot.slotGroups) {
        if (!sessionDurations.includes(group.slotDuration)) continue;

        const convertedSlots = group.slots.map((slot) => {
          const adminStart = moment.tz(
            `${date} ${slot.start}`,
            "YYYY-MM-DD HH:mm",
            adminTz
          );

          const adminEnd = moment.tz(
            `${date} ${slot.end}`,
            "YYYY-MM-DD HH:mm",
            adminTz
          );

          const userStart = adminStart.clone().tz(userTz);
          const userEnd = adminEnd.clone().tz(userTz);

          const isBooked = bookedSchedules.some((sch) =>
            sch.sessions.some((s) => {
              const sessionStartUTC = moment(s.date).utc();
              return (
                s.start === slot.start &&
                sessionStartUTC.isSame(adminStart.clone().utc(), "minute")
              );
            })
          );

          return {
            start: userStart.format("HH:mm"),
            end: userEnd.format("HH:mm"),
            isAvailable: !isBooked,
          };
        });

        finalSlotGroups.push({
          slotDuration: group.slotDuration,
          slots: convertedSlots,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Slots converted to user timezone",
      data: {
        userTimezone: userTz,
        date,
        pricing: pricingData,
        slotGroups: finalSlotGroups,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// exports.setWorkingHours = async (req, res) => {
//   try {
//     const { date, slotGroups, region } = req.body;

//     const tz = REGION_TIMEZONE[region];

//     if (!tz) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid region",
//       });
//     }

//     if (!moment(date, "YYYY-MM-DD", true).isValid()) {
//       return res.status(400).json({ message: "Invalid date format" });
//     }

//     const simpleDate = moment
//       .tz(date, "YYYY-MM-DD", tz)
//       .startOf("day")
//       .toDate();

//     const processedSlotGroups = slotGroups.map((group) => ({
//       startTime: group.startTime,
//       endTime: group.endTime,
//       slotDuration: group.slotDuration || 60,
//       slots: generateSlots(
//         group.startTime,
//         group.endTime,
//         group.slotDuration || 60,
//       ),
//     }));

//     const updated = await AdminSlot.findOneAndUpdate(
//       { date: simpleDate, region },
//       {
//         date: simpleDate,
//         region,
//         timezone: tz, // ✅ SAVE TIMEZONE
//         slotGroups: processedSlotGroups,
//       },
//       { new: true, upsert: true },
//     );

//     res.status(200).json({ success: true, data: updated });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.setWorkingHours = async (req, res) => {
  try {
    const { date, slotGroups, region } = req.body;

    // ✅ 1. Validate region
    const tz = REGION_TIMEZONE[region];
    if (!tz) {
      return res.status(400).json({
        success: false,
        message: "Invalid region",
      });
    }

    // ✅ 2. Validate date format
    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format (YYYY-MM-DD required)",
      });
    }

    const simpleDate = moment
      .tz(date, "YYYY-MM-DD", tz)
      .startOf("day")
      .toDate();

    // ✅ 3. Prevent same date for different region
    const startOfDayUTC = moment(simpleDate).startOf("day").toDate();
    const endOfDayUTC = moment(simpleDate).endOf("day").toDate();

    const existingOtherRegion = await AdminSlot.findOne({
      date: { $gte: startOfDayUTC, $lte: endOfDayUTC },
      region: { $ne: region },
    });

    if (existingOtherRegion) {
      return res.status(400).json({
        success: false,
        message: "This date is already assigned to another region",
      });
    }

    // ✅ 4. Validate slotGroups array
    if (!Array.isArray(slotGroups) || slotGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "slotGroups must be a non-empty array",
      });
    }

    // ✅ 5. Time Conflict Validation
    for (let i = 0; i < slotGroups.length; i++) {
      const { startTime, endTime } = slotGroups[i];

      if (
        !moment(startTime, "HH:mm", true).isValid() ||
        !moment(endTime, "HH:mm", true).isValid()
      ) {
        return res.status(400).json({
          success: false,
          message: "Time must be in 24-hour HH:mm format",
        });
      }

      const start = moment(startTime, "HH:mm");
      const end = moment(endTime, "HH:mm");

      // ❌ Start must be before end
      if (start.isSameOrAfter(end)) {
        return res.status(400).json({
          success: false,
          message: "Start time must be before end time",
        });
      }

      // ❌ Check overlapping with previous groups
      for (let j = 0; j < i; j++) {
        const prevStart = moment(slotGroups[j].startTime, "HH:mm");
        const prevEnd = moment(slotGroups[j].endTime, "HH:mm");

        const isOverlap = start.isBefore(prevEnd) && end.isAfter(prevStart);

        if (isOverlap) {
          return res.status(400).json({
            success: false,
            message: "Time slot conflict detected between slot groups",
          });
        }
      }
    }

    // ✅ 6. Generate Slots
    const processedSlotGroups = slotGroups.map((group) => ({
      startTime: group.startTime,
      endTime: group.endTime,
      slotDuration: group.slotDuration || 60,
      slots: generateSlots(
        group.startTime,
        group.endTime,
        group.slotDuration || 60,
      ),
    }));

    // ✅ 7. Create or Update (Same date + region only)
    const updated = await AdminSlot.findOneAndUpdate(
      { date: simpleDate, region },
      {
        date: simpleDate,
        region,
        timezone: tz,
        slotGroups: processedSlotGroups,
      },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      success: true,
      message: "Working hours saved successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getPaymentStatusByScheduleId = async (req, res) => {
  try {
    const { therapyScheduleId } = req.params;

    // 1️⃣ Get therapy schedule
    const schedule = await TherapySchedule.findById(therapyScheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Therapy schedule not found",
      });
    }

    // 2️⃣ sessionCount from therapy DB
    const sessionCount = schedule.sessions.length;

    // 3️⃣ durationMinutes from first session
    const firstSession = schedule.sessions[0];
    const start = moment(firstSession.start, "HH:mm");
    const end = moment(firstSession.end, "HH:mm");
    const durationMinutes = end.diff(start, "minutes");

    // 4️⃣ Find pricing (SOURCE OF TRUTH)
    const pricing = await Pricing.findOne({
      categoryId: schedule.category_id,
      sessionCount,
      durationMinutes,
      status: "active",
    });

    if (!pricing) {
      return res.status(400).json({
        success: false,
        message: "Pricing not found for this therapy schedule",
      });
    }

    // 5️⃣ Payment calculation
    let paidAmount = 0;
    let dueAmount = 0;
    let dueType = null;

    if (
      schedule.paymentType === "full" ||
      schedule.paymentType === "finalPayment"
    ) {
      // FULLY PAID → NO DATA
      return res.status(200).json({
        success: true,
        message: "Payment completed",
        data: null,
      });
    }

    if (schedule.paymentType === "bookingFee") {
      paidAmount = pricing.bookingFeeAmount;
      dueAmount = pricing.finalPaymentAmount;
      dueType = "final";
    } else {
      // nothing paid
      paidAmount = 0;
      dueAmount = pricing.totalPrice;
      dueType = "full";
    }

    // 6️⃣ Send due info
    return res.status(200).json({
      success: true,
      message: "Payment pending",
      data: {
        therapyScheduleId: schedule._id,
        sessionCount,
        durationMinutes,
        totalPrice: pricing.totalPrice,
        paidAmount,
        dueAmount,
        dueType,
        currency: pricing.currency,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*

For AdminSlot
Field: date     → Ascending (1)
Field: region   → Ascending (1)


Click Create.

🔹 For TherapySchedule
Field: sessions.date → Ascending (1)

*/
