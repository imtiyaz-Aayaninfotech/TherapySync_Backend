const Payment = require('../models/Payment.model');
const { createPayment, getPaymentStatus } = require('../services/mollie.service');
const TherapySchedule = require('../models/therapySchedule.model');


// exports.initiateBookingPayment = async (req, res) => {
//   try {
//     const { therapyScheduleId, method } = req.body;
//     const schedule = await TherapySchedule.findById(therapyScheduleId);
//     if (!schedule) return res.status(404).json({ error: "Schedule not found" });

//     console.log("CLIENT_URL:", process.env.CLIENT_URL);
//     console.log("SERVER_URL:", process.env.SERVER_URL);
//     console.log("MOLLIE_API_KEY:", process.env.MOLLIE_API_KEY);

//     const sessionStart = schedule.sessions[0].date;
//     const hoursToSession = (new Date(sessionStart) - new Date()) / (1000 * 60 * 60);
//     const totalPrice = schedule.price; // e.g. 500
//     const bookingFeeAmount = 100;
//     const finalPaymentAmount = totalPrice - bookingFeeAmount;

//     if (!method) return res.status(400).json({ error: "Payment method required" });

//     let payments = [];
//     let molliePayment;
//     try {
//       if (hoursToSession > 48) {
//         const bookingPayment = await Payment.create({
//           category_id: schedule.category_id,
//           userId: schedule.user,
//           therapyScheduleId: schedule._id,
//           sessionPlan: schedule.sessionPlan,
//           price: bookingFeeAmount,
//           method,
//           paymentStatus: 'pending',
//           paymentType: 'bookingFee',
//           bookingFee: bookingFeeAmount,
//         });

//         molliePayment = await createPayment(
//           bookingFeeAmount,
//           `Booking fee for therapy schedule ${therapyScheduleId}`,
//           `${process.env.CLIENT_URL}/payment-success?id=${bookingPayment._id}`,
//           `${process.env.SERVER_URL}`,
//           method // <-- pass method to Mollie
//         );

//         bookingPayment.transactionId = molliePayment.id;
//         await bookingPayment.save();
//         payments.push(bookingPayment);
//         return res.json({
//           checkoutUrl: molliePayment._links.checkout.href,
//           payment: bookingPayment,
//         });
//       } else {
//         // Only full payment allowed
//         const fullPayment = await Payment.create({
//           category_id: schedule.category_id,
//           userId: schedule.user,
//           therapyScheduleId: schedule._id,
//           sessionPlan: schedule.sessionPlan,
//           price: totalPrice,
//           method,
//           paymentStatus: 'pending',
//           paymentType: 'full',
//           bookingFee: bookingFeeAmount,
//           finalPayment: finalPaymentAmount,
//         });

//         molliePayment = await createPayment(
//           totalPrice,
//           `Full payment for therapy schedule ${therapyScheduleId}`,
//           `${process.env.CLIENT_URL}/payment-success?id=${fullPayment._id}`,
//           `${process.env.SERVER_URL}`,
//           method
//         );

//         fullPayment.transactionId = molliePayment.id;
//         await fullPayment.save();
//         payments.push(fullPayment);
//         return res.json({
//           checkoutUrl: molliePayment._links.checkout.href,
//           payment: fullPayment,
//         });
//       }
//     } catch (mollieErr) {
//       console.error("Mollie payment creation error:", mollieErr);
//       return res.status(500).json({ error: mollieErr.message || "Mollie payment error occurred" });
//     }
//   } catch (err) {
//     console.error("Error in initiateBookingPayment:", err);
//     res.status(500).json({ error: err.message || 'Failed to initiate payment' });
//   }
// };

