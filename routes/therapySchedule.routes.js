const express = require("express");
const router = express.Router();
const controller = require("../controllers/therapySchedule.controller");
const { scheduleValidator } = require("../validations/therapySchedule.validator");
const validator = require("express-joi-validation").createValidator({});

// Admin: Set working hours
router.post("/admin/set-working-hours",controller.setWorkingHours);

// Client: Get available slots
// router.get("/available-slots", getAvailableSlots);

// Book & create schedule in one go
// router.post("/book-schedule", verifyAuth, createSchedule);

router.get("/available-slots", controller.getAvailableSlots);
router.post("/", validator.body(scheduleValidator), controller.createSchedule);
router.get("/", controller.getAllSchedules);
router.get("/:id", controller.getScheduleById);
router.patch("/:id/status", controller.updateApprovalStatus);
router.delete("/:id", controller.deleteSchedule);
router.patch("/:id/reschedule", controller.rescheduleSession);
router.put("/:id", controller.updateTherapySchedule); //general-purpose update API


module.exports = router;
