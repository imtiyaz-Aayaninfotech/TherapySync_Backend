const express = require("express");
const router = express.Router();
const controller = require("../controllers/therapySchedule.controller");
const { scheduleValidator } = require("../validations/therapySchedule.validator");
const validator = require("express-joi-validation").createValidator({});

router.post("/", validator.body(scheduleValidator), controller.createSchedule);
router.get("/", controller.getAllSchedules);
router.get("/:id", controller.getScheduleById);
router.patch("/:id/status", controller.updateApprovalStatus);
router.delete("/:id", controller.deleteSchedule);

module.exports = router;