exports.initiateBookingPayment = async (req, res) => {
  try {
    const { therapyScheduleId, method, paymentOption } = req.body;

    // Validate input
    if (!therapyScheduleId || !method) {
      return res.status(400).json({ error: "TherapySchedule ID & method are required" });
    }

    const schedule = await TherapySchedule.findById(therapyScheduleId);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    // Calculate time to session start
    const sessionStart = schedule.sessions[0].date;
    const now = new Date();
    const hoursToSession = (new Date(sessionStart) - now) / (1000 * 60 * 60);
    const totalPrice = 500;  // Always 500 for this product
    const bookingFeeAmount = 100;
    const finalPaymentAmount = totalPrice - bookingFeeAmount; // 400

    // 1️⃣ Final payment logic for split (manual initiation)
    if (paymentOption === 'final') {
      // Check if booking fee has already been paid
      const paidBookingFee = await Payment.findOne({
        therapyScheduleId,
        paymentType: 'bookingFee',
        paymentStatus: 'paid'
      });
      if (!paidBookingFee) {
        return res.status(400).json({ error: 'Booking fee not paid yet or does not exist' });
      }
      // Check if final payment already exists to avoid duplicates
      const existingFinalPayment = await Payment.findOne({
        therapyScheduleId,
        paymentType: 'finalPayment'
      });
      if (existingFinalPayment) {
        return res.status(400).json({ error: 'Final payment already initiated' });
      }

      // Initiate final payment
      const finalPayment = await Payment.create({
        category_id: schedule.category_id,
        userId: schedule.user,
        therapyScheduleId: schedule._id,
        sessionPlan: schedule.sessionPlan,
        price: finalPaymentAmount,
        method,
        paymentType: 'finalPayment',
        paymentStatus: 'pending'
      });
      const molliePayment = await createPayment(
        finalPaymentAmount,
        `Final payment for therapy schedule ${therapyScheduleId}`,
        `${process.env.CLIENT_URL}/payment-success?id=${finalPayment._id}`,
        `${process.env.SERVER_URL}`,
        method
      );
      finalPayment.transactionId = molliePayment.id;
      await finalPayment.save();
      return res.json({
        checkoutUrl: molliePayment._links.checkout.href,
        payment: finalPayment,
      });
    }

    // 2️⃣ Full payment case (either forced or customer chooses)
    if (hoursToSession <= 48 || paymentOption === 'full') {
      const fullPayment = await Payment.create({
        category_id: schedule.category_id,
        userId: schedule.user,
        therapyScheduleId: schedule._id,
        sessionPlan: schedule.sessionPlan,
        price: totalPrice,
        method,
        paymentStatus: 'pending',
        paymentType: 'full',
      });
      const molliePayment = await createPayment(
        totalPrice,
        `Full payment for therapy schedule ${therapyScheduleId}`,
        `${process.env.CLIENT_URL}/payment-success?id=${fullPayment._id}`,
        `${process.env.SERVER_URL}`,
        method
      );
      fullPayment.transactionId = molliePayment.id;
      await fullPayment.save();
      return res.json({
        checkoutUrl: molliePayment._links.checkout.href,
        payment: fullPayment,
      });
    }

    // 3️⃣ Initial split payment (booking fee)
    if (paymentOption === 'split') {
      const bookingPayment = await Payment.create({
        category_id: schedule.category_id,
        userId: schedule.user,
        therapyScheduleId: schedule._id,
        sessionPlan: schedule.sessionPlan,
        price: bookingFeeAmount,
        method,
        paymentStatus: 'pending',
        paymentType: 'bookingFee',
      });
      const molliePayment = await createPayment(
        bookingFeeAmount,
        `Booking fee for therapy schedule ${therapyScheduleId}`,
        `${process.env.CLIENT_URL}/payment-success?id=${bookingPayment._id}`,
        `${process.env.SERVER_URL}`,
        method
      );
      bookingPayment.transactionId = molliePayment.id;
      await bookingPayment.save();
      return res.json({
        checkoutUrl: molliePayment._links.checkout.href,
        payment: bookingPayment,
      });
    }

    // If none matched, invalid option
    return res.status(400).json({ error: 'Invalid payment option or conditions not met.' });

  } catch (err) {
    console.error("Error in initiateBookingPayment:", err);
    res.status(500).json({ error: err.message || 'Failed to initiate payment' });
  }
};

