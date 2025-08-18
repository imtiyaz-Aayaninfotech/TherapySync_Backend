const MollieClient = require('@mollie/api-client').default || require('@mollie/api-client');
const mollie = new MollieClient({ apiKey: process.env.MOLLIE_API_KEY });

async function createPayment(amount, description, redirectUrl, webhookUrl) {
  try {
    const payment = await mollie.payments.create({
      amount: {
        value: amount.toFixed(2), // must be string in '10.00' format
        currency: 'EUR'
      },
      description,
      redirectUrl,
      webhookUrl,
      method: ['ideal', 'creditcard', 'paypal'] // allowed methods
    });
    return payment;
  } catch (err) {
    console.error('Mollie create payment error:', err);
    throw err;
  }
}

async function getPaymentStatus(paymentId) {
  return await mollie.payments.get(paymentId);
}

async function createRefund(paymentId, amount = null) {
  try {
    const refundOptions = amount
      ? { amount: { value: amount.toFixed(2), currency: 'EUR' } }
      : {}; // refund full if no amount specified

    const refund = await mollie.payments.refunds.createFor(paymentId, refundOptions);
    return refund;
  } catch (err) {
    console.error('Mollie refund error:', err);
    throw err;
  }
}
module.exports = { createPayment, getPaymentStatus, createRefund};
