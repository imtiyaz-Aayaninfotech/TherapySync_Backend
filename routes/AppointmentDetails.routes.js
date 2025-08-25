const express = require("express");
const router = express.Router();
const controller = require("../controllers/AppointmentDetails.controller");

router.get("/", controller.getAppointmentDetails);
router.get("/BillingInfoPdf", controller.downloadDetailedBillPdf);


module.exports = router;
