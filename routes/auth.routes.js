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
  changePassword,
  updateProfile,
} = require("../controllers/auth.controller");
const upload = require('../middlewares/multer.middleware');
const {
  validateRegisterUser,
} = require('../validations/user.validator');
const verifyAuth = require("../middlewares/auth.middleware");

router.post("/register",upload.single('image'),validateRegisterUser,register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-otp', verifyForgotOtp);
router.post('/reset-password', resetPassword);
router.post("/change-password",verifyAuth,changePassword);
router.put("/profile", verifyAuth, upload.single('image'), updateProfile);

module.exports = router;
