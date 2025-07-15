const express = require('express');
const router = express.Router();
const {
  submitCoachingEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  deleteEnquiry
} = require('../controllers/CoachingEnquiry.controller');

// User submits enquiry
router.post('/submit', submitCoachingEnquiry);

// Admin APIs
router.get('/', getAllEnquiries);
router.get('/:id', getEnquiryById);
router.put('/:id/status', updateEnquiryStatus);
router.delete('/:id', deleteEnquiry);

module.exports = router;
