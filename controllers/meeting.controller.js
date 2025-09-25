const Meeting = require('../models/meeting.model');

// Helper for sending consistent error responses
const sendError = (res, code, message) =>
  res.status(code).json({ success: false, message });

// Get all meetings for a user by user ID param
exports.getMeetingsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return sendError(res, 400, 'User ID required');

    const meetings = await Meeting.find({ user: userId }).sort({ scheduledAt: 1 });
    return res.json({ success: true, data: meetings });
  } catch (error) {
    console.error('Get meetings by user error:', error);
    return sendError(res, 500, 'Server error fetching meetings');
  }
};

// Get a meeting by its ID param
exports.getMeetingById = async (req, res) => {
  try {
    const meetingId = req.params.id;
    if (!meetingId) return sendError(res, 400, 'Meeting ID required');

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return sendError(res, 404, 'Meeting not found');

    return res.json({ success: true, data: meeting });
  } catch (error) {
    console.error('Get meeting by id error:', error);
    return sendError(res, 500, 'Server error fetching meeting');
  }
};

// Update meeting by ID (partial update allowed)
exports.updateMeetingById = async (req, res) => {
  try {
    const meetingId = req.params.id;
    if (!meetingId) return sendError(res, 400, 'Meeting ID required');

    const updateData = req.body;
    // Optional: validate fields in updateData here for security

    const updatedMeeting = await Meeting.findByIdAndUpdate(meetingId, updateData, { new: true });
    if (!updatedMeeting) return sendError(res, 404, 'Meeting not found');

    return res.json({ success: true, data: updatedMeeting });
  } catch (error) {
    console.error('Update meeting error:', error);
    return sendError(res, 500, 'Server error updating meeting');
  }
};

// Delete meeting by ID
exports.deleteMeetingById = async (req, res) => {
  try {
    const meetingId = req.params.id;
    if (!meetingId) return sendError(res, 400, 'Meeting ID required');

    const deletedMeeting = await Meeting.findByIdAndDelete(meetingId);
    if (!deletedMeeting) return sendError(res, 404, 'Meeting not found');

    return res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    return sendError(res, 500, 'Server error deleting meeting');
  }
};
