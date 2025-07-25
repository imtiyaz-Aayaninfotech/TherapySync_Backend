const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/Payment.controller");

router.post("/create", paymentController.createPayment);

module.exports = router;
