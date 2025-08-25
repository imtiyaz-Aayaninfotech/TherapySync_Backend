const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");
const TherapySchedule = require("../models/therapySchedule.model");
const DoctorInfo = require("../models/DoctorInfo.model");
const User = require("../models/user.model");
const Payment = require("../models/Payment.model");
const path = require('path');
const fs = require('fs');

exports.downloadDetailedBillPdf = async (req, res) => {
  try {
    const { therapyScheduleId } = req.query;
    if (!therapyScheduleId) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'therapyScheduleId is required',
        data: {},
      });
    }

    const scheduleId = new mongoose.Types.ObjectId(therapyScheduleId);
    const therapySchedule = await TherapySchedule.findById(scheduleId)
      .populate('user', 'name region gender language')
      .populate('category_id', 'category')
      .lean();

    if (!therapySchedule) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Therapy schedule not found',
        data: {},
      });
    }

    // Fetch active doctors' info - select only required fields
    const doctors = await DoctorInfo.find({}, 'fullName title specialization experienceYears').lean();

    // Fetch payments for this therapy schedule with status "paid"
    const payments = await Payment.find({
      therapyScheduleId: scheduleId,
      paymentStatus: 'paid',
    })
      .select('paymentType price transactionId currency createdAt')
      .sort({ createdAt: 1 })
      .lean();

    // Set HTTP headers for PDF file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Detailed_Bill_${therapyScheduleId}.pdf`
    );

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // === Functions for reusable table drawing ===
    const tableX = 50;
    const tableWidth = doc.page.width - 100;
    const rowHeight = 25;
    const paddingX = 12;

    function drawTableHeader(y, text) {
      doc.rect(tableX, y, tableWidth, rowHeight).fill('#34495e').stroke();
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14)
        .text(text, tableX + paddingX, y + 7);
    }

    function drawKeyValue(y, key, value) {
      doc.rect(tableX, y, tableWidth, rowHeight).stroke('#bdc3c7');
      doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(12)
        .text(key, tableX + paddingX, y + 7, { width: 150 });
      doc.fillColor('#2c3e50').font('Helvetica').fontSize(12)
        .text(value || '-', tableX + paddingX + 160, y + 7);
    }

    function drawPaymentRow(y, idx, payment) {
      doc.rect(tableX, y, tableWidth, rowHeight).stroke('#bdc3c7');
      doc.fillColor('#2980b9').font('Helvetica-Bold').fontSize(12)
        .text(`${idx}. ${capitalize(payment.paymentType)}`, tableX + paddingX, y + 7, { width: 120 });
      doc.fillColor('#2c3e50').font('Helvetica').fontSize(12)
        .text(`Amount: ${payment.price.toFixed(2)} ${payment.currency}`, tableX + paddingX + 130, y + 7, { width: 130 });
      doc.text(`Transaction ID: ${payment.transactionId}`, tableX + paddingX + 270, y + 7, { width: 190 });
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`, tableX + paddingX + 460, y + 7);
    }

    function capitalize(string) {
      if (!string) return '';
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // === Add logo at top center ===
    const logoPath = path.join(__dirname, '../uploads/Expat Therapy Black.jpg');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width / 2 - 90, 30, { width: 180 });
    }

    // === Title ===
    doc.moveDown(6);
    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(24).text('Detailed Therapy Appointment Bill', {
      align: 'center',
    });
    doc.moveDown(2);

    // Track Y position
    let currentY = doc.y;

    // === User Info Section ===
    drawTableHeader(currentY, 'User Information');
    currentY += rowHeight;
    drawKeyValue(currentY, 'Name', therapySchedule.user.name);
    currentY += rowHeight;
    drawKeyValue(currentY, 'Region', therapySchedule.user.region);
    currentY += rowHeight;
    drawKeyValue(currentY, 'Gender', therapySchedule.user.gender);
    currentY += rowHeight;
    drawKeyValue(currentY, 'Language', therapySchedule.user.language);
    currentY += rowHeight + 15;

    // === Therapy Schedule Section ===
    drawTableHeader(currentY, 'Therapy Schedule Details');
    currentY += rowHeight;
    drawKeyValue(currentY, 'Category', therapySchedule.category_id.category);
    currentY += rowHeight;
    drawKeyValue(currentY, 'Session Plan', capitalize(therapySchedule.sessionPlan));
    currentY += rowHeight;
    drawKeyValue(
      currentY,
      'Booking Date',
      therapySchedule.sessions?.[0]?.date
        ? new Date(therapySchedule.sessions[0].date).toLocaleDateString()
        : 'N/A'
    );
    currentY += rowHeight;
    drawKeyValue(currentY, 'Notes', therapySchedule.notes);
    currentY += rowHeight;
    drawKeyValue(currentY, 'Status', capitalize(therapySchedule.status));
    currentY += rowHeight + 15;

    // === Doctor Info Section ===
    drawTableHeader(currentY, 'Doctor Information');
    currentY += rowHeight;
    doctors.forEach((docInfo, idx) => {
      let docText = `${idx + 1}. ${docInfo.fullName} (${docInfo.title})`;
      drawKeyValue(currentY, docText, `Specialization: ${docInfo.specialization}, Experience: ${docInfo.experienceYears} years`);
      currentY += rowHeight;
    });
    currentY += 15;

    // === Payment Details ===
    drawTableHeader(currentY, 'Payment Details');
    currentY += rowHeight;
    payments.forEach((payment, idx) => {
      drawPaymentRow(currentY, idx + 1, payment);
      currentY += rowHeight;
    });
    currentY += 15;

    // === Total Paid ===
    const totalPaid = payments.reduce((sum, p) => sum + p.price, 0);
    doc.rect(tableX, currentY, tableWidth, rowHeight).fill('#f39c12');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(16).text(`Total Paid: ${totalPaid.toFixed(2)} EUR`, tableX + paddingX, currentY + 7);

    // === Footer with page number ===
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).fillColor('#95a5a6').text(`Page ${i + 1} of ${range.count}`, doc.page.width - 100, doc.page.height - 30, { align: 'right' });
    }

    doc.end();
  } catch (err) {
    console.error('downloadDetailedBillPdf error:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: err.message || 'Server Error',
        data: {},
      });
    }
    res.end();
  }
}; 

exports.getAppointmentDetails = async (req, res) => {
  try {
    const { therapyScheduleId, userId } = req.query;
    if (!therapyScheduleId && !userId) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Either therapyScheduleId or userId must be provided",
        data: {},
      });
    }

    const scheduleFilter = therapyScheduleId
      ? { _id: new mongoose.Types.ObjectId(therapyScheduleId) }
      : { user: new mongoose.Types.ObjectId(userId) };

    const therapySchedules = await TherapySchedule.find(scheduleFilter)
      .populate("user", "name region gender language")
      .lean();

    if (!therapySchedules || therapySchedules.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "No therapy schedules found",
        data: {},
      });
    }

    // Get doctor info for each schedule if linked; otherwise get all active doctors with required fields
    // Assuming doctor info is linked or needed, simplifying below
    const doctors = await DoctorInfo.find(
      {},
      { fullName: 1, title: 1, specialization: 1, experienceYears: 1 }
    ).lean();

    // Collect schedule IDs
    const scheduleIds = therapySchedules.map((sch) => sch._id);

    // Fetch and aggregate payments by therapyScheduleId and paymentType
    const payments = await Payment.aggregate([
      {
        $match: {
          therapyScheduleId: { $in: scheduleIds },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: {
            therapyScheduleId: "$therapyScheduleId",
            paymentType: "$paymentType",
          },
          totalPrice: { $sum: "$price" },
          transactionIds: { $push: "$transactionId" },
          currencies: { $addToSet: "$currency" },
          earliestDate: { $min: "$createdAt" },
          latestDate: { $max: "$createdAt" },
        },
      },
      {
        $sort: { earliestDate: 1 },
      },
    ]);

    // Map payments by therapyScheduleId for easy lookup
    const paymentsBySchedule = {};
    payments.forEach((p) => {
      const scheduleId = p._id.therapyScheduleId.toString();
      if (!paymentsBySchedule[scheduleId]) paymentsBySchedule[scheduleId] = [];
      paymentsBySchedule[scheduleId].push({
        paymentType: p._id.paymentType,
        totalPrice: p.totalPrice,
        transactionIds: p.transactionIds,
        currencies: p.currencies,
        earliestDate: p.earliestDate,
        latestDate: p.latestDate,
      });
    });

    // Format the final response
    const responseData = therapySchedules.map((sch) => ({
      therapySchedule: {
        id: sch._id,
        dateBooking: sch.sessions?.[0]?.date || null,
        sessions: sch.sessions?.map((s) => ({ start: s.start, end: s.end })) || [],
        sessionPlan: sch.sessionPlan,
        notes: sch.notes || "",
        region: sch.region,
        isPaid: sch.isPaid,
        status: sch.status,
      },
      user: sch.user,
      doctors,
      payments: paymentsBySchedule[sch._id.toString()] || [],
    }));

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Appointment details fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("getAppointmentDetails error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: error.message || "Server Error",
      data: {},
    });
  }
};

