const Payment = require('../models/Payment.model');
const { createPayment, getPaymentStatus } = require('../services/mollie.service');

exports.initiatePayment = async (req, res) => {
  try {
    const { category_id, userId, sessionPlan, price, method } = req.body;

    const molliePayment = await createPayment(
      price,
      `Payment for ${sessionPlan}`,
      `${process.env.CLIENT_URL}/payment-success`,
      `${process.env.SERVER_URL}`
    );

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