/*Confirms payment updates isPaid and paymentType
Deletes schedule if no payment after 30 minutes (only if paymentType is null)
Updates schedule price by one or the sum of two payments*/

exports.paymentWebhook = async (req, res) => {
  try {
    const paymentId = req.body.id;
    const mollieData = await getPaymentStatus(paymentId);

    const updatedStatus =
      mollieData.status === "paid"
        ? "paid"
        : ["failed", "canceled"].includes(mollieData.status)
        ? "failed"
        : mollieData.status;

    const paymentRecord = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      { paymentStatus: updatedStatus },
      { new: true }
    );

    if (!paymentRecord) {
      return res.status(200).send("NO PAYMENT FOUND, IGNORED");
    }

    // Update TherapySchedule isPaid and paymentType if payment confirmed
    if (paymentRecord.paymentStatus === "paid") {
      await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
        isPaid: true,
        paymentType: paymentRecord.paymentType,
      });
    }

    // Check TherapySchedule for auto-delete case if paymentType === null & 30 min passed
    const schedule = await TherapySchedule.findById(paymentRecord.therapyScheduleId);
    if (schedule.paymentType === null) {
      const creationTime = new Date(schedule.createdAt);
      const now = new Date();
      const diffMins = (now - creationTime) / (1000 * 60);
      if (diffMins >= 30) {
        await TherapySchedule.findByIdAndDelete(schedule._id);
        // Also delete all pending payments related to this schedule
        await Payment.deleteMany({ therapyScheduleId: schedule._id });
        return res.status(200).send("AUTO-DELETED TherapySchedule after 30 minutes with no payment");
      }
    }

    // Update TherapySchedule price based on Payment count & sum
    const payments = await Payment.find({
      therapyScheduleId: paymentRecord.therapyScheduleId,
      paymentStatus: "paid",
    });

    if (payments.length === 1) {
      // Update price with single payment price
      await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
        price: payments[0].price,
      });
    } else if (payments.length === 2) {
      // Sum prices and update price
      const totalPrice = payments.reduce((sum, p) => sum + p.price, 0);
      await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
        price: totalPrice,
      });
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send("Webhook processing failed");
  }
};


exports.updatePaymentFromMollie = async (req, res) => {
  try {
    const { mongoId } = req.params;

    // 1. Find payment in Mongo
    const payment = await Payment.findById(mongoId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // 2. Fetch latest payment status from Mollie
    const mollieData = await getPaymentStatus(payment.transactionId);

    const updatedStatus =
      mollieData.status === "paid"
        ? "paid"
        : mollieData.status === "failed" || mollieData.status === "canceled"
        ? "failed"
        : mollieData.status;

    let cardDetails = {};
    if (mollieData.details && mollieData.details.card) {
      cardDetails = {
        last4: mollieData.details.card.last4,
        brand: mollieData.details.card.brand,
        cardHolder: mollieData.details.card.cardHolder,
      };
    }

    const finalPayment = mollieData.amount?.value
      ? Number(mollieData.amount.value)
      : 0;

    // 3. Update Mongo
    await Payment.findByIdAndUpdate(mongoId, {
      paymentStatus: updatedStatus,
      cardDetails: cardDetails,
      finalPayment: finalPayment,
    });

    // 4. Return updated payment
    const updatedPayment = await Payment.findById(mongoId)
      .populate("category_id")
      .populate("userId");

    res.json(updatedPayment);
  } catch (err) {
    console.error("Auto-update error:", err);
    res.status(500).json({ error: "Failed to update payment" });
  }
};



exports.getPaymentByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params; // actually Mongo _id now
    const payment = await Payment.findById(transactionId)
      .populate('category_id')
      .populate('userId');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching payment details' });
  }
};
