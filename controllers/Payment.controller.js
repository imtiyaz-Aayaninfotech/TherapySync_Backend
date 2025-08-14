const Payment = require('../models/Payment.model');
const { createPayment, getPaymentStatus } = require('../services/mollie.service');

// exports.initiatePayment = async (req, res) => {
//   try {
//     const { category_id, userId, sessionPlan, price, method } = req.body;

//     const molliePayment = await createPayment(
//       price,
//       `Payment for ${sessionPlan}`,
//       `${process.env.CLIENT_URL}/paymentSuccess?id=${payment.id}`,
//       `${process.env.SERVER_URL}`
//     );

//     const payment = await Payment.create({
//       category_id,
//       userId,
//       sessionPlan,
//       price,
//       method,
//       transactionId: molliePayment.id,
//       paymentStatus: 'pending'
//     });

//     res.json({ checkoutUrl: molliePayment.getCheckoutUrl(), payment });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Payment initiation failed' });
//   }
// };

exports.initiatePayment = async (req, res) => {
  try {
    const { category_id, userId, sessionPlan, price, method } = req.body;

    // Step 1: Create Mollie payment. Use a temporary redirect URL if needed.
    const molliePayment = await createPayment(
      price,
      `Payment for ${sessionPlan}`,
      `${process.env.CLIENT_URL}/payment-success?id=TEMP`, // pass a placeholder for now
      `${process.env.SERVER_URL}`
    );

    // Step 2: Now you have molliePayment.id. Update the redirectUrl with the real transactionId if you want.
    // (OR: if Mollie supports updating redirect URL, do it now. If not, just accept that it's set at creation.)

    // Step 3: Create payment in DB with obtained transactionId
    const payment = await Payment.create({
      category_id,
      userId,
      sessionPlan,
      price,
      method,
      transactionId: molliePayment.id,
      paymentStatus: 'pending'
    });

    res.json({ checkoutUrl: molliePayment.getCheckoutUrl(), payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};




exports.paymentWebhook = async (req, res) => {
  try {
    const paymentId = req.body.id;
    const mollieData = await getPaymentStatus(paymentId);
    
    const updatedStatus = mollieData.status === 'paid'
      ? 'paid'
      : mollieData.status === 'failed'
      ? 'failed'
      : mollieData.status === 'canceled'
      ? 'failed'
      : mollieData.status;

    await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      { paymentStatus: updatedStatus }
    );

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send();
  }
};

exports.getPaymentByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const payment = await Payment.findOne({ transactionId })
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
