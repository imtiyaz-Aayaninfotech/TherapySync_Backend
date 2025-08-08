const express = require('express');
const router = express.Router();
const websiteEnquiryController = require('../controllers/enquiry.controller');

// Route: /api/website-enquiries
router.get('/', websiteEnquiryController.getAllWebsiteEnquiries);
router.post('/', websiteEnquiryController.createWebsiteEnquiry);
router.delete('/:id', websiteEnquiryController.deleteWebsiteEnquiry);
router.put('/:id', websiteEnquiryController.updateWebsiteEnquiry);

module.exports = router;
