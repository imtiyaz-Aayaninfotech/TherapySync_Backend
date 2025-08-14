const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/Payment.controller');

router.post('/initiate', paymentCtrl.initiatePayment);
router.post('/webhook', paymentCtrl.paymentWebhook);
router.get('/update/:mongoId', paymentCtrl.updatePaymentFromMollie);
router.get('/:transactionId', paymentCtrl.getPaymentByTransactionId);


module.exports = router;
