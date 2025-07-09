const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
} = require("../controllers/auth.controller");
const upload = require('../middlewares/multer.middleware');

router.post("/register",upload.single('image'),register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-otp', verifyForgotOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
