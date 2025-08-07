const express = require('express');
const router = express.Router();
const websiteEnquiryController = require('../controllers/websiteEnquiry.controller');

// Route: /api/website-enquiries
router.get('/', websiteEnquiryController.getAllWebsiteEnquiries);
router.post('/', websiteEnquiryController.createWebsiteEnquiry);
router.delete('/:id', websiteEnquiryController.deleteWebsiteEnquiry);

module.exports = router;
