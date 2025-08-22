const Doctor = require("../models/DoctorInfo.model");
const deleteFromS3 = require("../utils/aws/deleteFromS3"); 

// Create new doctor
exports.createDoctor = async (req, res) => {
  try {
    const { s3Uploads = {} } = req;

    const image = s3Uploads.image?.[0] || null;
    const consentFormUrl = s3Uploads.documents?.[0] || null;
    const videoUrl = s3Uploads.video?.[0] || null;

    const doctor = new Doctor({
      ...req.body,
      image: image,
      consentForm: {
        url: consentFormUrl,
        isAccepted: req.body.isAccepted === "true" || false,
        acceptedAt: req.body.isAccepted === "true" ? new Date() : null,
      },
      video: videoUrl,
    });

    const savedDoctor = await doctor.save();
    res.status(201).json({
      status: 200,
      success: true,
      message: "Doctor created successfully",
      data: savedDoctor,
    });
  } catch (err) {
    res.status(400).json({
      status: 400,
      success: false,
      message: err.message,
    });
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json({
      status: 200,
      success: true,
      message: 'Doctors fetched successfully',
      data: doctors,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
    });
  }
};

// Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Doctor fetched successfully',
      data: doctor,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
    });
  }
};

// Update doctor
exports.updateDoctor = async (req, res) => {
  try {
    const updated = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: 'Doctor updated successfully',
      data: updated,
    });
  } catch (err) {
    res.status(400).json({
      status: 400,
      success: false,
      message: err.message,
    });
  }
};

// Delete doctor
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ status: 404, success: false, message: "Doctor not found" });
    }

    // Delete profile image from S3
    if (doctor.image) {
      await deleteFromS3(doctor.image);
    }

    // Delete consent document from S3
    if (doctor.consentForm?.url) {
      await deleteFromS3(doctor.consentForm.url);
    }

    // Delete doctor document from DB
    await doctor.deleteOne();

    res.json({
      status: 200,
      success: true,
      message: "Doctor and related files deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 500, success: false, message: err.message });
  }
};
