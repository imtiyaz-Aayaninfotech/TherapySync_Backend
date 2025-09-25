const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');

// Get meetings by user ID
router.get('/user/:userId', meetingController.getMeetingsByUser);

// Get meeting by ID
router.get('/:id', meetingController.getMeetingById);

// Update meeting by ID
router.put('/:id', meetingController.updateMeetingById);

// Delete meeting by ID
router.delete('/:id', meetingController.deleteMeetingById);
router.post('/send-email/:id', meetingController.sendSingleMeetingEmail);
module.exports = router;
