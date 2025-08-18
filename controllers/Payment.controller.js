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




// GET /api/payments/update/:mongoId


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

    // BUSINESS RULE BEGIN
    const totalPrice = 500; // Always 500 for this product
    const bookingFeeAmount = 100;
    const finalPaymentAmount = 400;

    // If session is less than or equal to 48 hours away, FORCE full payment
    if (hoursToSession <= 48) {
      // Only allow full payment
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

    // If session is more than 48 hours away, offer choice
    if (paymentOption === 'full') {
      // Option 1: full payment even though >48h
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
    } else {
      // Option 2: split payment (first transaction - booking fee)
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
  } catch (err) {
    console.error("Error in initiateBookingPayment:", err);
    res.status(500).json({ error: err.message || 'Failed to initiate payment' });
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    const paymentId = req.body.id;
    const mollieData = await getPaymentStatus(paymentId);

    const updatedStatus = mollieData.status === 'paid'
      ? 'paid'
      : ['failed', 'canceled'].includes(mollieData.status)
      ? 'failed'
      : mollieData.status;

    const paymentRecord = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      {
        paymentStatus: updatedStatus,
      },
      { new: true }
    );

    if (!paymentRecord) {
      return res.status(200).send('IGNORED');
    }

    // If booking fee paid, create final payment (if split option chosen)
    if (paymentRecord.paymentType === 'bookingFee' && paymentRecord.paymentStatus === 'paid') {
      // Create final payment
      const schedule = await TherapySchedule.findById(paymentRecord.therapyScheduleId);
      const finalPaymentAmount = 400; // Always 400

      const finalPayment = await Payment.create({
        category_id: schedule.category_id,
        userId: schedule.user,
        therapyScheduleId: schedule._id,
        sessionPlan: schedule.sessionPlan,
        price: finalPaymentAmount,
        method: paymentRecord.method,
        paymentStatus: 'pending',
        paymentType: 'finalPayment',
      });

      const mollieFinal = await createPayment(
        finalPaymentAmount,
        `Final payment for therapy schedule ${schedule._id}`,
        `${process.env.CLIENT_URL}/payment-success?id=${finalPayment._id}`,
        process.env.SERVER_URL,
        paymentRecord.method,
      );

      finalPayment.transactionId = mollieFinal.id;
      await finalPayment.save();

      // Optionally notify user with mollieFinal._links.checkout.href
    }

    // If full OR final payment, mark schedule paid
    if (
      (paymentRecord.paymentType === 'full' && paymentRecord.paymentStatus === 'paid') ||
      (paymentRecord.paymentType === 'finalPayment' && paymentRecord.paymentStatus === 'paid')
    ) {
      await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
        isPaid: true,
        status: 'scheduled',
      });
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send();
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
