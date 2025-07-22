const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/DoctorInfo.controller");
const upload = require("../middlewares/multer.middleware");
const uploadToS3 = require('../utils/aws/uploadToS3.middleware');


// router.post("/", doctorController.createDoctor);
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 1 }, // consentForm
  ]),
  uploadToS3,
  doctorController.createDoctor
);

router.get("/", doctorController.getAllDoctors);
router.get("/:id", doctorController.getDoctorById);
router.put("/:id", doctorController.updateDoctor);
router.delete("/:id", doctorController.deleteDoctor);

module.exports = router;
