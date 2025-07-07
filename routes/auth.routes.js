const express = require('express');
const router = express.Router();
const { register, verifyOtp } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);

module.exports = router;
