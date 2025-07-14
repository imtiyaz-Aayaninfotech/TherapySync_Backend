const Payment = require("../models/Payment.model");
const { v4: uuidv4 } = require("uuid"); // npm install uuid
const TherapySchedule = require("../models/therapySchedule.model");


exports.createPayment = async (req, res) => {
  try {
    const {
      category_id,
      user,
      sessionPlan,
      price,
      region,
      method,
      cardDetails
    } = req.body;

    // Create Payment
    const payment = new Payment({
      category_id,
      user,
      sessionPlan,
      price,
      region,
      method,
      cardDetails: (method === "Credit Card" || method === "Debit Card") ? cardDetails : undefined,
      transactionId: uuidv4(),
      paymentStatus: "success"
    });

    const savedPayment = await payment.save();

    // Update isPaid if TherapySchedule exists with matching category_id and user
    const therapyUpdate = await TherapySchedule.findOneAndUpdate(
      { category_id, user },
      { isPaid: true },
      { new: true }
    );

    res.status(201).json({
      message: "Payment created & TherapySchedule updated",
      payment: savedPayment,
      therapySchedule: therapyUpdate
    });

  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};