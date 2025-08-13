const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/Payment.controller');

router.post('/initiate', paymentCtrl.initiatePayment);
router.post('/webhook', paymentCtrl.paymentWebhook);

module.exports = router;
