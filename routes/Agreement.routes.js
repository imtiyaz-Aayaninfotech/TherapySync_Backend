const express = require("express");
const router = express.Router();
const agreementController = require("../controllers/Agreement.controller");

// POST /api/agreement/create
router.post("/create", agreementController.createAgreement);

// GET /api/agreement/active
router.get("/active", agreementController.getActiveAgreement);

// POST /api/agreement/accept
router.post("/accept", agreementController.acceptAgreement);

// GET /api/agreement/all (Admin)
router.get("/all", agreementController.getAllAgreements);

module.exports = router;
