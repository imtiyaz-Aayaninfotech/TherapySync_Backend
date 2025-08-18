const Payment = require('../models/Payment.model');
const { createPayment, getPaymentStatus } = require('../services/mollie.service');
const TherapySchedule = require('../models/therapySchedule.model');


/*
exports.initiatePayment = async (req, res) => {
  try {
    const { category_id, userId, sessionPlan, price, method } = req.body;

    // Step 1 — Create payment in DB first
    const payment = await Payment.create({
      category_id,
      userId,
      sessionPlan,
      price,
      method,
      paymentStatus: 'pending'
    });

    // Step 2 — Create Mollie payment & use Mongo _id in redirect URL
    const molliePayment = await createPayment(
      price,
      `Payment for ${sessionPlan}`,
      `${process.env.CLIENT_URL}/payment-success?id=${payment._id}`, // Use Mongo id
      `${process.env.SERVER_URL}`
    );

    // Step 3 — Save Mollie transactionId in DB
    payment.transactionId = molliePayment.id;
    await payment.save();

    res.json({
      checkoutUrl: molliePayment.getCheckoutUrl(),
      payment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};
exports.paymentWebhook = async (req, res) => {
  try {
    const paymentId = req.body.id; // Mollie transaction ID
    console.log("Webhook called for payment:", paymentId);

    const mollieData = await getPaymentStatus(paymentId);

    const updatedStatus =
      mollieData.status === 'paid'
        ? 'paid'
        : (mollieData.status === 'failed' || mollieData.status === 'canceled')
        ? 'failed'
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

    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      {
        paymentStatus: updatedStatus,
        cardDetails: cardDetails,
        finalPayment: finalPayment,
      },
      { new: true }
    );

    if (!updatedPayment) {
      console.warn("No payment found to update for transactionId:", paymentId);
    } else {
      console.log("Payment updated:", updatedPayment);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send();
  }
}; */

exports.initiateBookingPayment = async (req, res) => {
  try {
    const { therapyScheduleId, method } = req.body;
    const schedule = await TherapySchedule.findById(therapyScheduleId);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    console.log("CLIENT_URL:", process.env.CLIENT_URL);
    console.log("SERVER_URL:", process.env.SERVER_URL);
    console.log("MOLLIE_API_KEY:", process.env.MOLLIE_API_KEY);

    const sessionStart = schedule.sessions[0].date;
    const hoursToSession = (new Date(sessionStart) - new Date()) / (1000 * 60 * 60);
    const totalPrice = schedule.price; // e.g. 500
    const bookingFeeAmount = 100;
    const finalPaymentAmount = totalPrice - bookingFeeAmount;

    if (!method) return res.status(400).json({ error: "Payment method required" });

    let payments = [];
    let molliePayment;
    try {
      if (hoursToSession > 48) {
        const bookingPayment = await Payment.create({
          category_id: schedule.category_id,
          userId: schedule.user,
          therapyScheduleId: schedule._id,
          sessionPlan: schedule.sessionPlan,
          price: bookingFeeAmount,
          method,
          paymentStatus: 'pending',
          paymentType: 'bookingFee',
          bookingFee: bookingFeeAmount,
        });

        molliePayment = await createPayment(
          bookingFeeAmount,
          `Booking fee for therapy schedule ${therapyScheduleId}`,
          `${process.env.CLIENT_URL}/payment-success?id=${bookingPayment._id}`,
          `${process.env.SERVER_URL}`,
          method // <-- pass method to Mollie
        );

        bookingPayment.transactionId = molliePayment.id;
        await bookingPayment.save();
        payments.push(bookingPayment);
        return res.json({
          checkoutUrl: molliePayment._links.checkout.href,
          payment: bookingPayment,
        });
      } else {
        // Only full payment allowed
        const fullPayment = await Payment.create({
          category_id: schedule.category_id,
          userId: schedule.user,
          therapyScheduleId: schedule._id,
          sessionPlan: schedule.sessionPlan,
          price: totalPrice,
          method,
          paymentStatus: 'pending',
          paymentType: 'full',
          bookingFee: bookingFeeAmount,
          finalPayment: finalPaymentAmount,
        });

        molliePayment = await createPayment(
          totalPrice,
          `Full payment for therapy schedule ${therapyScheduleId}`,
          `${process.env.CLIENT_URL}/payment-success?id=${fullPayment._id}`,
          `${process.env.SERVER_URL}`,
          method
        );

        fullPayment.transactionId = molliePayment.id;
        await fullPayment.save();
        payments.push(fullPayment);
        return res.json({
          checkoutUrl: molliePayment._links.checkout.href,
          payment: fullPayment,
        });
      }
    } catch (mollieErr) {
      console.error("Mollie payment creation error:", mollieErr);
      return res.status(500).json({ error: mollieErr.message || "Mollie payment error occurred" });
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

    console.log('Mollie data:', JSON.stringify(mollieData, null, 2)); // add debug log

    const updatedStatus = mollieData.status === 'paid' ? 'paid'
      : ['failed', 'canceled'].includes(mollieData.status) ? 'failed' : mollieData.status;

    let cardDetails = {};
    if (mollieData.details && mollieData.details.card) {
      cardDetails = {
        last4: mollieData.details.card.last4,
        brand: mollieData.details.card.brand,
        cardHolder: mollieData.details.card.cardHolder || '',
        expMonth: mollieData.details.card.expiryMonth || null,
        expYear: mollieData.details.card.expiryYear || null,
      };
    }

    const payerDetails = {
      email: mollieData.customer ? mollieData.customer.email : '',
      name: mollieData.customer ? mollieData.customer.name : '',
      locale: mollieData.locale || '',
    };

    // Calculate final payment amount from Mollie data amount.value
    const finalPaymentAmount = mollieData.amount?.value ? Number(mollieData.amount.value) : 0;

    const paymentRecord = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      {
        paymentStatus: updatedStatus,
        cardDetails,
        payerDetails,
        finalPayment: finalPaymentAmount,
      },
      { new: true }
    );

    // Confirm TherapySchedule on bookingFee paid
    if (paymentRecord && paymentRecord.paymentStatus === 'paid' && paymentRecord.paymentType === 'bookingFee') {
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


// GET /api/payments/update/:mongoId
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
