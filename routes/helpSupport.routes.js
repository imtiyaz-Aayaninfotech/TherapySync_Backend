const express = require("express");
const router = express.Router();
const helpSupportController = require("../controllers/helpSupport.controller");

// Create a new help support entry
router.post("/", helpSupportController.createHelpSupport);

// Retrieve all entries with pagination and search
router.get("/", helpSupportController.getAllHelpSupport);

// Retrieve a single entry by ID
router.get("/:id", helpSupportController.getHelpSupportById);

// Update any/all fields of an entry by ID
router.put("/:id", helpSupportController.updateHelpSupport);

// Delete an entry by ID
router.delete("/:id", helpSupportController.deleteHelpSupport);

// Admin: Update status only
router.patch("/status/:id", helpSupportController.updateHelpSupportStatus);

// WebsiteEnquiry
// POST /api/enquiry
router.post("/enquiry", helpSupportController.createWebsiteEnquiry);

// GET /api/enquiry
router.get("/enquiry",helpSupportController.getAllWebsiteEnquiries);

// DELETE /api/enquiry/:id
router.delete("/enquiry/:id", helpSupportController.deleteWebsiteEnquiry);

module.exports = router;
