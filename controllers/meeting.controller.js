const mongoose = require("mongoose");
const Meeting = require("../models/meeting.model");
const moment = require("moment");
const User = require("../models/user.model");
const nodemailer = require("nodemailer");
require("dotenv").config();
const TherapySchedule = require("../models/therapySchedule.model");

// Helper for sending consistent error responses
const sendError = (res, code, message) =>
  res.status(code).json({ success: false, message });

// exports.getMeetingsByUserOnly = async (req, res) => {
//   try {
//     let userId = req.params.userId?.trim();

//     if (!userId) {
//       return sendError(res, 400, "User ID required");
//     }

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return sendError(res, 400, "Invalid User ID");
//     }

//     // 🔥 Get user timezone
//     const User = require("../models/user.model");
//     const userDoc = await User.findById(userId);

//     if (!userDoc) {
//       return sendError(res, 404, "User not found");
//     }

//     const userTz = userDoc.timeZone;

//     const meetings = await Meeting.find({ user: userId }).sort({
//       scheduledAt: 1,
//     });

//     // ✅ Convert UTC → USER TIMEZONE
//     const convertedMeetings = meetings.map((meeting) => {
//       const startUserTime = moment
//         .utc(meeting.scheduledAt)
//         .tz(userTz);

//       const endUserTime = moment
//         .utc(meeting.scheduledEnd)
//         .tz(userTz);

//       return {
//         ...meeting.toObject(),
//         scheduledAt: startUserTime.format("YYYY-MM-DD HH:mm"),
//         scheduledEnd: endUserTime.format("YYYY-MM-DD HH:mm"),
//       };
//     });

//     return res.json({ success: true, data: convertedMeetings });
//   } catch (error) {
//     console.error("Get meetings by user error:", error);
//     return sendError(res, 500, "Server error fetching meetings");
//   }
// };

exports.getMeetingsByUserOnly = async (req, res) => {
  try {
    const userId = req.params.userId;

    const User = require("../models/user.model");
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const userTz = userDoc.timeZone;

    const meetings = await Meeting.find({ user: userId }).sort({ createdAt: 1 });
    const schedules = await TherapySchedule.find({ user: userId });

    const scheduleMap = {};
    schedules.forEach((s) => {
      scheduleMap[s._id.toString()] = s;
    });

    const grouped = {};

    for (const meeting of meetings) {
      const scheduleId = meeting.therapySchedule?.toString();
      const schedule = scheduleMap[scheduleId];

      if (!schedule) continue;

      if (!grouped[scheduleId]) {
        grouped[scheduleId] = {
          therapyScheduleId: scheduleId,
          meetings: [],
        };
      }

      const index = grouped[scheduleId].meetings.length;

      let finalStart = null;
      let finalEnd = null;

      // 🔥 ALWAYS use userTimeSessions by index
      const session = schedule.userTimeSessions?.[index];

      if (session) {
        const sDate = moment(session.date)
          .tz(userTz)
          .format("YYYY-MM-DD");

        finalStart = `${sDate} ${session.start}`;
        finalEnd = `${sDate} ${session.end}`;
      } else {
        // fallback → meeting original
        finalStart = moment(meeting.scheduledAt)
          .tz(userTz)
          .format("YYYY-MM-DD HH:mm");

        finalEnd = moment(meeting.scheduledEnd)
          .tz(userTz)
          .format("YYYY-MM-DD HH:mm");
      }

      grouped[scheduleId].meetings.push({
        ...meeting.toObject(),
        scheduledAt: finalStart,
        scheduledEnd: finalEnd,
      });
    }

    return res.json({
      success: true,
      data: Object.values(grouped),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMeetingsByUser = async (req, res) => {
  try {
    const { userId, therapyScheduleId } = req.params;

    if (!userId || !therapyScheduleId) {
      return sendError(res, 400, "User ID and TherapySchedule ID required");
    }

    const meetings = await Meeting.find({
      user: userId,
      therapySchedule: therapyScheduleId,
    }).sort({ scheduledAt: 1 });

    return res.json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    console.error("Get meetings by user & schedule error:", error);
    return sendError(res, 500, "Server error fetching meetings");
  }
};

// Get a meeting by its ID param
exports.getMeetingById = async (req, res) => {
  try {
    const meetingId = req.params.id;
    if (!meetingId) return sendError(res, 400, "Meeting ID required");

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return sendError(res, 404, "Meeting not found");

    return res.json({ success: true, data: meeting });
  } catch (error) {
    console.error("Get meeting by id error:", error);
    return sendError(res, 500, "Server error fetching meeting");
  }
};

// Update meeting by ID (partial update allowed)
exports.updateMeetingById = async (req, res) => {
  try {
    const meetingId = req.params.id;
    if (!meetingId) return sendError(res, 400, "Meeting ID required");

    const updateData = req.body;
    // Optional: validate fields in updateData here for security

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      updateData,
      { new: true },
    );
    if (!updatedMeeting) return sendError(res, 404, "Meeting not found");

    return res.json({ success: true, data: updatedMeeting });
  } catch (error) {
    console.error("Update meeting error:", error);
    return sendError(res, 500, "Server error updating meeting");
  }
};

// Delete meeting by ID
exports.deleteMeetingById = async (req, res) => {
  try {
    const meetingId = req.params.id;
    if (!meetingId) return sendError(res, 400, "Meeting ID required");

    const deletedMeeting = await Meeting.findByIdAndDelete(meetingId);
    if (!deletedMeeting) return sendError(res, 404, "Meeting not found");

    return res.json({ success: true, message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Delete meeting error:", error);
    return sendError(res, 500, "Server error deleting meeting");
  }
};

// Simple mail transporter (reuse your setup as needed)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Controller to send email for a single meeting id
 */
exports.sendSingleMeetingEmail = async (req, res) => {
  try {
    const meetingId = req.params.id;

    // Fetch meeting with user email and name
    const meeting = await Meeting.findById(meetingId).populate(
      "user",
      "name email",
    );
    if (!meeting || !meeting.user) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting or user not found" });
    }

    // Format scheduled start and end with local timezone display
    const scheduledAtFormatted = meeting.scheduledAt
      ? moment(meeting.scheduledAt).format("M/D/YYYY, h:mm:ss A")
      : "Not specified";

    const scheduledEndFormatted = meeting.scheduledEnd
      ? moment(meeting.scheduledEnd).format("M/D/YYYY, h:mm:ss A")
      : "Not specified";

    // Compose email HTML content
    const htmlContent = `
      <h2>Your Upcoming Therapy Session</h2>
      <p>Hello, ${meeting.user.name}</p>
      <p>Your therapy session details are as follows:</p>
      <ul>
        <li><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}" target="_blank">${meeting.meetingLink}</a></li>
        <li><strong>Scheduled At:</strong> ${scheduledAtFormatted}</li>
        <li><strong>Scheduled End:</strong> ${scheduledEndFormatted}</li>
      </ul>
      <p>Please join your session promptly via the above Zoom link.</p>
      <hr/>
      <small>This is an automated message from TherapySync. Please do not reply.</small>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: meeting.user.email,
      subject: "Your Therapy Session Scheduled - TherapySync",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: "Meeting email sent successfully" });
  } catch (error) {
    console.error("Error sending single meeting email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send meeting email" });
  }
};
